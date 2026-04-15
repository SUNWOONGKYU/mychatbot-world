-- @task S4BA2
-- Migration: Add bank transfer columns to mcw_payments
-- Created: 2026-04-02

-- Add bank transfer specific columns
ALTER TABLE mcw_payments
  ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'bank_transfer',
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS account_holder TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_by TEXT;

-- provider default 'toss' → 'bank_transfer' for new rows created without provider
-- (existing rows keep 'toss', new bank transfer rows will set explicitly)

-- Index for status + payment_type queries
CREATE INDEX IF NOT EXISTS idx_mcw_payments_payment_type ON mcw_payments(payment_type);
