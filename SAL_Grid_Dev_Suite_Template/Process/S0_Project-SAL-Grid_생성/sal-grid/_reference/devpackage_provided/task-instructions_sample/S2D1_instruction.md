# Task Instruction - S2D1

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
S2D1

## Task Name
인덱스 최적화

## Task Goal
자주 사용하는 쿼리에 대한 데이터베이스 인덱스 추가

## Prerequisites (Dependencies)
- S1D1 (DB 스키마 확정) 완료

## Specific Instructions

### 1. 현재 인덱스 확인
```sql
-- 기존 인덱스 조회
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public';
```

### 2. 필요한 인덱스 식별

#### users 테이블
```sql
-- 이메일 검색 (로그인)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 생성일 기준 정렬
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
```

#### subscriptions 테이블
```sql
-- 사용자별 구독 조회
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- 상태별 구독 조회
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 만료일 기준 조회 (Cron Job용)
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
```

#### ai_usage_logs 테이블
```sql
-- 사용자별 사용량 조회
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage_logs(user_id);

-- 날짜별 사용량 집계
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage_logs(created_at DESC);
```

#### learning_contents 테이블
```sql
-- 카테고리별 콘텐츠 조회
CREATE INDEX IF NOT EXISTS idx_learning_category ON learning_contents(category);

-- 정렬 순서
CREATE INDEX IF NOT EXISTS idx_learning_order ON learning_contents(sort_order);
```

### 3. 인덱스 SQL 파일 생성
- 위치: `P3_프로토타입_제작/Database/indexes.sql`

### 4. 인덱스 성능 테스트
```sql
-- 쿼리 실행 계획 확인
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

### 5. 불필요한 인덱스 정리
- 중복 인덱스 제거
- 사용되지 않는 인덱스 제거

## Expected Output Files
- `P3_프로토타입_제작/Database/indexes.sql`
- `docs/DATABASE_INDEXES.md` (인덱스 설명 문서)

## Completion Criteria
- [ ] 현재 인덱스 현황 파악
- [ ] 필요한 인덱스 식별
- [ ] 인덱스 SQL 파일 생성
- [ ] Supabase에서 인덱스 생성 실행
- [ ] 쿼리 성능 테스트
- [ ] 인덱스 문서화

## Tech Stack
- PostgreSQL
- Supabase

## Task Agent
`database-specialist`

## Verification Agent
`database-specialist`

## Tools
- Read, Write
- Supabase SQL Editor

## Execution Type
AI-Only

## Remarks
- 인덱스는 쓰기 성능에 영향을 줄 수 있음
- 복합 인덱스 필요 시 쿼리 패턴 분석 필요
- 정기적인 VACUUM ANALYZE 권장

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

