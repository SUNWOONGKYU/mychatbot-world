-- @task S1DB2
-- Migration: Credits, Credit Transactions, Payments
-- Project: MyChatbot World (MCW)
-- Created: 2026-04-01

-- ============================================================
-- TABLE: mcw_credits
-- User credit balance (NUMERIC 12,4 for precision)
-- One row per user (UNIQUE user_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS mcw_credits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    balance         NUMERIC(12, 4) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_purchased NUMERIC(12, 4) NOT NULL DEFAULT 0,
    total_used      NUMERIC(12, 4) NOT NULL DEFAULT 0,
    total_refunded  NUMERIC(12, 4) NOT NULL DEFAULT 0,
    total_bonus     NUMERIC(12, 4) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: mcw_credits
ALTER TABLE mcw_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credits_select_own"
    ON mcw_credits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "credits_insert_service"
    ON mcw_credits FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "credits_update_service"
    ON mcw_credits FOR UPDATE
    USING (auth.role() = 'service_role');

-- Indexes: mcw_credits
CREATE INDEX IF NOT EXISTS idx_mcw_credits_user_id ON mcw_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_mcw_credits_balance ON mcw_credits(balance);
CREATE INDEX IF NOT EXISTS idx_mcw_credits_updated_at ON mcw_credits(updated_at DESC);

-- ============================================================
-- TABLE: mcw_credit_transactions
-- Transaction history: purchase, use, refund, bonus, admin
-- ============================================================
CREATE TABLE IF NOT EXISTS mcw_credit_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN ('purchase', 'use', 'refund', 'bonus', 'admin')),
    amount          NUMERIC(12, 4) NOT NULL,        -- positive = credit added, negative = credit deducted
    balance_after   NUMERIC(12, 4) NOT NULL,        -- snapshot of balance after transaction
    description     TEXT,
    reference_id    UUID,                           -- optional: payment_id, chat_log_id, etc.
    reference_type  TEXT,                           -- e.g. 'payment', 'chat_log', 'bot'
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: mcw_credit_transactions
ALTER TABLE mcw_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_txn_select_own"
    ON mcw_credit_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "credit_txn_insert_service"
    ON mcw_credit_transactions FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Indexes: mcw_credit_transactions
CREATE INDEX IF NOT EXISTS idx_mcw_credit_txn_user_id ON mcw_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_mcw_credit_txn_type ON mcw_credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_mcw_credit_txn_created_at ON mcw_credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcw_credit_txn_reference ON mcw_credit_transactions(reference_id) WHERE reference_id IS NOT NULL;

-- ============================================================
-- TABLE: mcw_payments
-- Payment records via Toss (default provider)
-- amount: INTEGER (KRW 원 단위)
-- ============================================================
CREATE TABLE IF NOT EXISTS mcw_payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider            TEXT NOT NULL DEFAULT 'toss',
    provider_payment_id TEXT,                       -- Toss paymentKey or orderId
    provider_order_id   TEXT UNIQUE,                -- our order ID sent to Toss
    amount              INTEGER NOT NULL CHECK (amount > 0),  -- KRW (원)
    credit_amount       NUMERIC(12, 4) NOT NULL,    -- credits to grant on completion
    status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    payment_method      TEXT,                       -- e.g. 'card', 'virtualAccount', 'easyPay'
    paid_at             TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    fail_reason         TEXT,
    metadata            JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: mcw_payments
ALTER TABLE mcw_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own"
    ON mcw_payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "payments_insert_service"
    ON mcw_payments FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "payments_update_service"
    ON mcw_payments FOR UPDATE
    USING (auth.role() = 'service_role');

-- Indexes: mcw_payments
CREATE INDEX IF NOT EXISTS idx_mcw_payments_user_id ON mcw_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_mcw_payments_status ON mcw_payments(status);
CREATE INDEX IF NOT EXISTS idx_mcw_payments_provider_order_id ON mcw_payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_mcw_payments_provider_payment_id ON mcw_payments(provider_payment_id) WHERE provider_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mcw_payments_created_at ON mcw_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcw_payments_paid_at ON mcw_payments(paid_at DESC) WHERE paid_at IS NOT NULL;
