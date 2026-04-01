# Task Instruction - S3DB1

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

## ⚠️ SAL Grid 데이터 작성 필수 규칙

### Stage 명칭
- **S3** = 개발 2차 (Additional Development)

### Area 명칭
- **DB** = Database (데이터베이스)

---

# Task Instruction - S3DB1

## Task ID
S3DB1

## Task Name
School/Skills/Jobs 추가 테이블

## Task Goal
My Chatbot World의 School(학습), Skills(스킬마켓), Jobs(수익활동) 섹션을 지원하는 Supabase 데이터베이스 테이블을 설계하고 마이그레이션 SQL을 작성한다. 학습 세션/진도/인증, 스킬 설치/실행/리뷰, 채용/매칭/정산 등 핵심 테이블과 RLS 정책을 완성한다.

## Prerequisites (Dependencies)
- S1DB2 — Supabase 기본 테이블 (users, profiles 등) 완료
- S2BA1 — 챗봇 핵심 API 완료 (user context 활용)

## Specific Instructions

### 1. School (학습) 테이블

**`learning_sessions`** — 학습 세션
```sql
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  curriculum_id UUID,
  scenario_type TEXT NOT NULL, -- 'roleplay', 'interview', 'debate', 'presentation'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INT,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`learning_progress`** — 커리큘럼 진도
```sql
CREATE TABLE learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  curriculum_id UUID NOT NULL,
  module_id TEXT NOT NULL,
  completion_rate INT DEFAULT 0, -- 0~100
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, curriculum_id, module_id)
);
```

**`learning_certifications`** — 인증서
```sql
CREATE TABLE learning_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  curriculum_id UUID NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  score INT, -- 0~100
  certificate_url TEXT
);
```

### 2. Skills (스킬마켓) 테이블

**`skill_installations`** — 스킬 설치 이력
```sql
CREATE TABLE skill_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- 'active', 'uninstalled'
  UNIQUE(user_id, skill_id)
);
```

**`skill_executions`** — 스킬 실행 로그
```sql
CREATE TABLE skill_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  input_tokens INT,
  output_tokens INT,
  cost_usd NUMERIC(10,6),
  status TEXT DEFAULT 'success' -- 'success', 'failed', 'timeout'
);
```

**`skill_reviews`** — 스킬 리뷰/평점
```sql
CREATE TABLE skill_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  rating INT CHECK(rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);
```

### 3. Jobs (채용) 테이블

**`job_postings`** — 채용 공고
```sql
CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  required_skills TEXT[],
  budget_min INT,
  budget_max INT,
  status TEXT DEFAULT 'open', -- 'open', 'closed', 'filled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`job_matches`** — AI 매칭 결과
```sql
CREATE TABLE job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  match_score NUMERIC(5,2), -- 0.00~100.00
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- 'pending', 'hired', 'rejected'
);
```

**`job_settlements`** — 정산 내역
```sql
CREATE TABLE job_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES job_postings(id),
  employer_id UUID REFERENCES auth.users(id),
  freelancer_id UUID REFERENCES auth.users(id),
  gross_amount INT NOT NULL,
  commission_rate NUMERIC(5,2) DEFAULT 20.00, -- 20%
  commission_amount INT,
  net_amount INT,
  settled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' -- 'pending', 'completed', 'disputed'
);
```

### 4. RLS 정책 설정
- `learning_sessions`: 본인 데이터만 SELECT/INSERT/UPDATE
- `learning_progress`: 본인 데이터만 SELECT/INSERT/UPDATE
- `learning_certifications`: 본인 SELECT, 시스템 INSERT
- `skill_installations`: 본인 SELECT/INSERT/UPDATE
- `skill_executions`: 본인 SELECT, 시스템 INSERT
- `skill_reviews`: 전체 SELECT, 본인 INSERT/UPDATE
- `job_postings`: 전체 SELECT, employer만 INSERT/UPDATE
- `job_matches`: employer/applicant SELECT, 시스템 INSERT
- `job_settlements`: 관련 당사자만 SELECT

### 5. 파일 상단 Task ID 주석
```sql
-- @task S3DB1
-- @description School/Skills/Jobs 추가 테이블 마이그레이션
```

## Expected Output Files
- `Process/S3_개발-2차/Database/supabase/migrations/20260402_school_tables.sql`
- `Process/S3_개발-2차/Database/supabase/migrations/20260402_skills_tables.sql`
- `Process/S3_개발-2차/Database/supabase/migrations/20260402_jobs_tables.sql`

## Completion Criteria
- [ ] `learning_sessions`, `learning_progress`, `learning_certifications` 테이블 생성 완료
- [ ] `skill_installations`, `skill_executions`, `skill_reviews` 테이블 생성 완료
- [ ] `job_postings`, `job_matches`, `job_settlements` 테이블 생성 완료
- [ ] 모든 테이블에 RLS 활성화 및 정책 적용
- [ ] Foreign Key 관계 정확히 정의
- [ ] Supabase에서 마이그레이션 실행 성공

## Tech Stack
- PostgreSQL (Supabase)
- Row Level Security (RLS)

## Tools
- supabase CLI
- Supabase MCP server

## Task Agent
`database-developer-core`

## Verification Agent
`code-reviewer-core`

## Execution Type
Hybrid (SQL 작성 AI, Supabase 실행은 PO 확인 필요)

## Remarks
- `job_settlements`의 commission_rate는 기본 20%로 고정
- 인증서 발급은 `learning_certifications`에만 기록 (실제 PDF는 S4에서 구현)
- 마이그레이션 파일명은 날짜 기반 (20260402) 사용

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S3DB1 → `Process/S3_개발-2차/Database/`

### 제2 규칙: Production 코드 이중 저장
- DB Area는 Production 자동 복사 없음 (Supabase에서 직접 실행)

---

## 📝 파일 명명 규칙
- SQL 파일: `YYYYMMDD_설명.sql` 형식
- 파일 상단 `-- @task S3DB1` 주석 필수
