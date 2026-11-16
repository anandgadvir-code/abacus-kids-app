-- ============================================================================
-- The Abacus Academy, Jodhpur - Smart Kids Learning App
-- SUPABASE TEACHER HOMEWORK & LIVE CUMULATIVE RANKING BACKEND SCHEMA
-- ============================================================================
-- Features:
-- 1. Permanent Students & Teachers Registry
-- 2. Transient Daily Homework & Submissions (48-Hour Auto-Purge to protect storage)
-- 3. Fair Decimal Scoring & Zero-Mistake Bonus (+2 / +3 / +5)
-- 4. Single-Call Batch Submission to reduce API load
-- 5. Safe 48-Hour Auto-Cleanup (NEVER reduces or resets student total_points)
-- 6. Teacher Manual Term Ranking Reset
-- ============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. STUDENTS TABLE (Permanent Score Wallet & Class Rank Registry)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    student_id TEXT PRIMARY KEY,
    admission_no TEXT UNIQUE NOT NULL,
    student_name TEXT NOT NULL,
    class_name TEXT NOT NULL, -- 'Nursery', 'LKG', 'UKG'
    mobile TEXT,
    total_points NUMERIC(10, 1) DEFAULT 0.0,
    tasks_completed INTEGER DEFAULT 0,
    badges TEXT[] DEFAULT ARRAY['Welcome Explorer 🌟']::TEXT[],
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Backward compatibility view if older code queries kids_student_stats
CREATE OR REPLACE VIEW public.kids_student_stats AS
SELECT 
    student_id,
    student_name,
    admission_no,
    class_name,
    CAST(ROUND(total_points) AS INTEGER) AS total_stars,
    tasks_completed,
    badges,
    updated_at
FROM public.students;

-- ----------------------------------------------------------------------------
-- 2. TEACHERS TABLE (Faculty Authentication & Class Access)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teachers (
    teacher_id TEXT PRIMARY KEY,
    teacher_name TEXT NOT NULL,
    mobile TEXT UNIQUE NOT NULL,
    pin TEXT NOT NULL DEFAULT '1234',
    class_name TEXT NOT NULL, -- 'Nursery', 'LKG', 'UKG', or 'All'
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ----------------------------------------------------------------------------
-- 3. DAILY HOMEWORK TABLE (Active 48-Hour Transient Tasks)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_homework (
    id TEXT PRIMARY KEY,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL, -- 'English', 'Math', 'Hindi', 'GK', 'Grammar'
    sub_topic TEXT,
    title TEXT NOT NULL,
    module_key TEXT NOT NULL,
    target_questions INTEGER NOT NULL DEFAULT 10,
    due_time TEXT DEFAULT '18:00',
    assigned_by TEXT DEFAULT 'Class Teacher',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Backward compatibility view
CREATE OR REPLACE VIEW public.kids_homework AS
SELECT 
    id,
    class_name,
    title,
    module_key,
    target_questions,
    assigned_by,
    created_at
FROM public.daily_homework;

-- ----------------------------------------------------------------------------
-- 4. HOMEWORK SUBMISSIONS TABLE (Transient Student Completion Logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.homework_submissions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    homework_id TEXT NOT NULL REFERENCES public.daily_homework(id) ON DELETE CASCADE,
    class_name TEXT NOT NULL,
    points_earned NUMERIC(6, 1) DEFAULT 0.0,
    zero_mistake_bonus NUMERIC(4, 1) DEFAULT 0.0,
    total_score NUMERIC(6, 1) DEFAULT 0.0,
    wrong_taps INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed',
    completed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Backward compatibility view
CREATE OR REPLACE VIEW public.kids_submissions AS
SELECT 
    id,
    student_id,
    homework_id,
    CAST(ROUND(total_score) AS INTEGER) AS stars_earned,
    status,
    completed_at
FROM public.homework_submissions;

-- ----------------------------------------------------------------------------
-- 5. SCHOOL SETTINGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_settings (
    setting_key TEXT PRIMARY KEY,
    setting_val TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ----------------------------------------------------------------------------
-- INDEXES FOR INSTANT LEADERBOARD & SUBMISSION QUERIES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_students_rank ON public.students(class_name, total_points DESC);
CREATE INDEX IF NOT EXISTS idx_students_adm ON public.students(admission_no);
CREATE INDEX IF NOT EXISTS idx_students_mobile ON public.students(mobile);
CREATE INDEX IF NOT EXISTS idx_homework_class_date ON public.daily_homework(class_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subs_lookup ON public.homework_submissions(homework_id, student_id);
CREATE INDEX IF NOT EXISTS idx_subs_cleanup ON public.homework_submissions(completed_at);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public students read/update" ON public.students;
CREATE POLICY "Public students read/update" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public teachers read" ON public.teachers;
CREATE POLICY "Public teachers read" ON public.teachers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public homework read/write" ON public.daily_homework;
CREATE POLICY "Public homework read/write" ON public.daily_homework FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public submissions read/write" ON public.homework_submissions;
CREATE POLICY "Public submissions read/write" ON public.homework_submissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public settings read" ON public.school_settings;
CREATE POLICY "Public settings read" ON public.school_settings FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.students TO anon, authenticated;
GRANT ALL ON public.teachers TO anon, authenticated;
GRANT ALL ON public.daily_homework TO anon, authenticated;
GRANT ALL ON public.homework_submissions TO anon, authenticated;
GRANT ALL ON public.school_settings TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. RPC: VERIFY STUDENT BY ADMISSION NO / MOBILE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kids_verify_student(p_identifier TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean TEXT := UPPER(TRIM(p_identifier));
    v_rec RECORD;
BEGIN
    SELECT * INTO v_rec FROM public.students
    WHERE UPPER(admission_no) = v_clean
       OR UPPER(student_id) = v_clean
       OR mobile = TRIM(p_identifier)
       OR UPPER(student_name) ILIKE '%' || v_clean || '%'
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'student', jsonb_build_object(
                'student_id', v_rec.student_id,
                'admission_no', v_rec.admission_no,
                'student_name', v_rec.student_name,
                'class_name', v_rec.class_name,
                'mobile', v_rec.mobile,
                'total_points', v_rec.total_points,
                'tasks_completed', v_rec.tasks_completed,
                'badges', v_rec.badges
            )
        );
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Student not found in active roll');
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.kids_verify_student(TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7. RPC: VERIFY TEACHER LOGIN (ID/Mobile + 4-Digit PIN)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kids_verify_teacher(p_identifier TEXT, p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_id TEXT := UPPER(TRIM(p_identifier));
    v_clean_pin TEXT := TRIM(p_pin);
    v_rec RECORD;
BEGIN
    -- Master admin pin check
    IF v_clean_pin IN ('1234', 'TAA2026', 'admin') AND (v_clean_id = 'ADMIN' OR v_clean_id = 'TEACHER' OR v_clean_id LIKE 'TCH-%') THEN
        SELECT * INTO v_rec FROM public.teachers WHERE UPPER(teacher_id) = v_clean_id OR mobile = p_identifier LIMIT 1;
        IF NOT FOUND THEN
            v_rec.teacher_id := COALESCE(NULLIF(p_identifier, ''), 'TCH-03');
            v_rec.teacher_name := 'Class Teacher';
            v_rec.class_name := 'UKG';
        END IF;
        RETURN jsonb_build_object(
            'success', true,
            'teacher', jsonb_build_object(
                'teacher_id', v_rec.teacher_id,
                'teacher_name', v_rec.teacher_name,
                'class_name', v_rec.class_name
            )
        );
    END IF;

    SELECT * INTO v_rec FROM public.teachers
    WHERE (UPPER(teacher_id) = v_clean_id OR mobile = TRIM(p_identifier))
      AND pin = v_clean_pin
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'teacher', jsonb_build_object(
                'teacher_id', v_rec.teacher_id,
                'teacher_name', v_rec.teacher_name,
                'class_name', v_rec.class_name
            )
        );
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Invalid Teacher ID or PIN');
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.kids_verify_teacher(TEXT, TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 8. RPC: BATCH SUBMISSION & SCORING (Atomic Wallet Update, Single API Call)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kids_submit_homework_batch(
    p_student_id TEXT,
    p_homework_id TEXT,
    p_class_name TEXT,
    p_points_earned NUMERIC,
    p_zero_mistake_bonus NUMERIC,
    p_total_score NUMERIC,
    p_wrong_taps INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_already_done BOOLEAN;
    v_new_points NUMERIC;
    v_new_tasks INTEGER;
    v_sub_id TEXT := 'SUB-' || FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::TEXT;
BEGIN
    -- Check if student already submitted this homework (One-Time Points Rule)
    SELECT EXISTS (
        SELECT 1 FROM public.homework_submissions 
        WHERE student_id = p_student_id AND homework_id = p_homework_id AND status = 'completed'
    ) INTO v_already_done;

    IF v_already_done THEN
        SELECT total_points INTO v_new_points FROM public.students WHERE student_id = p_student_id;
        RETURN jsonb_build_object(
            'success', true,
            'already_completed', true,
            'message', 'Homework already completed earlier. Practice mode: 0 ranking points awarded.',
            'total_points', COALESCE(v_new_points, 0.0)
        );
    END IF;

    -- 1. Insert submission log
    INSERT INTO public.homework_submissions (
        id, student_id, homework_id, class_name,
        points_earned, zero_mistake_bonus, total_score,
        wrong_taps, status, completed_at
    ) VALUES (
        v_sub_id, p_student_id, p_homework_id, p_class_name,
        p_points_earned, p_zero_mistake_bonus, p_total_score,
        p_wrong_taps, 'completed', NOW()
    );

    -- 2. Increment student's cumulative permanent wallet
    UPDATE public.students
    SET total_points = ROUND((total_points + p_total_score)::NUMERIC, 1),
        tasks_completed = tasks_completed + 1,
        badges = CASE 
            WHEN NOT ('Super Star 🏅' = ANY(badges)) AND (tasks_completed + 1) >= 3 THEN array_append(badges, 'Super Star 🏅')
            WHEN NOT ('Homework Hero 🚀' = ANY(badges)) AND (tasks_completed + 1) >= 5 THEN array_append(badges, 'Homework Hero 🚀')
            WHEN NOT ('Accuracy King 🎯' = ANY(badges)) AND p_zero_mistake_bonus > 0 THEN array_append(badges, 'Accuracy King 🎯')
            ELSE badges
        END,
        updated_at = NOW()
    WHERE student_id = p_student_id
    RETURNING total_points, tasks_completed INTO v_new_points, v_new_tasks;

    RETURN jsonb_build_object(
        'success', true,
        'already_completed', false,
        'submission_id', v_sub_id,
        'points_added', p_total_score,
        'total_points', v_new_points,
        'tasks_completed', v_new_tasks
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.kids_submit_homework_batch(TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, INTEGER) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 9. RPC: 48-HOUR AUTO-CLEANUP (Never reduces or resets students.total_points)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_old_kids_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_del_subs INTEGER := 0;
    v_del_hw INTEGER := 0;
BEGIN
    -- Delete submissions older than 48 hours
    DELETE FROM public.homework_submissions
    WHERE completed_at < TIMEZONE('utc', NOW()) - INTERVAL '48 hours';
    GET DIAGNOSTICS v_del_subs = ROW_COUNT;

    -- Delete daily_homework older than 48 hours
    DELETE FROM public.daily_homework
    WHERE created_at < TIMEZONE('utc', NOW()) - INTERVAL '48 hours';
    GET DIAGNOSTICS v_del_hw = ROW_COUNT;

    -- NOTE: students table is PERMANENT. total_points and rank are NEVER deleted here!
    RETURN jsonb_build_object(
        'success', true,
        'deleted_submissions', v_del_subs,
        'deleted_homework', v_del_hw,
        'permanent_points_protected', true,
        'cleaned_at', NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_old_kids_data() TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 10. RPC: MANUAL RESET OF CLASS RANKING (Teacher Dashboard Action)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_class_rankings(p_class_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INTEGER := 0;
BEGIN
    UPDATE public.students
    SET total_points = 0.0,
        tasks_completed = 0,
        updated_at = NOW()
    WHERE class_name = p_class_name;
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'class_name', p_class_name,
        'students_reset', v_updated_count,
        'reset_at', NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_class_rankings(TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 11. DEFAULT SEED DATA (Active Students & Faculty)
-- ----------------------------------------------------------------------------
INSERT INTO public.teachers (teacher_id, teacher_name, mobile, pin, class_name)
VALUES 
    ('TCH-01', 'Sunita Sharma', '9829011111', '1234', 'Nursery'),
    ('TCH-02', 'Pooja Mehta',   '9829022222', '1234', 'LKG'),
    ('TCH-03', 'Kavita Dave',   '9829033333', '1234', 'UKG')
ON CONFLICT (teacher_id) DO NOTHING;

INSERT INTO public.students (student_id, admission_no, student_name, class_name, mobile, total_points, tasks_completed, badges)
VALUES
    ('STU-101', 'ADM-101', 'Aarav Sharma', 'Nursery', '9829011111', 15.0, 1, ARRAY['Welcome Explorer 🌟']),
    ('STU-102', 'ADM-102', 'Priya Patel',  'LKG',     '9829022222', 28.5, 2, ARRAY['Welcome Explorer 🌟', 'Super Star 🏅']),
    ('STU-103', 'ADM-103', 'Aryan Verma',  'UKG',     '9829033333', 48.0, 4, ARRAY['Welcome Explorer 🌟', 'Super Star 🏅', 'Math Champion 🏆']),
    ('STU-104', 'ADM-104', 'Ananya Joshi', 'UKG',     '9829044444', 36.5, 3, ARRAY['Welcome Explorer 🌟', 'Super Star 🏅']),
    ('STU-105', 'ADM-105', 'Kabir Singh',  'LKG',     '9829055555', 20.0, 1, ARRAY['Welcome Explorer 🌟']),
    ('STU-106', 'ADM-106', 'Rohan Gehlot', 'UKG',     '9829066666', 29.2, 2, ARRAY['Welcome Explorer 🌟']),
    ('STU-107', 'ADM-107', 'Diya Rathore', 'Nursery', '9829077777', 12.0, 1, ARRAY['Welcome Explorer 🌟'])
ON CONFLICT (student_id) DO UPDATE 
SET total_points = EXCLUDED.total_points,
    student_name = EXCLUDED.student_name;

INSERT INTO public.school_settings (setting_key, setting_val)
VALUES 
    ('school_name', 'The Abacus Academy, Jodhpur'),
    ('academic_term', 'Term 2026-2027'),
    ('homework_auto_due_time', '18:00')
ON CONFLICT (setting_key) DO NOTHING;
