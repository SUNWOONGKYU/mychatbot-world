-- @task jobs-post-type
-- @description job_postings.post_type 컬럼 — '구봇(hiring)' vs '구직(seeking)' 구분
-- Created: 2026-04-21

ALTER TABLE job_postings
    ADD COLUMN IF NOT EXISTS post_type TEXT NOT NULL DEFAULT 'hiring'
        CHECK (post_type IN ('hiring', 'seeking'));

-- 기존 공고는 모두 '구봇(hiring)'으로 간주 (기본값 'hiring'으로 이미 세팅됨)

CREATE INDEX IF NOT EXISTS idx_job_postings_post_type
    ON job_postings(post_type);

CREATE INDEX IF NOT EXISTS idx_job_postings_post_type_status_created
    ON job_postings(post_type, status, created_at DESC);

COMMENT ON COLUMN job_postings.post_type IS
    '공고 유형: hiring=구봇(일감 주는 측), seeking=구직(봇이 일감 찾는 측)';
