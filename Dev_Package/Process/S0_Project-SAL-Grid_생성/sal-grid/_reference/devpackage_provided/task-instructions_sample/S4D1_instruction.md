# Task Instruction - S4D1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S4D1

## Task Name
결제/크레딧 테이블

## Task Goal
billing_history, credit_history, ai_pricing, api_usage_log, payment_methods, installation_payments 테이블 생성

## Prerequisites (Dependencies)
- S1D1 (DB 스키마 확정) 완료

## Specific Instructions

### 1. 결제 수단 테이블
- 위치: `Production/Database/S4D1_payment_methods.sql`

```sql
-- S4D1: 결제 수단 테이블
-- @task S4D1

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    billing_key TEXT NOT NULL,
    customer_key TEXT NOT NULL,
    card_company VARCHAR(50),
    card_number VARCHAR(20), -- 마스킹된 번호 (예: **** **** **** 1234)
    card_type VARCHAR(20), -- 신용/체크
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE UNIQUE INDEX idx_payment_methods_billing_key ON payment_methods(billing_key);

-- RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
    ON payment_methods FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods"
    ON payment_methods FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
    ON payment_methods FOR DELETE
    USING (auth.uid() = user_id);
```

### 2. 결제 이력 테이블
- 위치: `Production/Database/S4D1_billing_history.sql`

```sql
-- S4D1: 결제 이력 테이블
-- @task S4D1

CREATE TABLE IF NOT EXISTS billing_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_key TEXT NOT NULL,
    order_id TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'KRW',
    status VARCHAR(20) NOT NULL, -- DONE, CANCELED, FAILED
    method VARCHAR(50), -- CARD, VIRTUAL_ACCOUNT, etc.
    card_company VARCHAR(50),
    card_number VARCHAR(20),
    subscription_id UUID REFERENCES subscriptions(id),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX idx_billing_history_order_id ON billing_history(order_id);
CREATE INDEX idx_billing_history_created_at ON billing_history(created_at);

-- RLS
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing history"
    ON billing_history FOR SELECT
    USING (auth.uid() = user_id);
```

### 3. 크레딧 이력 테이블
- 위치: `Production/Database/S4D1_credit_history.sql`

```sql
-- S4D1: 크레딧 이력 테이블
-- @task S4D1

CREATE TABLE IF NOT EXISTS credit_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- purchase, usage, refund, bonus
    amount INTEGER NOT NULL, -- 양수: 충전, 음수: 차감
    base_credits INTEGER, -- 구매 시 기본 크레딧
    bonus_credits INTEGER, -- 보너스 크레딧
    balance_after INTEGER NOT NULL, -- 변경 후 잔액
    payment_amount INTEGER, -- 결제 금액 (원)
    payment_key TEXT,
    order_id TEXT,
    package_id VARCHAR(50),
    ai_model VARCHAR(50), -- 사용 시 AI 모델명
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_credit_history_user_id ON credit_history(user_id);
CREATE INDEX idx_credit_history_type ON credit_history(type);
CREATE INDEX idx_credit_history_created_at ON credit_history(created_at);

-- RLS
ALTER TABLE credit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit history"
    ON credit_history FOR SELECT
    USING (auth.uid() = user_id);
```

### 4. AI 가격 테이블
- 위치: `Production/Database/S4D1_ai_pricing.sql`

```sql
-- S4D1: AI 가격 테이블
-- @task S4D1

CREATE TABLE IF NOT EXISTS ai_pricing (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL UNIQUE, -- gemini, chatgpt, perplexity
    display_name VARCHAR(100) NOT NULL,
    price_per_query INTEGER NOT NULL, -- 원 단위
    description TEXT,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초기 데이터
INSERT INTO ai_pricing (service_name, display_name, price_per_query, description, features)
VALUES
    ('gemini', 'Gemini Pro', 100, 'Google의 최신 AI 모델', '["빠른 응답", "한국어 최적화", "다중 턴 대화"]'),
    ('chatgpt', 'ChatGPT-4', 150, 'OpenAI의 고급 AI 모델', '["높은 정확도", "코드 작성", "창의적 글쓰기"]'),
    ('perplexity', 'Perplexity', 120, '실시간 검색 기반 AI', '["최신 정보", "출처 제공", "팩트 체크"]')
ON CONFLICT (service_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    price_per_query = EXCLUDED.price_per_query,
    updated_at = NOW();

-- RLS (공개 조회 가능)
ALTER TABLE ai_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ai pricing"
    ON ai_pricing FOR SELECT
    USING (true);
```

### 5. API 사용 로그 테이블
- 위치: `Production/Database/S4D1_api_usage_log.sql`

```sql
-- S4D1: API 사용 로그 테이블
-- @task S4D1

CREATE TABLE IF NOT EXISTS api_usage_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ai_model VARCHAR(50),
    input_tokens INTEGER,
    output_tokens INTEGER,
    cost_credits INTEGER,
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_api_usage_log_user_id ON api_usage_log(user_id);
CREATE INDEX idx_api_usage_log_endpoint ON api_usage_log(endpoint);
CREATE INDEX idx_api_usage_log_created_at ON api_usage_log(created_at);

-- RLS (관리자만 조회)
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all usage logs"
    ON api_usage_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );
```

### 6. 설치비 결제 테이블
- 위치: `Production/Database/S4D1_installation_payments.sql`

```sql
-- S4D1: 설치비 결제 테이블
-- @task S4D1

CREATE TABLE IF NOT EXISTS installation_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- 설치비 금액
    depositor_name VARCHAR(100) NOT NULL, -- 입금자명
    bank_name VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, confirmed, rejected
    admin_memo TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_installation_payments_user_id ON installation_payments(user_id);
CREATE INDEX idx_installation_payments_project_id ON installation_payments(project_id);
CREATE INDEX idx_installation_payments_status ON installation_payments(status);

-- RLS
ALTER TABLE installation_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own installation payments"
    ON installation_payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own installation payments"
    ON installation_payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all installation payments"
    ON installation_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update installation payments"
    ON installation_payments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );
```

### 7. users 테이블 크레딧 컬럼 추가
- 위치: `Production/Database/S4D1_users_credit_column.sql`

```sql
-- S4D1: users 테이블에 크레딧 관련 컬럼 추가
-- @task S4D1

ALTER TABLE users ADD COLUMN IF NOT EXISTS credit_balance INTEGER DEFAULT 0;

-- 크레딧 차감 함수
CREATE OR REPLACE FUNCTION deduct_credit(
    p_user_id UUID,
    p_amount INTEGER,
    p_ai_model VARCHAR(50)
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- 현재 잔액 조회 (FOR UPDATE로 락)
    SELECT credit_balance INTO v_current_balance
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_current_balance IS NULL THEN
        RETURN QUERY SELECT false, 0, '사용자를 찾을 수 없습니다'::TEXT;
        RETURN;
    END IF;

    IF v_current_balance < p_amount THEN
        RETURN QUERY SELECT false, v_current_balance, '크레딧이 부족합니다'::TEXT;
        RETURN;
    END IF;

    v_new_balance := v_current_balance - p_amount;

    -- 잔액 업데이트
    UPDATE users SET credit_balance = v_new_balance WHERE id = p_user_id;

    -- 이력 기록
    INSERT INTO credit_history (user_id, type, amount, balance_after, ai_model)
    VALUES (p_user_id, 'usage', -p_amount, v_new_balance, p_ai_model);

    RETURN QUERY SELECT true, v_new_balance, NULL::TEXT;
END;
$$;
```

## Expected Output Files
- `Production/Database/S4D1_payment_methods.sql`
- `Production/Database/S4D1_billing_history.sql`
- `Production/Database/S4D1_credit_history.sql`
- `Production/Database/S4D1_ai_pricing.sql`
- `Production/Database/S4D1_api_usage_log.sql`
- `Production/Database/S4D1_installation_payments.sql`
- `Production/Database/S4D1_users_credit_column.sql`

## Completion Criteria
- [ ] payment_methods 테이블 생성
- [ ] billing_history 테이블 생성
- [ ] credit_history 테이블 생성
- [ ] ai_pricing 테이블 생성 및 초기 데이터
- [ ] api_usage_log 테이블 생성
- [ ] installation_payments 테이블 생성
- [ ] users 테이블 credit_balance 컬럼 추가
- [ ] RLS 정책 설정
- [ ] 인덱스 생성
- [ ] 크레딧 차감 함수 생성

## Tech Stack
- PostgreSQL
- Supabase

## Task Agent
`database-specialist`

## Verification Agent
`database-specialist`

## Tools
- Supabase SQL Editor

## Execution Type
AI-Only

## Remarks
- 모든 금액은 원(KRW) 단위
- 빌링키는 암호화 저장 권장
- RLS로 데이터 접근 제어

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S1S1 → `S1_개발_준비/Security/`
- 예: S2F1 → `S2_개발-1차/Frontend/`

### 제2 규칙: Production 코드는 이중 저장
- Frontend, Database, Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장
- 문서(Documentation, Security, Testing, DevOps)는 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
