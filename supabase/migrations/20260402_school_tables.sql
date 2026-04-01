-- @task S3DB1
-- @description School/Skills/Jobs 추가 테이블 마이그레이션 — School (학습) 섹션
-- Project: MyChatbot World (MCW)
-- Created: 2026-04-02

-- ============================================================
-- TABLE: learning_sessions
-- 학습 세션 — 사용자가 시작한 학습 시나리오 단위
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_sessions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    curriculum_id   UUID,                                    -- 추후 curriculums 테이블 FK 추가 예정
    scenario_type   TEXT        NOT NULL
                    CHECK (scenario_type IN ('roleplay', 'interview', 'debate', 'presentation')),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    duration_minutes INT,
    status          TEXT        NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'abandoned')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: learning_sessions
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 SELECT
CREATE POLICY "learning_sessions_select_own"
    ON learning_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- 본인만 INSERT (user_id 강제)
CREATE POLICY "learning_sessions_insert_own"
    ON learning_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 본인만 UPDATE
CREATE POLICY "learning_sessions_update_own"
    ON learning_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Indexes: learning_sessions
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id
    ON learning_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_status
    ON learning_sessions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_curriculum_id
    ON learning_sessions(curriculum_id)
    WHERE curriculum_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_learning_sessions_started_at
    ON learning_sessions(started_at DESC);


-- ============================================================
-- TABLE: learning_progress
-- 커리큘럼 진도 — 모듈 단위 완료율 추적
-- UNIQUE(user_id, curriculum_id, module_id) 보장
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_progress (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    curriculum_id       UUID        NOT NULL,
    module_id           TEXT        NOT NULL,
    completion_rate     INT         NOT NULL DEFAULT 0
                        CHECK (completion_rate BETWEEN 0 AND 100),
    last_accessed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, curriculum_id, module_id)
);

-- RLS: learning_progress
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 SELECT
CREATE POLICY "learning_progress_select_own"
    ON learning_progress FOR SELECT
    USING (auth.uid() = user_id);

-- 본인만 INSERT
CREATE POLICY "learning_progress_insert_own"
    ON learning_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 본인만 UPDATE
CREATE POLICY "learning_progress_update_own"
    ON learning_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Indexes: learning_progress
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_curriculum
    ON learning_progress(user_id, curriculum_id);

CREATE INDEX IF NOT EXISTS idx_learning_progress_last_accessed
    ON learning_progress(user_id, last_accessed_at DESC);


-- ============================================================
-- TABLE: learning_certifications
-- 인증서 발급 이력 — 커리큘럼 완료 후 발급
-- 실제 PDF 생성은 S4에서 구현
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_certifications (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    curriculum_id   UUID        NOT NULL,
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    score           INT
                    CHECK (score BETWEEN 0 AND 100),
    certificate_url TEXT
);

-- RLS: learning_certifications
ALTER TABLE learning_certifications ENABLE ROW LEVEL SECURITY;

-- 본인 인증서 SELECT (전체 공개 아님 — 개인 자산)
CREATE POLICY "learning_certifications_select_own"
    ON learning_certifications FOR SELECT
    USING (auth.uid() = user_id);

-- 시스템(service_role)만 INSERT — 직접 INSERT 금지
CREATE POLICY "learning_certifications_insert_service"
    ON learning_certifications FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Indexes: learning_certifications
CREATE INDEX IF NOT EXISTS idx_learning_certifications_user_id
    ON learning_certifications(user_id);

CREATE INDEX IF NOT EXISTS idx_learning_certifications_curriculum_id
    ON learning_certifications(curriculum_id);

CREATE INDEX IF NOT EXISTS idx_learning_certifications_issued_at
    ON learning_certifications(user_id, issued_at DESC);
