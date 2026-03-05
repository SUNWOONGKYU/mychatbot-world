-- @task S3DB3
-- job_reviews: 구봇구직 완료 후기 테이블
-- Created: 2026-03-05
-- Dependencies: bot_jobs, auth.users

-- ══════════════════════════════════════
-- 1. job_reviews 테이블
--    구인/구직 완료 후 상호 후기 작성
--    job_id → bot_jobs(id)
--    reviewer_id → auth.users(id) (후기 작성자)
--    reviewee_id → auth.users(id) (후기 대상자)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS job_reviews (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       UUID        NOT NULL REFERENCES bot_jobs(id) ON DELETE CASCADE,
  reviewer_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating       INTEGER     NOT NULL
               CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (job_id, reviewer_id)  -- 동일 공고에 동일 리뷰어가 중복 후기 방지
);

-- ── 인덱스: job_reviews ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_job_reviews_job_id
  ON job_reviews(job_id);

CREATE INDEX IF NOT EXISTS idx_job_reviews_reviewer_id
  ON job_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_job_reviews_reviewee_id
  ON job_reviews(reviewee_id);

CREATE INDEX IF NOT EXISTS idx_job_reviews_rating
  ON job_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_job_reviews_created_at
  ON job_reviews(created_at DESC);

-- ── RLS: job_reviews ─────────────────────────────────────────────────────────
ALTER TABLE job_reviews ENABLE ROW LEVEL SECURITY;

-- 모든 후기 공개 조회 가능
CREATE POLICY "job_reviews_select_public" ON job_reviews
  FOR SELECT
  USING (true);

-- 로그인한 사용자만 후기 작성 가능 (본인 reviewer_id로만)
CREATE POLICY "job_reviews_insert" ON job_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- 후기 작성자만 본인 후기 수정 가능
CREATE POLICY "job_reviews_update" ON job_reviews
  FOR UPDATE
  USING (auth.uid() = reviewer_id);

-- 후기 작성자만 본인 후기 삭제 가능
CREATE POLICY "job_reviews_delete" ON job_reviews
  FOR DELETE
  USING (auth.uid() = reviewer_id);

-- ── 코멘트: job_reviews ──────────────────────────────────────────────────────
COMMENT ON TABLE job_reviews IS '구봇구직 - 거래 완료 후기 테이블';
COMMENT ON COLUMN job_reviews.job_id IS '후기 대상 구인 공고 (bot_jobs FK)';
COMMENT ON COLUMN job_reviews.reviewer_id IS '후기 작성자 (auth.users FK)';
COMMENT ON COLUMN job_reviews.reviewee_id IS '후기 대상자 (auth.users FK)';
COMMENT ON COLUMN job_reviews.rating IS '평점 (1~5점)';
COMMENT ON COLUMN job_reviews.comment IS '후기 내용';
