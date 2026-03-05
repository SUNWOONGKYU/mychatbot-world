-- @task S3DB3
-- admin_audit_logs: 어드민 감사 로그 테이블
-- Created: 2026-03-05
-- Dependencies: auth.users

-- ══════════════════════════════════════
-- 1. admin_audit_logs 테이블
--    어드민 액션 감사 추적 로그
--    admin_id → auth.users(id) (액션 수행 어드민)
--    target_type: 액션 대상 유형 (bot/post/comment/user/job 등)
--    target_id: 액션 대상 ID (UUID)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action       TEXT        NOT NULL,   -- 수행 액션 (예: 'ban_user', 'delete_post', 'approve_job')
  target_type  TEXT        NOT NULL,   -- 대상 유형 (예: 'user', 'post', 'comment', 'bot', 'job')
  target_id    UUID,                   -- 대상 레코드 ID (nullable: 전체 대상 액션의 경우)
  details      JSONB       DEFAULT '{}',  -- 액션 상세 정보 (이전/이후 값 등)
  ip_address   TEXT,                   -- 액션 수행 IP 주소
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 인덱스: admin_audit_logs ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id
  ON admin_audit_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action
  ON admin_audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_type
  ON admin_audit_logs(target_type);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_id
  ON admin_audit_logs(target_id)
  WHERE target_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at
  ON admin_audit_logs(created_at DESC);

-- ── RLS: admin_audit_logs ────────────────────────────────────────────────────
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 어드민 역할 보유자만 감사 로그 조회 가능
CREATE POLICY "admin_audit_logs_select_admins" ON admin_audit_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_roles WHERE revoked_at IS NULL
    )
  );

-- 감사 로그 생성은 service_role만 허용 (백엔드에서만 기록)
CREATE POLICY "admin_audit_logs_insert_service" ON admin_audit_logs
  FOR INSERT
  WITH CHECK (FALSE);  -- anon/authenticated 직접 삽입 차단; service_role은 RLS bypass

-- 감사 로그 수정 절대 금지 (불변성 보장)
CREATE POLICY "admin_audit_logs_update_deny" ON admin_audit_logs
  FOR UPDATE
  USING (FALSE);

-- 감사 로그 삭제 절대 금지 (감사 추적 보존)
CREATE POLICY "admin_audit_logs_delete_deny" ON admin_audit_logs
  FOR DELETE
  USING (FALSE);

-- ── 코멘트: admin_audit_logs ─────────────────────────────────────────────────
COMMENT ON TABLE admin_audit_logs IS '어드민 - 관리자 액션 감사 추적 로그 테이블 (불변 로그)';
COMMENT ON COLUMN admin_audit_logs.admin_id IS '액션을 수행한 어드민 (auth.users FK)';
COMMENT ON COLUMN admin_audit_logs.action IS '수행된 액션 (예: ban_user, delete_post, approve_job)';
COMMENT ON COLUMN admin_audit_logs.target_type IS '액션 대상 유형 (user | post | comment | bot | job)';
COMMENT ON COLUMN admin_audit_logs.target_id IS '액션 대상 레코드 UUID (nullable)';
COMMENT ON COLUMN admin_audit_logs.details IS '액션 상세 정보 JSONB (변경 전/후 값 등)';
COMMENT ON COLUMN admin_audit_logs.ip_address IS '액션 수행 IP 주소';
COMMENT ON COLUMN admin_audit_logs.created_at IS '액션 수행 일시 (수정/삭제 불가)';
