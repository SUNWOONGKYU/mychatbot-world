# Task Instruction - S3BA1

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

# Task Instruction - S3BA1

## Task ID
S3BA1

## Task Name
School API (AI 시나리오, 채점, 멘토링)

## Task Goal
My Chatbot World의 School(학습) 섹션을 지원하는 백엔드 API를 구현한다. AI 기반 학습 시나리오 생성, 자동 채점, 멘토링 피드백, 커리큘럼 진도 관리 기능을 포함한다.

## Prerequisites (Dependencies)
- S3DB1 — School/Skills/Jobs 추가 테이블 완료 (learning_sessions 등 필요)
- S2BA2 — AI 채팅 고도화 완료 (AI 호출 패턴 참조)

## Specific Instructions

### 1. 학습 세션 CRUD API

**`app/api/school/session/route.ts`**
```typescript
/**
 * @task S3BA1
 * @description 학습 세션 생성/조회/완료 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: 학습 세션 시작
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { curriculum_id, scenario_type } = await req.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('learning_sessions')
    .insert({ user_id: user.id, curriculum_id, scenario_type })
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ session: data });
}

// GET: 내 학습 세션 목록
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('learning_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false });

  return NextResponse.json({ sessions: data });
}
```

### 2. AI 시나리오 생성 API
- `app/api/school/scenario/route.ts` 작성
- 입력: `{ curriculum_id, topic, difficulty_level }`
- OpenRouter API 호출하여 시나리오 텍스트 생성
- 시나리오 타입: 'roleplay', 'interview', 'debate', 'presentation'
- 생성된 시나리오를 `learning_sessions` 메타데이터에 저장

### 3. 자동 채점 API

**`app/api/school/grade/route.ts`**
- 입력: `{ session_id, user_answer, criteria }`
- AI에게 채점 기준(criteria)과 사용자 답변(user_answer)을 전달
- 점수(0~100)와 피드백 텍스트 반환
- 점수 85점 이상 시 `learning_certifications` 자동 발급 트리거

```typescript
/**
 * @task S3BA1
 * @description AI 자동 채점 API
 */
export async function POST(req: NextRequest) {
  const { session_id, user_answer, criteria } = await req.json();

  // AI 채점 프롬프트
  const gradingPrompt = `
다음 채점 기준에 따라 사용자의 답변을 0~100점으로 평가하세요.

[채점 기준]
${criteria}

[사용자 답변]
${user_answer}

JSON 형식으로 응답: { "score": 숫자, "feedback": "피드백 텍스트" }
  `;

  // OpenRouter API 호출 (ai-router 활용)
  // score >= 85 시 certification 발급
}
```

### 4. 멘토링 피드백 API

**`app/api/school/mentor/route.ts`**
- 입력: `{ session_id, question }`
- AI가 해당 커리큘럼 맥락에 맞는 멘토링 응답 생성
- 답변을 직접 주지 않고 힌트와 가이드 제공 방식

### 5. 커리큘럼 진도 API
- `app/api/school/progress/route.ts` 작성
- GET: 사용자의 전체 커리큘럼 진도 조회
- PUT: 특정 모듈 진도율 업데이트
- `learning_progress` 테이블 CRUD

## Expected Output Files
- `Process/S3_개발-2차/Backend_APIs/app/api/school/session/route.ts`
- `Process/S3_개발-2차/Backend_APIs/app/api/school/scenario/route.ts`
- `Process/S3_개발-2차/Backend_APIs/app/api/school/grade/route.ts`
- `Process/S3_개발-2차/Backend_APIs/app/api/school/mentor/route.ts`
- `Process/S3_개발-2차/Backend_APIs/app/api/school/progress/route.ts`

## Completion Criteria
- [ ] 학습 세션 생성(POST) 및 조회(GET) API 정상 동작
- [ ] AI 시나리오 생성 API 텍스트 반환
- [ ] 채점 API 0~100 점수 + 피드백 반환
- [ ] 85점 이상 시 인증서 발급 로직 구현
- [ ] 멘토링 API 힌트 기반 응답
- [ ] 진도 조회/업데이트 API 동작
- [ ] Supabase 인증 필수 (미인증 시 401)
- [ ] TypeScript 타입 오류 없음

## Tech Stack
- TypeScript, Next.js (App Router)
- Supabase (PostgreSQL + Auth)
- OpenRouter API

## Tools
- npm
- openai-sdk (OpenRouter 클라이언트)
- supabase CLI

## Task Agent
`backend-developer-core`

## Verification Agent
`code-reviewer-core`

## Execution Type
AI-Only

## Remarks
- AI 채점 프롬프트는 한국어로 작성
- 채점 결과를 별도 테이블에 저장하지 않아도 되나 session에 연결 권장
- 인증서 발급은 `learning_certifications` INSERT로 처리

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S3BA1 → `Process/S3_개발-2차/Backend_APIs/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `api/Backend_APIs/`

---

## 📝 파일 명명 규칙
- Next.js App Router 파일명: `route.ts`
- 폴더명: kebab-case (`school/session/`, `school/grade/`)
- 파일 상단 `@task S3BA1` 주석 필수
