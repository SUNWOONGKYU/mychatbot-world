-- @task S3DB3
-- bot_jobs: 챗봇 구인 등록 (구봇구직 - 구인글)
-- Created: 2026-03-05
-- Dependencies: chatbots table, auth.users

-- ══════════════════════════════════════
-- 1. bot_jobs 테이블
--    챗봇 구인 공고 등록 (구봇구직 기능)
--    owner_id → auth.users(id)
--    bot_id → chatbots(id) (구인 공고에 연결된 봇, nullable)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS bot_jobs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id           UUID        REFERENCES chatbots(id) ON DELETE SET NULL,
  title            TEXT        NOT NULL,
  description      TEXT,
  category         TEXT        DEFAULT 'general',
  job_type         TEXT        DEFAULT 'freelance'
                   CHECK (job_type IN ('freelance', 'fulltime', 'contract')),
  budget_min       INTEGER     DEFAULT 0,
  budget_max       INTEGER     DEFAULT 0,
  currency         TEXT        DEFAULT 'KRW',
  status           TEXT        DEFAULT 'open'
                   CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  required_skills  JSONB       DEFAULT '[]',
  location         TEXT        DEFAULT 'remote',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  expires_at       TIMESTAMPTZ
);

-- ── 인덱스: bot_jobs ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bot_jobs_owner_id
  ON bot_jobs(owner_id);

CREATE INDEX IF NOT EXISTS idx_bot_jobs_bot_id
  ON bot_jobs(bot_id)
  WHERE bot_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bot_jobs_status
  ON bot_jobs(status);

CREATE INDEX IF NOT EXISTS idx_bot_jobs_category
  ON bot_jobs(category);

CREATE INDEX IF NOT EXISTS idx_bot_jobs_created_at
  ON bot_jobs(created_at DESC);

-- ── RLS: bot_jobs ────────────────────────────────────────────────────────────
ALTER TABLE bot_jobs ENABLE ROW LEVEL SECURITY;

-- 전체 공개 SELECT (로그인/비로그인 모두 구인글 읽기 가능)
CREATE POLICY "bot_jobs_read" ON bot_jobs
  FOR SELECT
  USING (true);

-- 소유자만 INSERT
CREATE POLICY "bot_jobs_write" ON bot_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- 소유자만 UPDATE
CREATE POLICY "bot_jobs_update" ON bot_jobs
  FOR UPDATE
  USING (auth.uid() = owner_id);

-- 소유자만 DELETE
CREATE POLICY "bot_jobs_delete" ON bot_jobs
  FOR DELETE
  USING (auth.uid() = owner_id);

-- ── 코멘트: bot_jobs ─────────────────────────────────────────────────────────
COMMENT ON TABLE bot_jobs IS '구봇구직 - 챗봇 구인 공고 테이블';
COMMENT ON COLUMN bot_jobs.owner_id IS '구인 공고 등록자 (auth.users FK)';
COMMENT ON COLUMN bot_jobs.bot_id IS '구인 공고에 연결된 봇 (chatbots FK, nullable)';
COMMENT ON COLUMN bot_jobs.job_type IS '고용 유형: freelance(프리랜서) | fulltime(정규직) | contract(계약직)';
COMMENT ON COLUMN bot_jobs.status IS '공고 상태: open(모집 중) | in_progress(진행 중) | completed(완료) | cancelled(취소)';
COMMENT ON COLUMN bot_jobs.required_skills IS '필요 기술 목록 (JSONB 배열)';
COMMENT ON COLUMN bot_jobs.expires_at IS '공고 만료 일시 (NULL이면 만료 없음)';
