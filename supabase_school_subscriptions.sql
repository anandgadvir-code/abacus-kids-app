-- ============================================================================
-- REMOTE SCHOOL SUBSCRIPTIONS SCHEMA & SEED DATA
-- Table: public.school_subscriptions
-- Purpose: Remote activation/locking, subscription expiry enforcement, and
--          multi-school tenant control for Abacus Kids App.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. SCHOOL SUBSCRIPTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_subscriptions (
    udise_code TEXT PRIMARY KEY,
    school_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    valid_until DATE NOT NULL,
    max_students INTEGER NOT NULL DEFAULT 200,
    plan_name TEXT NOT NULL DEFAULT 'Standard Plan',
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_school_subscriptions_active ON public.school_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_school_subscriptions_valid ON public.school_subscriptions(valid_until);

-- ----------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS
-- ----------------------------------------------------------------------------
ALTER TABLE public.school_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public school_subscriptions read/write" ON public.school_subscriptions;
CREATE POLICY "Public school_subscriptions read/write" ON public.school_subscriptions
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

GRANT ALL ON public.school_subscriptions TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. SEED DEFAULT SCHOOL SUBSCRIPTIONS
-- ----------------------------------------------------------------------------
INSERT INTO public.school_subscriptions (udise_code, school_name, is_active, valid_until, max_students, plan_name, updated_at)
VALUES
    -- The Abacus Academy, Jodhpur (Owner Campus: Lifetime Free)
    ('08150803534', 'The Abacus Academy, Jodhpur', true, '2099-12-31', 1000, 'Owner Lifetime Free', NOW()),

    -- GR Children Academy, Jodhpur (6-Month Free Trial Plan)
    ('08150803535', 'GR Children Academy, Jodhpur', true, CURRENT_DATE + INTERVAL '6 months', 200, '6-Month Free Plan', NOW()),
    ('08150200201', 'GR Children Academy, Jodhpur', true, CURRENT_DATE + INTERVAL '6 months', 200, '6-Month Free Plan', NOW())
ON CONFLICT (udise_code) DO UPDATE SET
    school_name = EXCLUDED.school_name,
    is_active = EXCLUDED.is_active,
    valid_until = EXCLUDED.valid_until,
    max_students = EXCLUDED.max_students,
    plan_name = EXCLUDED.plan_name,
    updated_at = NOW();
