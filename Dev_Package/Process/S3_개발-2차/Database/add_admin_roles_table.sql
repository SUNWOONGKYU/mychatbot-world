-- @task S3DB3
-- admin_roles: 어드민 역할 테이블
-- Created: 2026-03-05
-- Dependencies: auth.users

-- ══════════════════════════════════════
-- 1. admin_roles 테이블
--    어드민 역할 및 권한 관리
--    user_id → auth.users(id) (UNIQUE: 사용자당 하나의 역할)
--    granted_by → auth.users(id) (권한 부여자)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS admin_roles (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT        NOT NULL
               CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions  JSONB       DEFAULT '{}',  -- 세부 권한 JSON (예: {"can_ban": true, "can_delete_posts": true})
  granted_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at   TIMESTAMPTZ DEFAULT NOW(),
  revoked_at   TIMESTAMPTZ  -- NULL이면 현재 활성화된 역할
);

-- ── 인덱스: admin_roles ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id
  ON admin_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_roles_role
  ON admin_roles(role);

CREATE INDEX IF NOT EXISTS idx_admin_roles_active
  ON admin_roles(user_id)
  WHERE revoked_at IS NULL;

-- ── RLS: admin_roles ─────────────────────────────────────────────────────────
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- 본인 역할 조회 허용 (사용자가 자신의 어드민 역할 확인 가능)
CREATE POLICY "admin_roles_select_own" ON admin_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 어드민 역할 보유자만 다른 어드민 목록 조회 가능
CREATE POLICY "admin_roles_select_admins" ON admin_roles
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_roles WHERE revoked_at IS NULL
    )
  );

-- 어드민 역할 부여/등록은 service_role만 허용 (anon/authenticated 차단)
-- service_role은 RLS bypass이므로 별도 정책 불필요
CREATE POLICY "admin_roles_insert_service" ON admin_roles
  FOR INSERT
  WITH CHECK (FALSE);  -- anon/authenticated 직접 등록 차단

-- 역할 수정도 service_role만 허용
CREATE POLICY "admin_roles_update_service" ON admin_roles
  FOR UPDATE
  USING (FALSE);  -- anon/authenticated 직접 수정 차단

-- 역할 삭제도 service_role만 허용
CREATE POLICY "admin_roles_delete_service" ON admin_roles
  FOR DELETE
  USING (FALSE);  -- anon/authenticated 직접 삭제 차단

-- ── 코멘트: admin_roles ──────────────────────────────────────────────────────
COMMENT ON TABLE admin_roles IS '어드민 - 관리자 역할 및 권한 테이블';
COMMENT ON COLUMN admin_roles.user_id IS '어드민 역할을 가진 사용자 (auth.users FK, UNIQUE)';
COMMENT ON COLUMN admin_roles.role IS '어드민 역할: super_admin(최고 관리자) | admin(관리자) | moderator(모더레이터)';
COMMENT ON COLUMN admin_roles.permissions IS '세부 권한 목록 (JSONB, 예: {"can_ban": true, "can_delete_posts": true})';
COMMENT ON COLUMN admin_roles.granted_by IS '역할 부여자 (auth.users FK, nullable)';
COMMENT ON COLUMN admin_roles.granted_at IS '역할 부여 일시';
COMMENT ON COLUMN admin_roles.revoked_at IS '역할 철회 일시 (NULL이면 현재 활성 역할)';
