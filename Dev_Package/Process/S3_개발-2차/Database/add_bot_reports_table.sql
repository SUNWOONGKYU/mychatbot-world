-- @task S3DB3
-- bot_reports: 신고 테이블
-- Created: 2026-03-05
-- Dependencies: auth.users

-- ══════════════════════════════════════
-- 1. bot_reports 테이블
--    봇/게시글/댓글/사용자 신고 관리
--    reporter_id → auth.users(id) (신고자)
--    reviewed_by → auth.users(id) (검토한 어드민, nullable)
--    target_type: 신고 대상 유형 (bot/post/comment/user)
--    target_id: 신고 대상 레코드 UUID
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS bot_reports (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type  TEXT        NOT NULL
               CHECK (target_type IN ('bot', 'post', 'comment', 'user')),
  target_id    UUID        NOT NULL,
  reason       TEXT        NOT NULL,   -- 신고 사유 코드 (예: 'spam', 'abuse', 'illegal')
  description  TEXT,                   -- 상세 설명
  status       TEXT        DEFAULT 'pending'
               CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ
);

-- ── 인덱스: bot_reports ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bot_reports_reporter_id
  ON bot_reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_bot_reports_target_type
  ON bot_reports(target_type);

CREATE INDEX IF NOT EXISTS idx_bot_reports_target_id
  ON bot_reports(target_id);

CREATE INDEX IF NOT EXISTS idx_bot_reports_status
  ON bot_reports(status);

CREATE INDEX IF NOT EXISTS idx_bot_reports_created_at
  ON bot_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bot_reports_reviewed_by
  ON bot_reports(reviewed_by)
  WHERE reviewed_by IS NOT NULL;

-- ── RLS: bot_reports ─────────────────────────────────────────────────────────
ALTER TABLE bot_reports ENABLE ROW LEVEL SECURITY;

-- 신고자 본인만 자신의 신고 내역 조회 가능
CREATE POLICY "bot_reports_select_own" ON bot_reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

-- 어드민 역할 보유자는 모든 신고 조회 가능
CREATE POLICY "bot_reports_select_admins" ON bot_reports
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_roles WHERE revoked_at IS NULL
    )
  );

-- 로그인한 사용자만 신고 가능 (본인 reporter_id로만)
CREATE POLICY "bot_reports_insert" ON bot_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- 신고 상태 변경은 service_role만 허용 (어드민 백엔드에서 처리)
CREATE POLICY "bot_reports_update_service" ON bot_reports
  FOR UPDATE
  USING (FALSE);  -- anon/authenticated 직접 수정 차단; service_role은 RLS bypass

-- 신고 삭제는 service_role만 허용
CREATE POLICY "bot_reports_delete_service" ON bot_reports
  FOR DELETE
  USING (FALSE);  -- anon/authenticated 직접 삭제 차단

-- ── 코멘트: bot_reports ──────────────────────────────────────────────────────
COMMENT ON TABLE bot_reports IS '어드민 - 콘텐츠/사용자 신고 관리 테이블';
COMMENT ON COLUMN bot_reports.reporter_id IS '신고자 (auth.users FK)';
COMMENT ON COLUMN bot_reports.target_type IS '신고 대상 유형: bot | post | comment | user';
COMMENT ON COLUMN bot_reports.target_id IS '신고 대상 레코드 UUID';
COMMENT ON COLUMN bot_reports.reason IS '신고 사유 코드 (예: spam, abuse, illegal_content, harassment)';
COMMENT ON COLUMN bot_reports.description IS '신고 상세 설명 (nullable)';
COMMENT ON COLUMN bot_reports.status IS '신고 처리 상태: pending(접수) | reviewed(검토 중) | resolved(처리 완료) | dismissed(기각)';
COMMENT ON COLUMN bot_reports.reviewed_by IS '신고 검토한 어드민 (auth.users FK, nullable)';
COMMENT ON COLUMN bot_reports.created_at IS '신고 접수 일시';
COMMENT ON COLUMN bot_reports.reviewed_at IS '신고 검토 완료 일시';
