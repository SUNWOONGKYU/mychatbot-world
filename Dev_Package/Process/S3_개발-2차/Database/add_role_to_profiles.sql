-- @task S3DB3
-- profiles 테이블에 role 컬럼 추가
-- Created: 2026-03-05
-- Dependencies: profiles 테이블 (기존 존재 가정)

-- ══════════════════════════════════════
-- 1. profiles 테이블 role 컬럼 추가
--    사용자 역할 구분을 위한 컬럼
--    기본값: 'user' (일반 사용자)
--    어드민 역할은 admin_roles 테이블과 병행 관리
-- ══════════════════════════════════════
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
  CHECK (role IN ('user', 'admin', 'super_admin', 'moderator'));

-- ── 인덱스: profiles.role ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles(role)
  WHERE role != 'user';  -- 일반 사용자 제외, 어드민 역할만 인덱싱

-- ── 코멘트: profiles.role ────────────────────────────────────────────────────
COMMENT ON COLUMN profiles.role IS '사용자 역할: user(일반 사용자) | admin(관리자) | super_admin(최고 관리자) | moderator(모더레이터)';

-- ══════════════════════════════════════
-- 2. 기존 profiles 데이터 마이그레이션
--    기존 레코드의 role을 'user'로 초기화
-- ══════════════════════════════════════
UPDATE profiles
  SET role = 'user'
  WHERE role IS NULL;
