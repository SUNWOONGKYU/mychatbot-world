-- @task S12DB1
-- @description mcw_bots.order_index INT 컬럼 추가 — 페르소나 포털 탭 순서 보존
-- Created: 2026-04-21

ALTER TABLE mcw_bots
    ADD COLUMN IF NOT EXISTS order_index INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_mcw_bots_owner_order
    ON mcw_bots(owner_id, order_index);
