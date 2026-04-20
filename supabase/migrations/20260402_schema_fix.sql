-- 스키마 버그 수정: API 코드에서 사용하는 컬럼/테이블 누락 보완
-- 버그 1: job_reviews 테이블 누락
-- 버그 2: learning_sessions에 metadata 컬럼 누락
-- 버그 3: learning_certifications에 session_id 컬럼 누락

-- ============================================================
-- FIX 1: job_reviews 테이블 생성
-- API: /api/jobs/review/route.ts 에서 사용
-- ============================================================
CREATE TABLE IF NOT EXISTS job_reviews (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID            NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    reviewer_id     UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewee_id     UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    review_type     TEXT            NOT NULL
                    CHECK (review_type IN ('employer_to_freelancer', 'freelancer_to_employer')),
    rating          NUMERIC(3, 1)   NOT NULL
                    CHECK (rating BETWEEN 0.0 AND 5.0),
    comment         TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

ALTER TABLE job_reviews ENABLE ROW LEVEL SECURITY;

-- 관련 당사자(reviewer 또는 reviewee)만 SELECT
CREATE POLICY "job_reviews_select_related"
    ON job_reviews FOR SELECT
    USING (
        auth.uid() = reviewer_id
        OR auth.uid() = reviewee_id
    );

-- 본인만 INSERT (reviewer_id 강제)
CREATE POLICY "job_reviews_insert_own"
    ON job_reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

-- 본인(reviewer)만 UPDATE
CREATE POLICY "job_reviews_update_own"
    ON job_reviews FOR UPDATE
    USING (auth.uid() = reviewer_id);

-- 본인(reviewer)만 DELETE
CREATE POLICY "job_reviews_delete_own"
    ON job_reviews FOR DELETE
    USING (auth.uid() = reviewer_id);

CREATE INDEX IF NOT EXISTS idx_job_reviews_job_id
    ON job_reviews(job_id);

CREATE INDEX IF NOT EXISTS idx_job_reviews_reviewer_id
    ON job_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_job_reviews_reviewee_id
    ON job_reviews(reviewee_id);

CREATE INDEX IF NOT EXISTS idx_job_reviews_job_reviewer_type
    ON job_reviews(job_id, reviewer_id, review_type);


-- ============================================================
-- FIX 2: learning_sessions에 metadata 컬럼 추가
-- API: /api/school/scenario/route.ts, /api/school/mentor/route.ts 에서 사용
-- ============================================================
ALTER TABLE learning_sessions
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;


-- ============================================================
-- FIX 3: learning_certifications에 session_id 컬럼 추가
-- API: /api/school/grade/route.ts 에서 사용
-- ============================================================
ALTER TABLE learning_certifications
    ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES learning_sessions(id);

CREATE INDEX IF NOT EXISTS idx_learning_certifications_session_id
    ON learning_certifications(session_id)
    WHERE session_id IS NOT NULL;
