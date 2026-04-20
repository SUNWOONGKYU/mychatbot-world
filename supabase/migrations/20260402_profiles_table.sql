-- @task S4DB2-fix
-- @description profiles 테이블 생성 — 구직자 프로필 (skills, bio)
-- jobs/match API에서 .from('profiles').select('id, skills, bio') 참조
-- Project: MyChatbot World (MCW)
-- Created: 2026-04-01

-- ============================================================
-- TABLE: profiles
-- 사용자 프로필 — 구직자 스킬 및 소개
-- auth.users.id와 1:1 연결 (ON DELETE CASCADE)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    bio         TEXT,
    skills      TEXT[]      NOT NULL DEFAULT '{}',
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 전체 사용자 SELECT (매칭 알고리즘이 다른 사용자 프로필 조회 필요)
CREATE POLICY "profiles_select_all"
    ON profiles FOR SELECT
    USING (true);

-- 본인만 INSERT
CREATE POLICY "profiles_insert_own"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 본인만 UPDATE
CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- 본인만 DELETE
CREATE POLICY "profiles_delete_own"
    ON profiles FOR DELETE
    USING (auth.uid() = id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_skills
    ON profiles USING GIN (skills);

CREATE INDEX IF NOT EXISTS idx_profiles_updated_at
    ON profiles (updated_at DESC);

-- 신규 사용자 가입 시 profiles 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();
