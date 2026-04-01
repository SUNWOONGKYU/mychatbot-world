# Task Instruction - S3BA3

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
- **BA** = Backend APIs (백엔드 API)

---

# Task Instruction - S3BA3

## Task ID
S3BA3

## Task Name
Jobs API 강화 (매칭 알고리즘, 정산 20%)

## Task Goal
기존 S3BA7(소급)의 기본 Jobs API를 고도화한다. AI 기반 매칭 알고리즘, 채용 워크플로우 관리, 20% 수수료 자동 정산, 리뷰 시스템을 추가하여 완전한 채용 플랫폼 API를 완성한다.

## Prerequisites (Dependencies)
- S3DB1 — job_postings, job_matches, job_settlements 테이블 완료
- S2BA6 — Jobs 기본 API (소급, `api/Backend_APIs/job-*.js`) 완료

## Specific Instructions

### 1. AI 매칭 알고리즘 API

**`app/api/jobs/match/route.ts`**
```typescript
/**
 * @task S3BA3
 * @description AI 기반 채용 매칭 알고리즘
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: 특정 채용 공고에 대한 AI 매칭 실행
export async function POST(req: NextRequest) {
  const { job_id } = await req.json();
  const supabase = createClient();

  // 1. 채용 공고 조회 (required_skills, 예산 등)
  const { data: job } = await supabase
    .from('job_postings')
    .select('*')
    .eq('id', job_id)
    .single();

  // 2. 지원자 풀 조회 (관련 스킬 보유자)
  // 3. AI에게 매칭 점수 계산 요청
  const matchingPrompt = `
다음 채용 공고와 지원자 목록을 분석하여 매칭 점수(0~100)를 계산하세요.

채용 공고:
- 필요 스킬: ${job.required_skills?.join(', ')}
- 예산: ${job.budget_min}~${job.budget_max}원

각 지원자에 대해 JSON 배열로 응답: [{ "applicant_id": "...", "score": 점수, "reason": "이유" }]
  `;

  // 4. job_matches 테이블에 결과 저장
}

// GET: 채용 공고의 매칭 결과 조회
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const job_id = searchParams.get('job_id');
  // job_matches 조회 (score 내림차순)
}
```

### 2. 채용 워크플로우 API

**`app/api/jobs/hire/route.ts`**
- POST `/api/jobs/hire` — 지원자 채용 확정
  - `job_matches.status` → 'hired'
  - 나머지 지원자 → 'rejected'
  - 채용 공고 `status` → 'filled'
- GET `/api/jobs/hire` — 채용 현황 조회

### 3. 정산 API (20% 수수료 자동 계산)

**`app/api/jobs/settle/route.ts`**
```typescript
/**
 * @task S3BA3
 * @description 채용 정산 API — 20% 수수료 자동 계산
 */
export async function POST(req: NextRequest) {
  const { job_id, gross_amount } = await req.json();

  const COMMISSION_RATE = 0.20; // 20%
  const commission_amount = Math.round(gross_amount * COMMISSION_RATE);
  const net_amount = gross_amount - commission_amount;

  const supabase = createClient();

  // job_settlements INSERT
  const { data, error } = await supabase
    .from('job_settlements')
    .insert({
      job_id,
      gross_amount,
      commission_rate: 20.00,
      commission_amount,
      net_amount,
      status: 'pending',
    })
    .select()
    .single();

  return NextResponse.json({ settlement: data });
}
```

### 4. 채용 리뷰 시스템
- `app/api/jobs/review/route.ts` 작성
- 프리랜서 → 고용주 리뷰 / 고용주 → 프리랜서 리뷰 양방향
- 정산 완료(status='completed') 후에만 리뷰 가능

### 5. 채용 공고 강화
- 기존 S3BA7 `job-*.js` 파일의 로직을 Next.js App Router 방식으로 마이그레이션
- `app/api/jobs/route.ts` — 목록/검색/생성
- `app/api/jobs/[id]/route.ts` — 상세/수정/삭제

## Expected Output Files
- `Process/S3_개발-2차/Backend_APIs/app/api/jobs/match/route.ts`
- `Process/S3_개발-2차/Backend_APIs/app/api/jobs/settle/route.ts`
- `Process/S3_개발-2차/Backend_APIs/app/api/jobs/hire/route.ts`
- `Process/S3_개발-2차/Backend_APIs/app/api/jobs/route.ts`
- `Process/S3_개발-2차/Backend_APIs/app/api/jobs/[id]/route.ts`

## Completion Criteria
- [ ] AI 매칭 알고리즘 실행 및 `job_matches` 저장
- [ ] 채용 확정 시 워크플로우 상태 전이 완료
- [ ] 정산 API에서 20% 수수료 자동 계산
- [ ] 정산 결과 `job_settlements` 저장
- [ ] 리뷰는 정산 완료 후에만 가능
- [ ] TypeScript 타입 오류 없음

## Tech Stack
- TypeScript, Next.js (App Router)
- Supabase (PostgreSQL + Auth)
- OpenRouter API (매칭 알고리즘)

## Tools
- npm
- openai-sdk
- supabase CLI

## Task Agent
`backend-developer-core`

## Verification Agent
`code-reviewer-core`

## Execution Type
AI-Only

## Remarks
- 수수료율 20%는 상수로 정의 (`COMMISSION_RATE = 0.20`)
- 정수 금액은 `Math.round()` 처리
- 기존 S3BA7 소급 파일 (`api/Backend_APIs/job-*.js`)과 기능 중복 확인 후 통합

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S3BA3 → `Process/S3_개발-2차/Backend_APIs/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `api/Backend_APIs/`

---

## 📝 파일 명명 규칙
- Next.js App Router 파일명: `route.ts`
- 폴더명: kebab-case (`jobs/match/`, `jobs/settle/`)
- 파일 상단 `@task S3BA3` 주석 필수
