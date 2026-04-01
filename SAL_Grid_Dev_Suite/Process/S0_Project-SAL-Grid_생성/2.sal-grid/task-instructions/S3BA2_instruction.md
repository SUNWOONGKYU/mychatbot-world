# Task Instruction - S3BA2

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

# Task Instruction - S3BA2

## Task ID
S3BA2

## Task Name
Skills API (런타임 실행, 결제, 리뷰)

## Task Goal
My Chatbot World의 Skills(스킬마켓) 섹션을 지원하는 백엔드 API를 구현한다. 스킬 검색/설치/실행, 프롬프트 스킬 런타임 실행, 결제 처리(20% 수수료), 리뷰/평점 기능을 포함한다.

## Prerequisites (Dependencies)
- S3DB1 — skill_installations, skill_executions, skill_reviews 테이블 완료
- S3SC1 — API 인증 미들웨어 완료 (Rate Limiting 적용 대상)

## Specific Instructions

### 1. 스킬 목록/검색/상세 API

**`app/api/skills/route.ts`**
```typescript
/**
 * @task S3BA2
 * @description 스킬 마켓 목록/검색 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: 스킬 목록 + 검색
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') ?? '';
  const category = searchParams.get('category');

  const supabase = createClient();

  // skill-market/*.json 파일에서 읽거나, Supabase skill_catalog 테이블 조회
  // 설치 수, 평균 평점 포함하여 반환
  // ...
}
```

### 2. 스킬 설치/제거 API
- POST `/api/skills/install` — 스킬 설치 (`skill_installations` INSERT)
- DELETE `/api/skills/install` — 스킬 제거 (status → 'uninstalled')
- 이미 설치된 스킬 재설치 방지 (UNIQUE 제약 활용)
- 설치 시 결제 처리 로직 연동 (유료 스킬의 경우)

### 3. 프롬프트 스킬 런타임 실행 API

**`app/api/skills/execute/route.ts`**
```typescript
/**
 * @task S3BA2
 * @description 프롬프트 스킬 런타임 실행
 */
export async function POST(req: NextRequest) {
  const { skill_id, user_input, parameters } = await req.json();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. 설치 여부 확인
  const { data: installation } = await supabase
    .from('skill_installations')
    .select()
    .eq('user_id', user.id)
    .eq('skill_id', skill_id)
    .eq('status', 'active')
    .single();

  if (!installation) return NextResponse.json({ error: '스킬이 설치되지 않았습니다' }, { status: 403 });

  // 2. 스킬 정의 로드 (skill-market/*.json)
  // 3. AI API 호출 (스킬 프롬프트 + 사용자 입력)
  // 4. 실행 로그 기록 (skill_executions INSERT)
  // 5. 결과 반환
}
```

### 4. 결제 처리 (20% 수수료)
- 유료 스킬 구매 시 결제 처리
- 총액의 20%를 플랫폼 수수료로 계산
- 결제 성공 시 `skill_installations` INSERT
- `job_settlements`와 동일한 20% 수수료 구조 활용

### 5. 리뷰/평점 API

**`app/api/skills/review/route.ts`**
```typescript
/**
 * @task S3BA2
 * @description 스킬 리뷰/평점 API
 */
// POST: 리뷰 작성 (설치한 스킬만 가능)
// GET: 특정 스킬의 리뷰 목록 조회
// skill_reviews 테이블 CRUD
// 중복 리뷰 방지 (UPSERT 활용)
```

### 6. 내 스킬 목록 API
- GET `/api/skills/my` — 현재 사용자가 설치한 스킬 목록
- 설치일, 실행 횟수, 마지막 사용일 포함

## Expected Output Files
- `Process/S3_개발-2차/Backend_APIs/app/api/skills/route.ts`
- `Process/S3_개발-2차/Backend_APIs/app/api/skills/execute/route.ts`
- `Process/S3_개발-2차/Backend_APIs/app/api/skills/review/route.ts`
- `Process/S3_개발-2차/Backend_APIs/app/api/skills/install/route.ts`
- `Process/S3_개발-2차/Backend_APIs/app/api/skills/my/route.ts`

## Completion Criteria
- [ ] 스킬 목록 검색(GET) API 정상 동작
- [ ] 스킬 설치(POST) / 제거(DELETE) API 동작
- [ ] 런타임 실행 API — 설치된 스킬만 실행 가능 (미설치 403)
- [ ] 실행 결과를 `skill_executions`에 로그 기록
- [ ] 20% 수수료 계산 로직 구현
- [ ] 리뷰 작성/조회 API 동작 (UPSERT)
- [ ] TypeScript 타입 오류 없음

## Tech Stack
- TypeScript, Next.js (App Router)
- Supabase (PostgreSQL + Auth)
- OpenRouter API (스킬 실행)

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
- 스킬 정의는 `skill-market/prompt-skills/*.json` 파일에서 로드 (S3CS1 참조)
- 무료 스킬은 결제 없이 설치 가능
- 실행 비용은 token 수 기반으로 계산하여 로그에 기록

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S3BA2 → `Process/S3_개발-2차/Backend_APIs/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `api/Backend_APIs/`

---

## 📝 파일 명명 규칙
- Next.js App Router 파일명: `route.ts`
- 폴더명: kebab-case (`skills/execute/`, `skills/review/`)
- 파일 상단 `@task S3BA2` 주석 필수
