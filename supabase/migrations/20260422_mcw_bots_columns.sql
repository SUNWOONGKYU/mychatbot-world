-- @task S10DB2
-- @description mcw_bots 컬럼 확장 — tone/persona_traits/learning_sources 추가
-- Created: 2026-04-22

-- 기존 데이터 보존 (ADD COLUMN IF NOT EXISTS)
ALTER TABLE mcw_bots
    ADD COLUMN IF NOT EXISTS tone TEXT;

ALTER TABLE mcw_bots
    ADD COLUMN IF NOT EXISTS persona_traits JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE mcw_bots
    ADD COLUMN IF NOT EXISTS learning_sources JSONB NOT NULL DEFAULT '[]'::jsonb;
