-- @task S4DB1
-- Phase 3 마이그레이션: bot_revenue_events, skill_marketplace, bot_inheritance
-- Stage: S4 — 개발 마무리
-- Created: 2026-03-05

-- ============================================================
-- 0. 사전 확인: moddatetime 익스텐션 활성화
-- ============================================================
CREATE EXTENSION IF NOT EXISTS moddatetime;


-- ============================================================
-- 1. bot_revenue_events
-- ============================================================

CREATE TABLE IF NOT EXISTS bot_revenue_events (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id          UUID        REFERENCES bots(id) ON DELETE CASCADE,
  event_type      TEXT        NOT NULL,   -- 'skill_sale' | 'consultation' | 'subscription'
  amount          INTEGER     NOT NULL,   -- 크레딧 단위 (양수: 수입, 음수: 지출)
  buyer_user_id   UUID        REFERENCES auth.users(id),
  skill_id        UUID,                   -- skill_marketplace.id (nullable)
  settled         BOOLEAN     DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE  bot_revenue_events                IS '봇의 수익 이벤트 이력 (스킬 판매, 상담, 구독 등)';
COMMENT ON COLUMN bot_revenue_events.bot_id         IS '수익을 발생시킨 봇 ID';
COMMENT ON COLUMN bot_revenue_events.event_type     IS '이벤트 유형: skill_sale | consultation | subscription';
COMMENT ON COLUMN bot_revenue_events.amount         IS '크레딧 단위 금액 (양수=수입)';
COMMENT ON COLUMN bot_revenue_events.buyer_user_id  IS '구매/결제한 사용자 ID';
COMMENT ON COLUMN bot_revenue_events.skill_id       IS '스킬 마켓플레이스 아이템 ID (선택)';
COMMENT ON COLUMN bot_revenue_events.settled        IS '정산 완료 여부';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_bot_revenue_events_bot_id
  ON bot_revenue_events(bot_id);

CREATE INDEX IF NOT EXISTS idx_bot_revenue_events_buyer_user_id
  ON bot_revenue_events(buyer_user_id);

CREATE INDEX IF NOT EXISTS idx_bot_revenue_events_event_type
  ON bot_revenue_events(event_type);

CREATE INDEX IF NOT EXISTS idx_bot_revenue_events_settled
  ON bot_revenue_events(settled);

CREATE INDEX IF NOT EXISTS idx_bot_revenue_events_created_at
  ON bot_revenue_events(created_at DESC);

-- RLS
ALTER TABLE bot_revenue_events ENABLE ROW LEVEL SECURITY;

-- 봇 소유자만 SELECT
CREATE POLICY "bot_revenue_events_select_owner"
  ON bot_revenue_events
  FOR SELECT
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE owner_user_id = auth.uid()
    )
  );

-- 봇 소유자만 INSERT
CREATE POLICY "bot_revenue_events_insert_owner"
  ON bot_revenue_events
  FOR INSERT
  WITH CHECK (
    bot_id IN (
      SELECT id FROM bots WHERE owner_user_id = auth.uid()
    )
  );

-- 봇 소유자만 UPDATE
CREATE POLICY "bot_revenue_events_update_owner"
  ON bot_revenue_events
  FOR UPDATE
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE owner_user_id = auth.uid()
    )
  );

-- 봇 소유자만 DELETE
CREATE POLICY "bot_revenue_events_delete_owner"
  ON bot_revenue_events
  FOR DELETE
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE owner_user_id = auth.uid()
    )
  );


-- ============================================================
-- 2. skill_marketplace
-- ============================================================

CREATE TABLE IF NOT EXISTS skill_marketplace (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_bot_id    UUID        REFERENCES bots(id) ON DELETE CASCADE,
  skill_name      TEXT        NOT NULL,
  description     TEXT,
  category        TEXT,
  price           INTEGER     DEFAULT 0,         -- 크레딧 단위 가격 (0 = 무료)
  install_count   INTEGER     DEFAULT 0,
  is_active       BOOLEAN     DEFAULT TRUE,
  review_status   TEXT        DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE  skill_marketplace                  IS '봇이 등록한 스킬 마켓플레이스 목록';
COMMENT ON COLUMN skill_marketplace.owner_bot_id    IS '스킬을 등록한 봇 ID';
COMMENT ON COLUMN skill_marketplace.skill_name      IS '스킬 이름';
COMMENT ON COLUMN skill_marketplace.description     IS '스킬 설명';
COMMENT ON COLUMN skill_marketplace.category        IS '스킬 카테고리 (예: finance, productivity, etc.)';
COMMENT ON COLUMN skill_marketplace.price           IS '크레딧 단위 가격 (0 = 무료)';
COMMENT ON COLUMN skill_marketplace.install_count   IS '누적 설치 횟수';
COMMENT ON COLUMN skill_marketplace.is_active       IS '판매 활성 여부';
COMMENT ON COLUMN skill_marketplace.review_status   IS '검수 상태: pending | approved | rejected';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_skill_marketplace_owner_bot_id
  ON skill_marketplace(owner_bot_id);

CREATE INDEX IF NOT EXISTS idx_skill_marketplace_category
  ON skill_marketplace(category);

CREATE INDEX IF NOT EXISTS idx_skill_marketplace_review_status
  ON skill_marketplace(review_status);

CREATE INDEX IF NOT EXISTS idx_skill_marketplace_is_active
  ON skill_marketplace(is_active);

CREATE INDEX IF NOT EXISTS idx_skill_marketplace_price
  ON skill_marketplace(price);

-- moddatetime 트리거 (updated_at 자동 갱신)
CREATE TRIGGER trg_skill_marketplace_moddatetime
  BEFORE UPDATE ON skill_marketplace
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE skill_marketplace ENABLE ROW LEVEL SECURITY;

-- 승인된 스킬은 누구나 SELECT 가능 (마켓플레이스 공개 열람)
CREATE POLICY "skill_marketplace_select_approved_public"
  ON skill_marketplace
  FOR SELECT
  USING (
    review_status = 'approved' AND is_active = TRUE
  );

-- 봇 소유자는 자신의 스킬 SELECT 가능 (승인 여부 무관)
CREATE POLICY "skill_marketplace_select_owner"
  ON skill_marketplace
  FOR SELECT
  USING (
    owner_bot_id IN (
      SELECT id FROM bots WHERE owner_user_id = auth.uid()
    )
  );

-- 봇 소유자만 INSERT
CREATE POLICY "skill_marketplace_insert_owner"
  ON skill_marketplace
  FOR INSERT
  WITH CHECK (
    owner_bot_id IN (
      SELECT id FROM bots WHERE owner_user_id = auth.uid()
    )
  );

-- 봇 소유자만 UPDATE
CREATE POLICY "skill_marketplace_update_owner"
  ON skill_marketplace
  FOR UPDATE
  USING (
    owner_bot_id IN (
      SELECT id FROM bots WHERE owner_user_id = auth.uid()
    )
  );

-- 봇 소유자만 DELETE
CREATE POLICY "skill_marketplace_delete_owner"
  ON skill_marketplace
  FOR DELETE
  USING (
    owner_bot_id IN (
      SELECT id FROM bots WHERE owner_user_id = auth.uid()
    )
  );


-- ============================================================
-- 3. bot_inheritance
-- ============================================================

CREATE TABLE IF NOT EXISTS bot_inheritance (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id     UUID        REFERENCES auth.users(id),
  heir_email        TEXT        NOT NULL,
  bot_ids           UUID[]      NOT NULL,         -- 상속 대상 봇 ID 배열
  condition_months  INTEGER     DEFAULT 12,       -- 비활동 기간 조건 (개월)
  status            TEXT        DEFAULT 'pending', -- 'pending' | 'accepted' | 'transferred'
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE  bot_inheritance                    IS '봇 상속 설정 (소유자 비활동 시 후계자에게 봇 이전)';
COMMENT ON COLUMN bot_inheritance.owner_user_id     IS '봇 원소유자 ID';
COMMENT ON COLUMN bot_inheritance.heir_email        IS '후계자 이메일';
COMMENT ON COLUMN bot_inheritance.bot_ids           IS '상속 대상 봇 ID 배열';
COMMENT ON COLUMN bot_inheritance.condition_months  IS '상속 발동 조건: 소유자 비활동 개월 수';
COMMENT ON COLUMN bot_inheritance.status            IS '상속 진행 상태: pending | accepted | transferred';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_bot_inheritance_owner_user_id
  ON bot_inheritance(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_bot_inheritance_heir_email
  ON bot_inheritance(heir_email);

CREATE INDEX IF NOT EXISTS idx_bot_inheritance_status
  ON bot_inheritance(status);

-- GIN 인덱스 (UUID 배열 검색)
CREATE INDEX IF NOT EXISTS idx_bot_inheritance_bot_ids
  ON bot_inheritance USING GIN (bot_ids);

-- moddatetime 트리거 (updated_at 자동 갱신)
CREATE TRIGGER trg_bot_inheritance_moddatetime
  BEFORE UPDATE ON bot_inheritance
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE bot_inheritance ENABLE ROW LEVEL SECURITY;

-- 소유자만 자신의 상속 설정 SELECT
CREATE POLICY "bot_inheritance_select_owner"
  ON bot_inheritance
  FOR SELECT
  USING (owner_user_id = auth.uid());

-- 소유자만 INSERT
CREATE POLICY "bot_inheritance_insert_owner"
  ON bot_inheritance
  FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

-- 소유자만 UPDATE
CREATE POLICY "bot_inheritance_update_owner"
  ON bot_inheritance
  FOR UPDATE
  USING (owner_user_id = auth.uid());

-- 소유자만 DELETE
CREATE POLICY "bot_inheritance_delete_owner"
  ON bot_inheritance
  FOR DELETE
  USING (owner_user_id = auth.uid());
