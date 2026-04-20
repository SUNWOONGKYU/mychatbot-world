-- @task S1DB2
-- Migration: Revenue & Settlement
-- Project: MyChatbot World (MCW)
-- Created: 2026-04-01

-- ============================================================
-- TABLE: mcw_revenue
-- Creator revenue tracking per bot/template/subscription
-- References mcw_bots(id) for bot-linked revenue
-- ============================================================
CREATE TABLE IF NOT EXISTS mcw_revenue (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bot_id          UUID REFERENCES mcw_bots(id) ON DELETE SET NULL,
    type            TEXT NOT NULL CHECK (type IN ('bot_usage', 'template_purchase', 'subscription')),
    gross_amount    NUMERIC(12, 4) NOT NULL CHECK (gross_amount >= 0),  -- total credit spent by user
    platform_fee    NUMERIC(12, 4) NOT NULL DEFAULT 0,                  -- MCW platform cut
    net_amount      NUMERIC(12, 4) NOT NULL CHECK (net_amount >= 0),    -- creator receivable
    currency        TEXT NOT NULL DEFAULT 'KRW',
    settled         BOOLEAN NOT NULL DEFAULT FALSE,
    settlement_id   UUID,                          -- set after settlement
    reference_id    UUID,                          -- e.g. chat_log_id, transaction_id
    reference_type  TEXT,
    description     TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: mcw_revenue
ALTER TABLE mcw_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revenue_select_own"
    ON mcw_revenue FOR SELECT
    USING (auth.uid() = creator_id);

CREATE POLICY "revenue_insert_service"
    ON mcw_revenue FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "revenue_update_service"
    ON mcw_revenue FOR UPDATE
    USING (auth.role() = 'service_role');

-- Indexes: mcw_revenue
CREATE INDEX IF NOT EXISTS idx_mcw_revenue_creator_id ON mcw_revenue(creator_id);
CREATE INDEX IF NOT EXISTS idx_mcw_revenue_bot_id ON mcw_revenue(bot_id) WHERE bot_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mcw_revenue_type ON mcw_revenue(type);
CREATE INDEX IF NOT EXISTS idx_mcw_revenue_settled ON mcw_revenue(settled);
CREATE INDEX IF NOT EXISTS idx_mcw_revenue_settlement_id ON mcw_revenue(settlement_id) WHERE settlement_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mcw_revenue_created_at ON mcw_revenue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcw_revenue_creator_unsettled ON mcw_revenue(creator_id, settled) WHERE settled = FALSE;

-- ============================================================
-- TABLE: mcw_settlements
-- Creator settlement requests and processing records
-- ============================================================
CREATE TABLE IF NOT EXISTS mcw_settlements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    requested_amount    NUMERIC(12, 4) NOT NULL CHECK (requested_amount > 0),
    approved_amount     NUMERIC(12, 4),                 -- admin confirmed amount
    currency            TEXT NOT NULL DEFAULT 'KRW',
    bank_name           TEXT,                           -- creator-provided bank info
    bank_account_number TEXT,
    bank_account_holder TEXT,
    period_from         TIMESTAMPTZ,                    -- revenue period start
    period_to           TIMESTAMPTZ,                    -- revenue period end
    processed_at        TIMESTAMPTZ,
    fail_reason         TEXT,
    admin_note          TEXT,
    metadata            JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: mcw_settlements
ALTER TABLE mcw_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settlements_select_own"
    ON mcw_settlements FOR SELECT
    USING (auth.uid() = creator_id);

CREATE POLICY "settlements_insert_own"
    ON mcw_settlements FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "settlements_update_service"
    ON mcw_settlements FOR UPDATE
    USING (auth.role() = 'service_role');

-- Indexes: mcw_settlements
CREATE INDEX IF NOT EXISTS idx_mcw_settlements_creator_id ON mcw_settlements(creator_id);
CREATE INDEX IF NOT EXISTS idx_mcw_settlements_status ON mcw_settlements(status);
CREATE INDEX IF NOT EXISTS idx_mcw_settlements_created_at ON mcw_settlements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcw_settlements_creator_status ON mcw_settlements(creator_id, status);
