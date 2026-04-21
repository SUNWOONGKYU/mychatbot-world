-- @task S10DB1
-- @description mcw_bot_skills 테이블 생성 — 봇별 장착 스킬 메타데이터 영속화
-- Created: 2026-04-22

-- ============================================================
-- TABLE: mcw_bot_skills
-- 봇-스킬 마운트 메타데이터. 한 봇당 동일 스킬 1회만 장착 가능.
-- bot_id 는 mcw_bots.id(TEXT) 를 참조한다.
-- ============================================================
CREATE TABLE IF NOT EXISTS mcw_bot_skills (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id      TEXT        NOT NULL REFERENCES mcw_bots(id) ON DELETE CASCADE,
    skill_id    TEXT        NOT NULL,
    mounted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    config      JSONB       NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (bot_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_mcw_bot_skills_bot_id
    ON mcw_bot_skills(bot_id);

-- RLS: owner only (mcw_bots.owner_id 기준)
ALTER TABLE mcw_bot_skills ENABLE ROW LEVEL SECURITY;

-- SELECT: 봇 소유자만
DROP POLICY IF EXISTS "mcw_bot_skills_select_owner" ON mcw_bot_skills;
CREATE POLICY "mcw_bot_skills_select_owner"
    ON mcw_bot_skills FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM mcw_bots b
            WHERE b.id = mcw_bot_skills.bot_id
              AND b.owner_id = auth.uid()::text
        )
    );

-- INSERT: 봇 소유자만
DROP POLICY IF EXISTS "mcw_bot_skills_insert_owner" ON mcw_bot_skills;
CREATE POLICY "mcw_bot_skills_insert_owner"
    ON mcw_bot_skills FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM mcw_bots b
            WHERE b.id = mcw_bot_skills.bot_id
              AND b.owner_id = auth.uid()::text
        )
    );

-- UPDATE: 봇 소유자만
DROP POLICY IF EXISTS "mcw_bot_skills_update_owner" ON mcw_bot_skills;
CREATE POLICY "mcw_bot_skills_update_owner"
    ON mcw_bot_skills FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM mcw_bots b
            WHERE b.id = mcw_bot_skills.bot_id
              AND b.owner_id = auth.uid()::text
        )
    );

-- DELETE: 봇 소유자만
DROP POLICY IF EXISTS "mcw_bot_skills_delete_owner" ON mcw_bot_skills;
CREATE POLICY "mcw_bot_skills_delete_owner"
    ON mcw_bot_skills FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM mcw_bots b
            WHERE b.id = mcw_bot_skills.bot_id
              AND b.owner_id = auth.uid()::text
        )
    );
