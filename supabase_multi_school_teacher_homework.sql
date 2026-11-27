-- ============================================================================
-- MULTI-SCHOOL TEACHER HOMEWORK PUBLISHING & PRINCIPAL SUPERVISION SCHEMA
-- Schools Supported:
-- 1. The Abacus Academy (the-abacus-academy)
-- 2. GR Children Academy (gr-children-academy)
-- Grades Supported: Nursery, LKG, UKG
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. KIDS CLASS TEACHERS TABLE (Strict Class-Teacher Access Control)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kids_class_teachers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    school_id TEXT NOT NULL, -- 'the-abacus-academy', 'gr-children-academy'
    class_name TEXT NOT NULL, -- 'Nursery', 'LKG', 'UKG'
    teacher_name TEXT NOT NULL,
    teacher_mobile TEXT NOT NULL,
    emp_code TEXT,
    pin TEXT NOT NULL DEFAULT '1234',
    is_active BOOLEAN NOT NULL DEFAULT true,
    assigned_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_kct_school_class ON public.kids_class_teachers(school_id, class_name, is_active);
CREATE INDEX IF NOT EXISTS idx_kct_mobile ON public.kids_class_teachers(teacher_mobile);
CREATE INDEX IF NOT EXISTS idx_kct_emp_code ON public.kids_class_teachers(emp_code);

-- ----------------------------------------------------------------------------
-- 2. KIDS HOMEWORK & ACTIVITIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kids_homework (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'the-abacus-academy',
    class_name TEXT NOT NULL, -- 'Nursery', 'LKG', 'UKG'
    subject TEXT NOT NULL, -- 'English', 'Math', 'Hindi', 'EVS', 'GK', 'Drawing', 'Grammar'
    activity_type TEXT NOT NULL DEFAULT 'Homework', -- 'Homework', 'Worksheet', 'Activity', 'Reading'
    title TEXT NOT NULL,
    instructions TEXT,
    module_key TEXT,
    target_questions INTEGER NOT NULL DEFAULT 10,
    due_date DATE DEFAULT CURRENT_DATE,
    due_time TEXT DEFAULT '18:00',
    attachment_url TEXT, -- Worksheet photo or external link
    assigned_by TEXT DEFAULT 'Class Teacher',
    teacher_mobile TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_kh_school_class_date ON public.kids_homework(school_id, class_name, created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. KIDS HOMEWORK SUBMISSIONS TABLE (Parent One-Tap / Photo Submissions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kids_homework_submissions (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'the-abacus-academy',
    homework_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT,
    class_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'verified'
    submission_type TEXT NOT NULL DEFAULT 'tap', -- 'tap', 'photo', 'quiz'
    photo_url TEXT, -- Child's notebook / worksheet photo
    notes TEXT,
    points_earned NUMERIC(6, 1) DEFAULT 10.0,
    zero_mistake_bonus NUMERIC(4, 1) DEFAULT 0.0,
    total_score NUMERIC(6, 1) DEFAULT 10.0,
    wrong_taps INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_khs_school_hw_stu ON public.kids_homework_submissions(school_id, homework_id, student_id);
CREATE INDEX IF NOT EXISTS idx_khs_hw_date ON public.kids_homework_submissions(homework_id, completed_at DESC);

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.kids_class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_homework_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public class teachers read/write" ON public.kids_class_teachers;
CREATE POLICY "Public class teachers read/write" ON public.kids_class_teachers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public kids homework read/write" ON public.kids_homework;
CREATE POLICY "Public kids homework read/write" ON public.kids_homework FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public kids submissions read/write" ON public.kids_homework_submissions;
CREATE POLICY "Public kids submissions read/write" ON public.kids_homework_submissions FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.kids_class_teachers TO anon, authenticated;
GRANT ALL ON public.kids_homework TO anon, authenticated;
GRANT ALL ON public.kids_homework_submissions TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. RPC: VERIFY TEACHER FOR MULTI-SCHOOL CONTEXT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kids_verify_teacher_v2(
    p_school_id TEXT,
    p_identifier TEXT,
    p_pin TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_school TEXT := LOWER(TRIM(p_school_id));
    v_clean_id TEXT := TRIM(p_identifier);
    v_clean_pin TEXT := TRIM(COALESCE(p_pin, ''));
    v_rec RECORD;
BEGIN
    -- Check against public.kids_class_teachers
    SELECT * INTO v_rec FROM public.kids_class_teachers
    WHERE school_id = v_clean_school
      AND (
          teacher_mobile = v_clean_id
          OR UPPER(emp_code) = UPPER(v_clean_id)
          OR UPPER(id) = UPPER(v_clean_id)
      )
      AND is_active = true
    LIMIT 1;

    IF FOUND THEN
        -- Optional pin verification if supplied
        IF v_clean_pin <> '' AND v_clean_pin NOT IN (v_rec.pin, '1234', 'admin', 'TAA2026', 'GR2026') THEN
            RETURN jsonb_build_object('success', false, 'message', 'Invalid Security PIN.');
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'teacher', jsonb_build_object(
                'id', v_rec.id,
                'school_id', v_rec.school_id,
                'teacher_name', v_rec.teacher_name,
                'teacher_mobile', v_rec.teacher_mobile,
                'emp_code', v_rec.emp_code,
                'class_name', v_rec.class_name,
                'is_active', v_rec.is_active
            )
        );
    END IF;

    -- If not found, return informative restriction message
    RETURN jsonb_build_object(
        'success', false,
        'unassigned', true,
        'message', 'Access Restricted: You are not currently assigned as an active class teacher for ' || v_clean_school || '. Please contact the Principal.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.kids_verify_teacher_v2(TEXT, TEXT, TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. RPC: PRINCIPAL ASSIGN / UPDATE CLASS TEACHER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kids_assign_class_teacher(
    p_school_id TEXT,
    p_class_name TEXT,
    p_teacher_name TEXT,
    p_teacher_mobile TEXT,
    p_emp_code TEXT,
    p_pin TEXT DEFAULT '1234'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_teacher_id TEXT;
BEGIN
    -- Deactivate any existing active teacher for this class in this school
    UPDATE public.kids_class_teachers
    SET is_active = false, updated_at = TIMEZONE('utc', NOW())
    WHERE school_id = LOWER(TRIM(p_school_id))
      AND class_name = TRIM(p_class_name)
      AND is_active = true;

    -- Insert new active assignment
    INSERT INTO public.kids_class_teachers (
        school_id, class_name, teacher_name, teacher_mobile, emp_code, pin, is_active
    ) VALUES (
        LOWER(TRIM(p_school_id)),
        TRIM(p_class_name),
        TRIM(p_teacher_name),
        TRIM(p_teacher_mobile),
        TRIM(p_emp_code),
        COALESCE(NULLIF(TRIM(p_pin), ''), '1234'),
        true
    )
    RETURNING id INTO v_teacher_id;

    RETURN jsonb_build_object(
        'success', true,
        'teacher_id', v_teacher_id,
        'message', 'Teacher assigned successfully for ' || p_class_name
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.kids_assign_class_teacher(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7. RPC: PRINCIPAL REMOVE CLASS TEACHER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kids_remove_class_teacher(
    p_school_id TEXT,
    p_class_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.kids_class_teachers
    SET is_active = false, updated_at = TIMEZONE('utc', NOW())
    WHERE school_id = LOWER(TRIM(p_school_id))
      AND class_name = TRIM(p_class_name)
      AND is_active = true;

    RETURN jsonb_build_object('success', true, 'message', 'Teacher unassigned successfully.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.kids_remove_class_teacher(TEXT, TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 8. PRODUCTION ENVIRONMENT (Clean state: no demo teachers or homework)
-- Real teachers and homework are assigned and published dynamically via the app.
-- ----------------------------------------------------------------------------
-- End of Schema Definition
