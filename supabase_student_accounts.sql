-- ============================================================================
-- Supabase Schema for Student / Parent Accounts & Rewards
-- Table: public.kids_students
-- Production Clean Schema (No fake/demo students)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kids_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login_id TEXT UNIQUE NOT NULL, -- Student ID or Parent Mobile
    password_hash TEXT NOT NULL, -- SHA-256 hash or plain text for initial setup
    student_name TEXT NOT NULL,
    student_class TEXT NOT NULL CHECK (student_class IN ('Nursery', 'LKG', 'UKG')),
    school_id TEXT NOT NULL DEFAULT 'the-abacus-academy',
    school_name TEXT NOT NULL DEFAULT 'The Abacus Academy',
    points NUMERIC(10,1) NOT NULL DEFAULT 0.0,
    stars NUMERIC(10,1) NOT NULL DEFAULT 0.0,
    badges JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g. ["🌟 Homework Star", "🏆 Quiz Champ"]
    tasks_completed JSONB NOT NULL DEFAULT '[]'::jsonb, -- list of homework IDs completed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup on login_id
CREATE INDEX IF NOT EXISTS idx_kids_students_login_id ON public.kids_students(login_id);
CREATE INDEX IF NOT EXISTS idx_kids_students_school_class ON public.kids_students(school_id, student_class);

-- Enable RLS
ALTER TABLE public.kids_students ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated clients full access for kids app offline/kiosk sync
DROP POLICY IF EXISTS "Public access kids_students" ON public.kids_students;
CREATE POLICY "Public access kids_students" ON public.kids_students
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
