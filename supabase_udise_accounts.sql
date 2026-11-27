-- ============================================================================
-- UDISE CODE + MOBILE AUTHENTICATION & MULTI-SCHOOL ROLE ACCESS SCHEMA
-- Production School:
-- 1. The Abacus Academy (the-abacus-academy, UDISE: 08150803534)
-- Roles Supported: 'principal', 'teacher'
-- Authentication: UDISE Code + Registered Mobile Number + Self-Set Password
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. UDISE ACCOUNTS TABLE (Backbone for Principal & Teacher Login)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.udise_accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    udise_code TEXT NOT NULL,
    mobile TEXT NOT NULL,
    school_id TEXT NOT NULL DEFAULT 'the-abacus-academy',
    school_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('principal', 'teacher')),
    user_name TEXT NOT NULL,
    password_hash TEXT,
    is_password_set BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_udise_mobile UNIQUE (udise_code, mobile)
);

CREATE INDEX IF NOT EXISTS idx_udise_accounts_code ON public.udise_accounts(udise_code);
CREATE INDEX IF NOT EXISTS idx_udise_accounts_mobile ON public.udise_accounts(mobile);
CREATE INDEX IF NOT EXISTS idx_udise_accounts_code_mobile ON public.udise_accounts(udise_code, mobile);
CREATE INDEX IF NOT EXISTS idx_udise_accounts_school ON public.udise_accounts(school_id);
CREATE INDEX IF NOT EXISTS idx_udise_accounts_role ON public.udise_accounts(role);

-- ----------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS
-- ----------------------------------------------------------------------------
ALTER TABLE public.udise_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public udise_accounts read/write" ON public.udise_accounts;
CREATE POLICY "Public udise_accounts read/write" ON public.udise_accounts FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.udise_accounts TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. PRE-AUTHORIZED PRODUCTION UDISE ACCOUNTS (The Abacus Academy: 08150803534)
-- ----------------------------------------------------------------------------
INSERT INTO public.udise_accounts (udise_code, mobile, school_id, school_name, role, user_name, password_hash, is_password_set)
VALUES
    -- The Abacus Academy (Official UDISE: 08150803534)
    ('08150803534', '9829000001', 'the-abacus-academy', 'The Abacus Academy', 'principal', 'Principal - The Abacus Academy', NULL, false),
    ('08150803534', '9829011111', 'the-abacus-academy', 'The Abacus Academy', 'teacher', 'Faculty Teacher', NULL, false)
ON CONFLICT (udise_code, mobile) DO UPDATE SET
    school_name = EXCLUDED.school_name,
    user_name = EXCLUDED.user_name,
    role = EXCLUDED.role;
