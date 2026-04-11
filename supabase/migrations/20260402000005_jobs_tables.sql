-- @task S3DB1
-- @description School/Skills/Jobs 추가 테이블 마이그레이션 — Jobs (수익활동) 섹션
-- Project: MyChatbot World (MCW)
-- Created: 2026-04-02

-- ============================================================
-- TABLE: job_postings
-- 채용 공고 — 고용주(employer)가 게시하는 프리랜서 채용 공고
-- ============================================================
CREATE TABLE IF NOT EXISTS job_postings (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title           TEXT        NOT NULL,
    description     TEXT,
    required_skills TEXT[],
    budget_min      INT,
    budget_max      INT,
    status          TEXT        NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'closed', 'filled')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: job_postings
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- 전체 SELECT (공개 채용 공고)
CREATE POLICY "job_postings_select_all"
    ON job_postings FOR SELECT
    USING (true);

-- employer만 INSERT (본인 employer_id 강제)
CREATE POLICY "job_postings_insert_own"
    ON job_postings FOR INSERT
    WITH CHECK (auth.uid() = employer_id);

-- employer만 UPDATE (본인 공고만)
CREATE POLICY "job_postings_update_own"
    ON job_postings FOR UPDATE
    USING (auth.uid() = employer_id);

-- Indexes: job_postings
CREATE INDEX IF NOT EXISTS idx_job_postings_employer_id
    ON job_postings(employer_id);

CREATE INDEX IF NOT EXISTS idx_job_postings_status
    ON job_postings(status);

CREATE INDEX IF NOT EXISTS idx_job_postings_status_created_at
    ON job_postings(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_postings_required_skills
    ON job_postings USING GIN (required_skills);


-- ============================================================
-- TABLE: job_matches
-- AI 매칭 결과 — 채용 공고와 지원자 간 AI 매칭 점수
-- ============================================================
CREATE TABLE IF NOT EXISTS job_matches (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID            NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    applicant_id    UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_score     NUMERIC(5, 2)
                    CHECK (match_score BETWEEN 0.00 AND 100.00),
    matched_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    status          TEXT            NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'hired', 'rejected'))
);

-- RLS: job_matches
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;

-- employer(공고주)도 지원자(applicant)도 본인 관련 매칭만 SELECT
CREATE POLICY "job_matches_select_related"
    ON job_matches FOR SELECT
    USING (
        auth.uid() = applicant_id
        OR auth.uid() = (
            SELECT employer_id FROM job_postings WHERE id = job_id
        )
    );

-- 시스템(service_role)만 INSERT — AI 매칭 엔진에서 삽입
CREATE POLICY "job_matches_insert_service"
    ON job_matches FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Indexes: job_matches
CREATE INDEX IF NOT EXISTS idx_job_matches_job_id
    ON job_matches(job_id);

CREATE INDEX IF NOT EXISTS idx_job_matches_applicant_id
    ON job_matches(applicant_id);

CREATE INDEX IF NOT EXISTS idx_job_matches_job_status
    ON job_matches(job_id, status);

CREATE INDEX IF NOT EXISTS idx_job_matches_match_score
    ON job_matches(job_id, match_score DESC);


-- ============================================================
-- TABLE: job_settlements
-- 정산 내역 — 채용 완료 후 수수료(20%) 공제 정산
-- commission_rate 기본값: 20.00% (고정)
-- ============================================================
CREATE TABLE IF NOT EXISTS job_settlements (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id              UUID            NOT NULL REFERENCES job_postings(id),
    employer_id         UUID            NOT NULL REFERENCES auth.users(id),
    freelancer_id       UUID            NOT NULL REFERENCES auth.users(id),
    gross_amount        INT             NOT NULL,
    commission_rate     NUMERIC(5, 2)   NOT NULL DEFAULT 20.00,
    commission_amount   INT,
    net_amount          INT,
    settled_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    status              TEXT            NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'completed', 'disputed'))
);

-- RLS: job_settlements
ALTER TABLE job_settlements ENABLE ROW LEVEL SECURITY;

-- 관련 당사자(employer 또는 freelancer)만 SELECT
CREATE POLICY "job_settlements_select_parties"
    ON job_settlements FOR SELECT
    USING (
        auth.uid() = employer_id
        OR auth.uid() = freelancer_id
    );

-- 시스템(service_role)만 INSERT/UPDATE — 정산 로직은 백엔드에서만 처리
CREATE POLICY "job_settlements_insert_service"
    ON job_settlements FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "job_settlements_update_service"
    ON job_settlements FOR UPDATE
    USING (auth.role() = 'service_role');

-- Indexes: job_settlements
CREATE INDEX IF NOT EXISTS idx_job_settlements_job_id
    ON job_settlements(job_id);

CREATE INDEX IF NOT EXISTS idx_job_settlements_employer_id
    ON job_settlements(employer_id);

CREATE INDEX IF NOT EXISTS idx_job_settlements_freelancer_id
    ON job_settlements(freelancer_id);

CREATE INDEX IF NOT EXISTS idx_job_settlements_status
    ON job_settlements(status);

CREATE INDEX IF NOT EXISTS idx_job_settlements_settled_at
    ON job_settlements(settled_at DESC);
