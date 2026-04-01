# Verification Instruction - S1DB2

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S1DB2

## Task Name
DB 스키마 확장 (크레딧/결제/수익/피상속)

## Verification Checklist

### 1. 마이그레이션 파일 존재 검증
- [ ] `supabase/migrations/20260401_credits_payments.sql` 존재
- [ ] `supabase/migrations/20260401_revenue_settlement.sql` 존재
- [ ] `supabase/migrations/20260401_inheritance.sql` 존재

### 2. 테이블 존재 검증 (Supabase Dashboard)
- [ ] `mcw_credits` 테이블 존재
- [ ] `mcw_credit_transactions` 테이블 존재
- [ ] `mcw_payments` 테이블 존재
- [ ] `mcw_revenue` 테이블 존재
- [ ] `mcw_settlements` 테이블 존재
- [ ] `mcw_inheritance_settings` 테이블 존재
- [ ] `mcw_inheritance_consents` 테이블 존재

### 3. 스키마 컬럼 검증
- [ ] `mcw_credits`: `user_id`, `balance` (NUMERIC), `total_purchased`, `total_used` 존재
- [ ] `mcw_credit_transactions`: `type` CHECK 제약 (`purchase`, `use`, `refund`, `bonus`, `admin`)
- [ ] `mcw_payments`: `status` CHECK 제약 (`pending`, `completed`, `failed`, `cancelled`, `refunded`)
- [ ] `mcw_payments`: `amount` INTEGER (원화), `payment_key` UNIQUE
- [ ] `mcw_settlements`: `status` CHECK 제약 포함
- [ ] `mcw_inheritance_settings`: `owner_id` UNIQUE 제약 (1인 1설정)
- [ ] `mcw_inheritance_consents`: `status` CHECK 제약 (`pending`, `accepted`, `declined`)

### 4. RLS 정책 검증
- [ ] 7개 테이블 모두 RLS 활성화
- [ ] `mcw_credits`: 소유자만 조회, 서비스 롤만 업데이트
- [ ] `mcw_payments`: 소유자만 조회
- [ ] `mcw_revenue`: 크리에이터만 조회
- [ ] `mcw_inheritance_settings`: 소유자 + 상속자 조회 가능

### 5. 인덱스 검증
- [ ] `idx_mcw_credits_user_id` 인덱스 존재
- [ ] `idx_mcw_payments_user_id` 인덱스 존재
- [ ] `idx_mcw_payments_status` 인덱스 존재
- [ ] `idx_mcw_revenue_creator_id` 인덱스 존재

### 6. 기능 검증
- [ ] `mcw_credits` INSERT/SELECT 성공 (서비스 롤)
- [ ] `mcw_payments` 테스트 레코드 삽입 성공
- [ ] 외래키 제약: `mcw_credits.user_id` → `auth.users.id` 참조 무결성
- [ ] `mcw_credit_transactions.type` 잘못된 값 삽입 시 에러 발생

### 7. 통합 검증
- [ ] S1DB1 테이블과 외래키 참조 충돌 없음
- [ ] S1SC1(Auth)에서 생성된 사용자로 크레딧 레코드 생성 가능
- [ ] 크레딧 잔액 차감 시나리오 (S2BA 크레딧 API 기반) 스키마 지원

### 8. 저장 위치 검증
- [ ] `Process/S1_개발_준비/Database/`에 SQL 파일 원본 저장됨

## Test Commands
```bash
# 마이그레이션 파일 확인
ls supabase/migrations/ | grep 20260401

# SQL 유효성 확인 (Supabase CLI)
supabase db reset --local

# 테이블 확인 (Supabase REST API)
# curl -X GET \
#   'https://[project-ref].supabase.co/rest/v1/mcw_credits?limit=1' \
#   -H 'apikey: [anon-key]' \
#   -H 'Authorization: Bearer [service-role-key]'

# CHECK 제약 테스트 (잘못된 type 삽입 — 에러 발생해야 함)
# INSERT INTO mcw_credit_transactions(user_id, type, amount, balance_after)
# VALUES ('...', 'invalid_type', 10, 10);
```

## Expected Results
- 3개 마이그레이션 파일 존재
- 7개 테이블 Supabase에 존재
- RLS 활성화 상태
- CHECK 제약 위반 삽입 시 PostgreSQL 에러 발생
- 외래키 참조 무결성 정상

## Verification Agent
database-developer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 7개 테이블 스키마 정확
- [ ] RLS 정책 올바르게 적용
- [ ] CHECK 제약 동작 확인
- [ ] Blocker 없음

## ⚠️ Human-AI Task 검증 주의사항
이 Task는 **Human-AI** 유형입니다.
- Supabase Dashboard에서 실제 테이블 확인은 PO가 수행
- SQL 실행은 Supabase Dashboard SQL Editor 또는 CLI 사용
