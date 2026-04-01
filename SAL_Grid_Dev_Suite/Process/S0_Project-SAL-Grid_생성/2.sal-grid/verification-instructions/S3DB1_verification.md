# Verification Instruction - S3DB1

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
S3DB1

## Task Name
School/Skills/Jobs 추가 테이블

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S3_개발-2차/Database/supabase/migrations/20260402_school_tables.sql` 존재
- [ ] `Process/S3_개발-2차/Database/supabase/migrations/20260402_skills_tables.sql` 존재
- [ ] `Process/S3_개발-2차/Database/supabase/migrations/20260402_jobs_tables.sql` 존재
- [ ] 각 파일 상단에 `-- @task S3DB1` 주석 포함

### 2. School 테이블 검증
- [ ] `learning_sessions` 테이블 정의 존재
- [ ] `learning_progress` 테이블 정의 존재 (UNIQUE 제약 포함)
- [ ] `learning_certifications` 테이블 정의 존재
- [ ] `user_id`가 `auth.users(id)` 참조 Foreign Key 적용
- [ ] `status` 필드에 적절한 값 제약 또는 주석

### 3. Skills 테이블 검증
- [ ] `skill_installations` 테이블 정의 존재 (UNIQUE user_id+skill_id)
- [ ] `skill_executions` 테이블 정의 존재 (cost_usd 필드 포함)
- [ ] `skill_reviews` 테이블 정의 존재 (rating CHECK 1~5 포함)

### 4. Jobs 테이블 검증
- [ ] `job_postings` 테이블 정의 존재
- [ ] `job_matches` 테이블 정의 존재 (match_score 필드 포함)
- [ ] `job_settlements` 테이블 정의 존재 (commission_rate DEFAULT 20.00)
- [ ] `job_settlements`의 commission 계산 구조 적절

### 5. RLS 정책 검증
- [ ] 모든 9개 테이블에 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` 선언
- [ ] 각 테이블에 최소 1개 이상 RLS 정책 정의
- [ ] 본인 데이터 접근 제한 정책 (`auth.uid() = user_id`) 적용

### 6. 통합 검증
- [ ] 선행 Task(S1DB2) users 테이블과 Foreign Key 충돌 없음
- [ ] 테이블 이름 중복 없음
- [ ] SQL 문법 오류 없음 (세미콜론, 괄호 등)

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S3_개발-2차/Database/supabase/migrations/"

# SQL 문법 기본 확인
grep -n "CREATE TABLE" "Process/S3_개발-2차/Database/supabase/migrations/20260402_school_tables.sql"
grep -n "ENABLE ROW LEVEL SECURITY" "Process/S3_개발-2차/Database/supabase/migrations/20260402_jobs_tables.sql"

# commission_rate 확인
grep -n "commission_rate" "Process/S3_개발-2차/Database/supabase/migrations/20260402_jobs_tables.sql"
```

## Expected Results
- 3개 마이그레이션 파일 존재
- 총 9개 테이블 정의 (school 3개, skills 3개, jobs 3개)
- 모든 테이블 RLS 활성화
- `job_settlements.commission_rate` DEFAULT 20.00

## Verification Agent
`code-reviewer-core`

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] SQL 문법 오류 없음
- [ ] RLS 정책 모든 테이블 적용
- [ ] commission_rate 20% 기본값 확인
- [ ] Blocker 없음
