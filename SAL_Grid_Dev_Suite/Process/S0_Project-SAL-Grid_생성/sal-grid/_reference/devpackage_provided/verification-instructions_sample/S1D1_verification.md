# Verification Instruction - S1D1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S1D1

## Task Name
DB 스키마 확정

## Verification Checklist

### 1. 스키마 파일 검증
- [ ] schema.sql 파일 존재
- [ ] 모든 필수 테이블 정의

### 2. 테이블 존재 검증
- [ ] users 테이블
- [ ] subscription_plans 테이블
- [ ] subscriptions 테이블
- [ ] ai_usage_logs 테이블
- [ ] learning_contents 테이블

### 3. 컬럼 검증 (users)
- [ ] id (UUID, PK)
- [ ] email (UNIQUE)
- [ ] name
- [ ] created_at
- [ ] updated_at

### 4. 외래 키 검증
- [ ] subscriptions.user_id → users.id
- [ ] subscriptions.plan_id → subscription_plans.id
- [ ] ai_usage_logs.user_id → users.id

### 5. 인덱스 검증
- [ ] users.email 인덱스
- [ ] subscriptions.user_id 인덱스
- [ ] ai_usage_logs.created_at 인덱스

### 6. RLS 정책 검증
- [ ] 테이블별 RLS 활성화
- [ ] 적절한 정책 정의

## Test Commands
```sql
-- 테이블 목록 확인
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 컬럼 확인
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';

-- 인덱스 확인
SELECT indexname FROM pg_indexes WHERE schemaname = 'public';
```

## Expected Results
- 모든 테이블 생성 완료
- 외래 키 관계 설정
- 인덱스 생성 완료
- RLS 정책 적용

## Verification Agent
database-developer

## Pass Criteria
- 5개 이상 필수 테이블 존재
- 외래 키 관계 정확
- RLS 정책 활성화

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] Task ID의 Stage에 맞는 폴더에 저장되었는가? (S1→S1_개발_준비/, S2→S2_개발-1차/, ...)
- [ ] Task ID의 Area에 맞는 폴더에 저장되었는가? (S→Security/, F→Frontend/, ...)
- [ ] Production 관련 코드(F, BA, D)는 Production 폴더에도 저장되었는가?

