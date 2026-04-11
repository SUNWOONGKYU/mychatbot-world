-- Create mcw_skills table — skills catalog for the skill marketplace
-- Used by /api/admin/skills and /api/skills/register

CREATE TABLE IF NOT EXISTS mcw_skills (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    description TEXT,
    category    TEXT,
    price       NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_active   BOOLEAN     NOT NULL DEFAULT true,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE mcw_skills ENABLE ROW LEVEL SECURITY;

-- 전체 공개 SELECT (마켓 목록 표시)
CREATE POLICY "mcw_skills_select_all"
    ON mcw_skills FOR SELECT
    USING (true);

-- service_role만 INSERT/UPDATE/DELETE (관리자 API가 service_role 키 사용)
CREATE POLICY "mcw_skills_write_service"
    ON mcw_skills FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mcw_skills_category
    ON mcw_skills (category)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_mcw_skills_created_at
    ON mcw_skills (created_at DESC);
