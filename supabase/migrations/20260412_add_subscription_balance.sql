-- @task S2BA2
-- Migration: Add subscription_balance column to mcw_credits
-- Used to determine cost multiplier: subscription (×2) vs addon/overage (×4)
-- Created: 2026-04-12

ALTER TABLE mcw_credits
  ADD COLUMN IF NOT EXISTS subscription_balance NUMERIC(12, 4) NOT NULL DEFAULT 0
    CHECK (subscription_balance >= 0);

COMMENT ON COLUMN mcw_credits.subscription_balance IS
  '구독 플랜 또는 환영 크레딧으로 지급된 잔액. 이 값이 > 0이면 ×2 배수 적용, 0이면 ×4(초과/단건) 적용.';

-- Backfill: existing balances are assumed to be subscription-type (welcome bonus 30,000)
-- Adjust per actual subscription grant flow when subscription billing is activated.
UPDATE mcw_credits SET subscription_balance = balance WHERE subscription_balance = 0;

CREATE INDEX IF NOT EXISTS idx_mcw_credits_subscription_balance
  ON mcw_credits(subscription_balance) WHERE subscription_balance > 0;
