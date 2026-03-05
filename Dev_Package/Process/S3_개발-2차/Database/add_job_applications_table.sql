-- @task S3DB3
-- job_applications: 구봇구직 지원 테이블
-- Created: 2026-03-05
-- Dependencies: bot_jobs, chatbots, auth.users

-- ══════════════════════════════════════
-- 1. job_applications 테이블
--    구인 공고에 대한 지원 기록
--    job_id → bot_jobs(id)
--    applicant_id → auth.users(id) (지원자)
--    bot_id → chatbots(id) (지원에 사용할 봇, nullable)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS job_applications (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID        NOT NULL REFERENCES bot_jobs(id) ON DELETE CASCADE,
  applicant_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id        UUID        REFERENCES chatbots(id) ON DELETE SET NULL,
  cover_letter  TEXT,
  status        TEXT        DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'rejected')),
  applied_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ,
  UNIQUE (job_id, applicant_id)  -- 동일 공고에 중복 지원 방지
);

-- ── 인덱스: job_applications ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id
  ON job_applications(job_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id
  ON job_applications(applicant_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_status
  ON job_applications(status);

CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at
  ON job_applications(applied_at DESC);

-- ── RLS: job_applications ────────────────────────────────────────────────────
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- 지원자 본인 또는 공고 소유자가 지원서 조회 가능
CREATE POLICY "job_applications_select_own" ON job_applications
  FOR SELECT
  USING (
    auth.uid() = applicant_id
    OR
    auth.uid() IN (SELECT owner_id FROM bot_jobs WHERE id = job_id)
  );

-- 로그인한 사용자만 지원 가능 (본인 applicant_id로만)
CREATE POLICY "job_applications_insert" ON job_applications
  FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

-- 공고 소유자만 지원 상태 변경 가능 (수락/거절)
CREATE POLICY "job_applications_update_owner" ON job_applications
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT owner_id FROM bot_jobs WHERE id = job_id)
  );

-- 지원자 본인만 지원 취소(삭제) 가능
CREATE POLICY "job_applications_delete" ON job_applications
  FOR DELETE
  USING (auth.uid() = applicant_id);

-- ── 코멘트: job_applications ─────────────────────────────────────────────────
COMMENT ON TABLE job_applications IS '구봇구직 - 구인 공고 지원 테이블';
COMMENT ON COLUMN job_applications.job_id IS '지원한 구인 공고 (bot_jobs FK)';
COMMENT ON COLUMN job_applications.applicant_id IS '지원자 (auth.users FK)';
COMMENT ON COLUMN job_applications.bot_id IS '지원에 사용할 챗봇 (chatbots FK, nullable)';
COMMENT ON COLUMN job_applications.cover_letter IS '지원 메시지/자기소개';
COMMENT ON COLUMN job_applications.status IS '지원 상태: pending(검토 중) | accepted(수락) | rejected(거절)';
COMMENT ON COLUMN job_applications.applied_at IS '지원 일시';
COMMENT ON COLUMN job_applications.reviewed_at IS '공고 소유자 검토 일시';
