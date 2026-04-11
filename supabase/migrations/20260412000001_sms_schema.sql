-- SMS (Skill Management System) 스키마 확장
-- mcw_bots.id = TEXT 이므로 chatbot_id도 TEXT로 선언
-- @task S4DB4
-- Created: 2026-04-12

-- ============================================================
-- STEP 1: mcw_skills 컬럼 추가
-- ============================================================
ALTER TABLE mcw_skills
  ADD COLUMN IF NOT EXISTS skill_content  TEXT,
  ADD COLUMN IF NOT EXISTS origin         TEXT    NOT NULL DEFAULT 'ready-made'
                                          CHECK (origin IN ('ready-made', 'self-made')),
  ADD COLUMN IF NOT EXISTS version        INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS chatbot_id     TEXT    REFERENCES mcw_bots(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS success_rate   FLOAT,
  ADD COLUMN IF NOT EXISTS use_count      INTEGER NOT NULL DEFAULT 0;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_mcw_skills_origin
    ON mcw_skills(origin);

CREATE INDEX IF NOT EXISTS idx_mcw_skills_chatbot_id
    ON mcw_skills(chatbot_id)
    WHERE chatbot_id IS NOT NULL;

-- ============================================================
-- STEP 2: skill_logs 테이블 생성 (Self-Made Skill 생성 재료)
-- chatbot_id TEXT — mcw_bots.id와 타입 일치
-- ============================================================
CREATE TABLE IF NOT EXISTS skill_logs (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id          TEXT        NOT NULL REFERENCES mcw_bots(id) ON DELETE CASCADE,
    user_request        TEXT,
    bot_actions         JSONB,
    result_status       TEXT        NOT NULL DEFAULT 'success'
                        CHECK (result_status IN ('success', 'failure')),
    result_summary      TEXT,
    skill_generated     BOOLEAN     NOT NULL DEFAULT false,
    generated_skill_id  UUID        REFERENCES mcw_skills(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: skill_logs
ALTER TABLE skill_logs ENABLE ROW LEVEL SECURITY;

-- 챗봇 소유자만 조회
CREATE POLICY "skill_logs_select_owner"
    ON skill_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM mcw_bots
            WHERE mcw_bots.id = skill_logs.chatbot_id
              AND mcw_bots.owner_id = auth.uid()::TEXT
        )
    );

-- service_role만 INSERT (서버 측에서만 기록)
CREATE POLICY "skill_logs_insert_service"
    ON skill_logs FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_skill_logs_chatbot_id
    ON skill_logs(chatbot_id);

CREATE INDEX IF NOT EXISTS idx_skill_logs_result_status
    ON skill_logs(result_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_skill_logs_skill_generated
    ON skill_logs(skill_generated)
    WHERE skill_generated = true;
