# Task Instruction - S1DB2

---

## 📌 필수 참조 규칙 파일

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## Task ID
S1DB2

## Task Name
DB 스키마 확장 (크레딧/결제/수익/피상속)

## Task Goal
S1DB1의 기본 스키마에서 확장하여 크레딧 관리, 결제 이력, 수익/정산, 피상속 설정을 위한 테이블을 추가한다. 각 테이블에 적절한 RLS 정책을 적용한다.

## Prerequisites (Dependencies)
- S1DB1 (기본 DB 스키마 완료)

## Specific Instructions

### 1. 크레딧 테이블 (20260401_credits_payments.sql)

```sql
-- @task S1DB2
-- 크레딧 및 결제 이력

-- =====================================
-- 크레딧 잔액 테이블
-- =====================================
CREATE TABLE IF NOT EXISTS mcw_credits (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance         NUMERIC(12, 4) DEFAULT 0.0000 NOT NULL,
  total_purchased NUMERIC(12, 4) DEFAULT 0.0000,
  total_used      NUMERIC(12, 4) DEFAULT 0.0000,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- 크레딧 트랜잭션 이력
-- =====================================
CREATE TABLE IF NOT EXISTS mcw_credit_transactions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('purchase', 'use', 'refund', 'bonus', 'admin')),
  amount          NUMERIC(12, 4) NOT NULL,
  balance_after   NUMERIC(12, 4) NOT NULL,
  description     TEXT,
  reference_id    UUID,
  reference_type  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- 결제 이력 테이블
-- =====================================
CREATE TABLE IF NOT EXISTS mcw_payments (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_key         TEXT UNIQUE,
  order_id            TEXT NOT NULL,
  amount              INTEGER NOT NULL,
  currency            TEXT DEFAULT 'KRW',
  status              TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  provider            TEXT NOT NULL DEFAULT 'toss',
  credits_granted     NUMERIC(12, 4) DEFAULT 0,
  payment_method      TEXT,
  receipt_url         TEXT,
  failure_reason      TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. 수익/정산 테이블 (20260401_revenue_settlement.sql)

```sql
-- @task S1DB2
-- 수익 및 정산

-- =====================================
-- 크리에이터 수익 테이블
-- =====================================
CREATE TABLE IF NOT EXISTS mcw_revenue (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id          UUID REFERENCES mcw_bots(id) ON DELETE SET NULL,
  source_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount          NUMERIC(12, 4) NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('bot_usage', 'template_purchase', 'subscription')),
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- 정산 요청 테이블
-- =====================================
CREATE TABLE IF NOT EXISTS mcw_settlements (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount          NUMERIC(12, 4) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  bank_code       TEXT,
  account_number  TEXT,
  account_holder  TEXT,
  admin_note      TEXT,
  requested_at    TIMESTAMPTZ DEFAULT NOW(),
  processed_at    TIMESTAMPTZ
);
```

### 3. 피상속 설정 테이블 (20260401_inheritance.sql)

```sql
-- @task S1DB2
-- 피상속 설정 및 동의

-- =====================================
-- 피상속 설정 테이블
-- =====================================
CREATE TABLE IF NOT EXISTS mcw_inheritance_settings (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  heir_email      TEXT NOT NULL,
  heir_user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bots_to_inherit UUID[] DEFAULT '{}',
  message         TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- 피상속 동의 테이블
-- =====================================
CREATE TABLE IF NOT EXISTS mcw_inheritance_consents (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_id        UUID REFERENCES mcw_inheritance_settings(id) ON DELETE CASCADE,
  heir_user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  responded_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. RLS 정책 적용

```sql
-- mcw_credits RLS
ALTER TABLE mcw_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credits_select_own" ON mcw_credits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "credits_update_service" ON mcw_credits
  FOR UPDATE USING (true); -- 서비스 롤만 업데이트

-- mcw_credit_transactions RLS
ALTER TABLE mcw_credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_tx_select_own" ON mcw_credit_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "credit_tx_insert_service" ON mcw_credit_transactions
  FOR INSERT WITH CHECK (true); -- 서비스 롤만 삽입

-- mcw_payments RLS
ALTER TABLE mcw_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select_own" ON mcw_payments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_insert_service" ON mcw_payments
  FOR INSERT WITH CHECK (true);

-- mcw_revenue RLS
ALTER TABLE mcw_revenue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revenue_select_own" ON mcw_revenue
  FOR SELECT USING (auth.uid() = creator_id);

-- mcw_settlements RLS
ALTER TABLE mcw_settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settlements_select_own" ON mcw_settlements
  FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "settlements_insert_own" ON mcw_settlements
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- mcw_inheritance_settings RLS
ALTER TABLE mcw_inheritance_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inheritance_select_own" ON mcw_inheritance_settings
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = heir_user_id);
CREATE POLICY "inheritance_insert_own" ON mcw_inheritance_settings
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "inheritance_update_own" ON mcw_inheritance_settings
  FOR UPDATE USING (auth.uid() = owner_id);

-- mcw_inheritance_consents RLS
ALTER TABLE mcw_inheritance_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consent_select_heir" ON mcw_inheritance_consents
  FOR SELECT USING (auth.uid() = heir_user_id);
CREATE POLICY "consent_update_heir" ON mcw_inheritance_consents
  FOR UPDATE USING (auth.uid() = heir_user_id);
```

### 5. 인덱스 추가

```sql
CREATE INDEX idx_mcw_credits_user_id ON mcw_credits(user_id);
CREATE INDEX idx_mcw_payments_user_id ON mcw_payments(user_id);
CREATE INDEX idx_mcw_payments_status ON mcw_payments(status);
CREATE INDEX idx_mcw_revenue_creator_id ON mcw_revenue(creator_id);
CREATE INDEX idx_mcw_inheritance_owner ON mcw_inheritance_settings(owner_id);
```

## Expected Output Files
- `supabase/migrations/20260401_credits_payments.sql`
- `supabase/migrations/20260401_revenue_settlement.sql`
- `supabase/migrations/20260401_inheritance.sql`

## Completion Criteria
- [ ] 7개 신규 테이블 Supabase에 생성됨 (크레딧 2, 결제 1, 수익/정산 2, 피상속 2)
- [ ] 각 테이블 RLS 활성화 및 정책 적용
- [ ] 인덱스 생성 완료
- [ ] 마이그레이션 파일 3개 작성 완료
- [ ] `mcw_credits` 테이블 INSERT/SELECT 성공 테스트

## Tech Stack
- PostgreSQL (Supabase)
- Supabase (RLS, Auth)
- SQL

## Tools
- supabase (CLI)
- Supabase Dashboard

## Execution Type
Human-AI (실제 SQL 실행은 Supabase에서 PO가 수행)

## Remarks
- 크레딧 `balance`는 `NUMERIC(12, 4)` — 소수점 4자리 정밀도
- `mcw_payments.amount`는 원화 정수 (KRW 기준, 원 단위)
- 피상속 기능은 MCW의 차별화 기능 — 봇 소유권 이전 지원
- 정산 금액은 별도 관리자 검토 후 처리 (자동화 금지)

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S1DB2 → `Process/S1_개발_준비/Database/`

### 제2 규칙: Production 코드는 이중 저장
- DB Area는 Production 저장 대상 아님
- SQL은 `supabase/migrations/`에 버전 관리
