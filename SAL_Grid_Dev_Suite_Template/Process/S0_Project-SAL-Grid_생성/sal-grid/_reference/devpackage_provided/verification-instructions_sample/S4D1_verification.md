# Verification Instruction - S4D1

## Task ID
S4D1

## Task Name
결제/크레딧 테이블

## Verification Agent
database-specialist

## Verification Criteria

### 1. 테이블 존재 확인
- [ ] billing_history 테이블
- [ ] credit_history 테이블
- [ ] ai_pricing 테이블
- [ ] api_usage_log 테이블

### 2. billing_history 스키마 확인
```sql
CREATE TABLE billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(50), -- 'subscription', 'credit', 'installation'
  status VARCHAR(50), -- 'pending', 'completed', 'failed', 'refunded'
  payment_method_id UUID,
  transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. credit_history 스키마 확인
```sql
CREATE TABLE credit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL, -- 양수: 충전, 음수: 사용
  type VARCHAR(50), -- 'purchase', 'usage', 'bonus', 'refund'
  description TEXT,
  balance_after INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. ai_pricing 스키마 확인
```sql
CREATE TABLE ai_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(50) NOT NULL, -- 'gemini', 'chatgpt', 'perplexity'
  display_name VARCHAR(100),
  credit_per_query INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. RLS 정책 확인
- [ ] billing_history: 본인 기록만 조회
- [ ] credit_history: 본인 기록만 조회
- [ ] ai_pricing: 모든 사용자 조회 가능

### 6. 인덱스 확인
- [ ] billing_history(user_id)
- [ ] credit_history(user_id)
- [ ] api_usage_log(user_id, created_at)

## Test Commands
```sql
-- 테이블 존재 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('billing_history', 'credit_history', 'ai_pricing', 'api_usage_log');

-- RLS 활성화 확인
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('billing_history', 'credit_history');
```

## Build Verification
- [ ] 마이그레이션 파일 문법 오류 없음
- [ ] 외래 키 제약 정상
- [ ] 기본값 설정 정상

## Integration Verification
- [ ] S1D1 기본 스키마와 호환
- [ ] S4BA3, S4BA4, S4BA5 API에서 사용
- [ ] S3BA1 AI 사용량 기록

## Expected Files
- Production/Database/billing_history.sql
- Production/Database/credit_history.sql
- Production/Database/ai_pricing.sql
- Production/Database/api_usage_log.sql
- S4_개발-3차/Database/*.sql

## Notes
- 금액은 DECIMAL 사용 (부동소수점 오류 방지)
- 크레딧 잔액은 별도 컬럼 또는 집계로 계산
- 감사 로그용으로 삭제 대신 soft delete 권장
