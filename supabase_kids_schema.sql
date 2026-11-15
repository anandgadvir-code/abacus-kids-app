-- ========================================================
-- The Abacus Academy, Jodhpur - Kids App Backend Schema
-- Ultra-Lightweight (Zero-Load, Text/Integer only, Zero-Media)
-- 48-Hour Auto-Cleanup System & Permanent Stats
-- ========================================================

-- 1. kids_student_stats (Permanent Table: 1 row per student)
-- Retains stars, badges, and class rank permanently
CREATE TABLE IF NOT EXISTS public.kids_student_stats (
    student_id TEXT PRIMARY KEY,
    student_name TEXT NOT NULL,
    admission_no TEXT,
    class_name TEXT NOT NULL,
    total_stars INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    badges TEXT[] DEFAULT ARRAY['Welcome Explorer 🌟']::TEXT[],
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. kids_homework (Transient Table: Auto-deleted after 48 hours)
CREATE TABLE IF NOT EXISTS public.kids_homework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_name TEXT NOT NULL,
    title TEXT NOT NULL,
    module_key TEXT NOT NULL,
    target_questions INTEGER DEFAULT 10,
    assigned_by TEXT DEFAULT 'Class Teacher',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. kids_submissions (Transient Table: Auto-deleted after 48 hours)
CREATE TABLE IF NOT EXISTS public.kids_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    homework_id UUID REFERENCES public.kids_homework(id) ON DELETE CASCADE,
    stars_earned INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed',
    completed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_kids_stats_class ON public.kids_student_stats(class_name, total_stars DESC);
CREATE INDEX IF NOT EXISTS idx_kids_hw_class ON public.kids_homework(class_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kids_subs_hw ON public.kids_submissions(homework_id, student_id);
CREATE INDEX IF NOT EXISTS idx_kids_subs_date ON public.kids_submissions(completed_at);

-- Enable RLS
ALTER TABLE public.kids_student_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_submissions ENABLE ROW LEVEL SECURITY;

-- Permissive policies for anon/authenticated (controlled by app and RPC)
DROP POLICY IF EXISTS "Anon kids stats select" ON public.kids_student_stats;
CREATE POLICY "Anon kids stats select" ON public.kids_student_stats FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon kids homework" ON public.kids_homework;
CREATE POLICY "Anon kids homework" ON public.kids_homework FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon kids submissions" ON public.kids_submissions;
CREATE POLICY "Anon kids submissions" ON public.kids_submissions FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.kids_student_stats TO anon, authenticated;
GRANT ALL ON public.kids_homework TO anon, authenticated;
GRANT ALL ON public.kids_submissions TO anon, authenticated;

-- ========================================================
-- Automatic 48-Hour (2-Day) Cleanup Function
-- ========================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_kids_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_subs INTEGER := 0;
    deleted_hw INTEGER := 0;
BEGIN
    -- Delete submissions older than 48 hours (2 days)
    DELETE FROM public.kids_submissions
    WHERE completed_at < TIMEZONE('utc', NOW()) - INTERVAL '48 hours';
    GET DIAGNOSTICS deleted_subs = ROW_COUNT;

    -- Delete homework older than 48 hours (2 days)
    DELETE FROM public.kids_homework
    WHERE created_at < TIMEZONE('utc', NOW()) - INTERVAL '48 hours';
    GET DIAGNOSTICS deleted_hw = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'deleted_submissions', deleted_subs,
        'deleted_homework', deleted_hw,
        'cleaned_at', NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_old_kids_data() TO anon, authenticated;

-- Optional: If pg_cron extension is available in Supabase
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.unschedule('cleanup-kids-48h');
        PERFORM cron.schedule('cleanup-kids-48h', '0 2 * * *', 'SELECT public.cleanup_old_kids_data()');
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$;

-- ========================================================
-- RPC: Verify Student from Main ERP students table
-- ========================================================
CREATE OR REPLACE FUNCTION public.kids_verify_student(p_identifier TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_id TEXT;
    v_student RECORD;
    v_class_name TEXT := 'Nursery';
    v_stats RECORD;
BEGIN
    v_clean_id := TRIM(p_identifier);
    IF v_clean_id IS NULL OR v_clean_id = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Please enter Admission No. or Mobile No.');
    END IF;

    -- Look up in ERP students table
    SELECT s.id, s.student_name, s.admission_no, s.mobile, s.status, s.class_id, c.class_name
    INTO v_student
    FROM public.students s
    LEFT JOIN public.classes c ON c.id = s.class_id
    WHERE (
        LOWER(s.admission_no) = LOWER(v_clean_id)
        OR s.mobile = v_clean_id
        OR s.mobile = '91' || v_clean_id
        OR ('91' || s.mobile) = v_clean_id
    )
    AND LOWER(COALESCE(s.status, 'active')) = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;

    IF v_student.id IS NULL THEN
        -- Check if student already exists in kids_student_stats directly
        SELECT * INTO v_stats FROM public.kids_student_stats
        WHERE LOWER(admission_no) = LOWER(v_clean_id) OR student_id = v_clean_id
        LIMIT 1;

        IF v_stats.student_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', true,
                'student', jsonb_build_object(
                    'student_id', v_stats.student_id,
                    'student_name', v_stats.student_name,
                    'admission_no', v_stats.admission_no,
                    'class_name', v_stats.class_name,
                    'total_stars', COALESCE(v_stats.total_stars, 0),
                    'tasks_completed', COALESCE(v_stats.tasks_completed, 0),
                    'badges', COALESCE(v_stats.badges, ARRAY['Welcome Explorer 🌟']::TEXT[])
                )
            );
        END IF;

        RETURN jsonb_build_object('success', false, 'error', 'Active student not found with Admission/Mobile: ' || v_clean_id);
    END IF;

    -- Determine normalized class name (Nursery, LKG, UKG)
    IF v_student.class_name ILIKE '%ukg%' OR v_student.class_name ILIKE '%prep%' THEN
        v_class_name := 'UKG';
    ELSIF v_student.class_name ILIKE '%lkg%' OR v_student.class_name ILIKE '%kg%' THEN
        v_class_name := 'LKG';
    ELSE
        v_class_name := 'Nursery';
    END IF;

    -- Upsert permanent student stats row if not exists
    INSERT INTO public.kids_student_stats (student_id, student_name, admission_no, class_name, total_stars, tasks_completed, badges)
    VALUES (
        v_student.id::TEXT,
        v_student.student_name,
        v_student.admission_no,
        v_class_name,
        0,
        0,
        ARRAY['Welcome Explorer 🌟']::TEXT[]
    )
    ON CONFLICT (student_id) DO UPDATE
    SET student_name = EXCLUDED.student_name,
        class_name = EXCLUDED.class_name,
        admission_no = EXCLUDED.admission_no
    RETURNING * INTO v_stats;

    RETURN jsonb_build_object(
        'success', true,
        'student', jsonb_build_object(
            'student_id', v_student.id::TEXT,
            'student_name', v_student.student_name,
            'admission_no', v_student.admission_no,
            'class_name', v_class_name,
            'total_stars', COALESCE(v_stats.total_stars, 0),
            'tasks_completed', COALESCE(v_stats.tasks_completed, 0),
            'badges', COALESCE(v_stats.badges, ARRAY['Welcome Explorer 🌟']::TEXT[])
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.kids_verify_student(TEXT) TO anon, authenticated;

-- ========================================================
-- RPC: Submit Homework & Update Permanent Stats
-- ========================================================
CREATE OR REPLACE FUNCTION public.kids_submit_homework_record(
    p_student_id TEXT,
    p_homework_id UUID,
    p_stars_earned INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats RECORD;
    v_new_stars INTEGER;
    v_new_tasks INTEGER;
    v_badges TEXT[];
    v_rank INTEGER := 1;
BEGIN
    -- 1. Insert 48-hr transient submission
    IF p_homework_id IS NOT NULL THEN
        INSERT INTO public.kids_submissions (student_id, homework_id, stars_earned, status, completed_at)
        VALUES (p_student_id, p_homework_id, GREATEST(p_stars_earned, 1), 'completed', TIMEZONE('utc', NOW()));
    END IF;

    -- 2. Update permanent stats
    SELECT * INTO v_stats FROM public.kids_student_stats WHERE student_id = p_student_id;
    IF v_stats.student_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Student stats not found');
    END IF;

    v_new_stars := COALESCE(v_stats.total_stars, 0) + GREATEST(p_stars_earned, 1);
    v_new_tasks := COALESCE(v_stats.tasks_completed, 0) + 1;
    v_badges := COALESCE(v_stats.badges, ARRAY['Welcome Explorer 🌟']::TEXT[]);

    IF NOT ('Super Star 🏅' = ANY(v_badges)) THEN
        v_badges := array_append(v_badges, 'Super Star 🏅');
    END IF;
    IF v_new_stars >= 50 AND NOT ('Math Champion 🏆' = ANY(v_badges)) THEN
        v_badges := array_append(v_badges, 'Math Champion 🏆');
    END IF;

    UPDATE public.kids_student_stats
    SET total_stars = v_new_stars,
        tasks_completed = v_new_tasks,
        badges = v_badges,
        updated_at = TIMEZONE('utc', NOW())
    WHERE student_id = p_student_id;

    -- Compute class rank
    SELECT COUNT(*) + 1 INTO v_rank
    FROM public.kids_student_stats
    WHERE class_name = v_stats.class_name AND total_stars > v_new_stars;

    RETURN jsonb_build_object(
        'success', true,
        'total_stars', v_new_stars,
        'tasks_completed', v_new_tasks,
        'badges', v_badges,
        'class_rank', v_rank,
        'class_name', v_stats.class_name
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.kids_submit_homework_record(TEXT, UUID, INTEGER) TO anon, authenticated;
