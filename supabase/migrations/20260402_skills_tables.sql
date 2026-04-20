-- @task S3DB1
-- @description School/Skills/Jobs 추가 테이블 마이그레이션 — Skills (스킬마켓) 섹션
-- Project: MyChatbot World (MCW)
-- Created: 2026-04-02

-- ============================================================
-- TABLE: skill_installations
-- 스킬 설치 이력 — 사용자별 설치된 스킬 목록
-- UNIQUE(user_id, skill_id) 보장 (중복 설치 방지)
-- ============================================================
CREATE TABLE IF NOT EXISTS skill_installations (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id    TEXT        NOT NULL,
    skill_name  TEXT        NOT NULL,
    installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status      TEXT        NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'uninstalled')),
    UNIQUE (user_id, skill_id)
);

-- RLS: skill_installations
ALTER TABLE skill_installations ENABLE ROW LEVEL SECURITY;

-- 본인 설치 목록만 SELECT
CREATE POLICY "skill_installations_select_own"
    ON skill_installations FOR SELECT
    USING (auth.uid() = user_id);

-- 본인만 INSERT (설치)
CREATE POLICY "skill_installations_insert_own"
    ON skill_installations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 본인만 UPDATE (상태 변경: uninstall 등)
CREATE POLICY "skill_installations_update_own"
    ON skill_installations FOR UPDATE
    USING (auth.uid() = user_id);

-- Indexes: skill_installations
CREATE INDEX IF NOT EXISTS idx_skill_installations_user_id
    ON skill_installations(user_id);

CREATE INDEX IF NOT EXISTS idx_skill_installations_skill_id
    ON skill_installations(skill_id);

CREATE INDEX IF NOT EXISTS idx_skill_installations_user_status
    ON skill_installations(user_id, status);


-- ============================================================
-- TABLE: skill_executions
-- 스킬 실행 로그 — 토큰/비용 추적 및 감사 로그
-- ============================================================
CREATE TABLE IF NOT EXISTS skill_executions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id        TEXT        NOT NULL,
    executed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    input_tokens    INT,
    output_tokens   INT,
    cost_usd        NUMERIC(10, 6),
    status          TEXT        NOT NULL DEFAULT 'success'
                    CHECK (status IN ('success', 'failed', 'timeout'))
);

-- RLS: skill_executions
ALTER TABLE skill_executions ENABLE ROW LEVEL SECURITY;

-- 본인 실행 로그만 SELECT
CREATE POLICY "skill_executions_select_own"
    ON skill_executions FOR SELECT
    USING (auth.uid() = user_id);

-- 시스템(service_role)만 INSERT — 클라이언트 직접 INSERT 금지
CREATE POLICY "skill_executions_insert_service"
    ON skill_executions FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Indexes: skill_executions
CREATE INDEX IF NOT EXISTS idx_skill_executions_user_id
    ON skill_executions(user_id);

CREATE INDEX IF NOT EXISTS idx_skill_executions_skill_id
    ON skill_executions(skill_id);

CREATE INDEX IF NOT EXISTS idx_skill_executions_user_executed_at
    ON skill_executions(user_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_skill_executions_status
    ON skill_executions(status)
    WHERE status IN ('failed', 'timeout');


-- ============================================================
-- TABLE: skill_reviews
-- 스킬 리뷰/평점 — 1인당 1스킬 1리뷰 (UNIQUE 보장)
-- 전체 공개 READ, 본인만 WRITE
-- ============================================================
CREATE TABLE IF NOT EXISTS skill_reviews (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id    TEXT        NOT NULL,
    rating      INT         NOT NULL
                CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, skill_id)
);

-- RLS: skill_reviews
ALTER TABLE skill_reviews ENABLE ROW LEVEL SECURITY;

-- 전체 사용자 SELECT (마켓 공개 리뷰)
CREATE POLICY "skill_reviews_select_all"
    ON skill_reviews FOR SELECT
    USING (true);

-- 본인만 INSERT
CREATE POLICY "skill_reviews_insert_own"
    ON skill_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 본인만 UPDATE
CREATE POLICY "skill_reviews_update_own"
    ON skill_reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- Indexes: skill_reviews
CREATE INDEX IF NOT EXISTS idx_skill_reviews_skill_id
    ON skill_reviews(skill_id);

CREATE INDEX IF NOT EXISTS idx_skill_reviews_user_id
    ON skill_reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_skill_reviews_skill_rating
    ON skill_reviews(skill_id, rating);
