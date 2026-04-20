-- @task admin-designation
-- @description profiles.is_admin 컬럼 보장 + 지정 이메일 2개 관리자 승격
-- Created: 2026-04-21

-- ============================================================
-- 1) profiles.is_admin 컬럼 (없을 경우 추가)
-- ============================================================
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_admin
    ON profiles (is_admin)
    WHERE is_admin = true;

-- ============================================================
-- 2) 지정 이메일 계정을 관리자로 승격
--    auth.users 에 존재해야 함 (해당 이메일로 회원가입 완료 후 실행)
-- ============================================================
UPDATE profiles
   SET is_admin = true,
       updated_at = NOW()
 WHERE id IN (
     SELECT id FROM auth.users
      WHERE email IN ('wksun999@gmail.com', 'wksun999@naver.com')
 );

-- ============================================================
-- 3) 아직 회원가입 전이어도 가입 즉시 관리자로 자동 승격되도록
--    handle_new_user_profile 트리거 확장
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_is_admin BOOLEAN := false;
BEGIN
    -- 지정 이메일이면 가입 시점에 관리자 플래그 ON
    IF NEW.email IN ('wksun999@gmail.com', 'wksun999@naver.com') THEN
        v_is_admin := true;
    END IF;

    INSERT INTO public.profiles (id, display_name, is_admin, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        v_is_admin,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
        SET is_admin = EXCLUDED.is_admin OR profiles.is_admin;
    RETURN NEW;
END;
$$;

-- ============================================================
-- 확인용 (실행 후 결과 확인):
--   SELECT u.email, p.is_admin
--     FROM profiles p JOIN auth.users u ON u.id = p.id
--    WHERE u.email IN ('wksun999@gmail.com','wksun999@naver.com');
-- ============================================================
