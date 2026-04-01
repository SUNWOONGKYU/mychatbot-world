# Task Instruction - S2BA2

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## ⚠️ SAL Grid 데이터 작성 필수 규칙

- **S2** = 개발 1차 (Core Development)
- **BA** = Backend APIs (백엔드 API)

---

# Task Instruction - S2BA2

## Task ID
S2BA2

## Task Name
대화 API 강화 (페르소나 로딩, 감성슬라이더, 대화 저장)

## Task Goal
챗봇 대화 API를 고도화한다. 봇 ID 기반으로 페르소나 컨텍스트를 로딩하고, 감성슬라이더 값을 AI 요청에 반영하며, KB(지식베이스) RAG 검색을 통합하고, 대화 로그를 DB에 저장하며, 스트리밍 응답을 지원한다.

## Prerequisites (Dependencies)
- S1DB1 — 데이터베이스 스키마 (conversations, messages 테이블)
- S2BI1 — 멀티 AI 라우팅 (감성슬라이더 모델 선택)

## Specific Instructions

### 1. 페르소나 로더 (lib/persona-loader.ts)
- `loadPersona(botId: string)` 함수 구현
- Supabase `personas` 테이블에서 botId로 페르소나 조회
- 시스템 프롬프트 조합: `You are {name}. {personality}. Tone: {tone}.`
- 결과를 인메모리 캐시(Map)에 저장하여 반복 DB 조회 방지

### 2. 대화 API (app/api/chat/route.ts)
- POST 요청으로 `{ botId, message, emotionLevel, conversationId }` 수신
- `persona-loader`로 시스템 프롬프트 로딩
- `S2BI1` 라우터로 emotionLevel 기반 모델 선택
- 선택 모델로 OpenRouter API 호출
- 응답을 `messages` 테이블에 저장 (role, content, timestamp)
- 비스트리밍 JSON 응답 반환

### 3. 스트리밍 대화 API (app/api/chat/stream/route.ts)
- POST 요청으로 동일 파라미터 수신
- OpenRouter streaming 모드로 AI 응답 수신
- ReadableStream / Server-Sent Events(SSE) 형식으로 클라이언트에 청크 전송
- 스트리밍 완료 후 전체 응답을 `messages` 테이블에 저장

### 4. KB RAG 검색 통합
- `lib/persona-loader.ts` 또는 별도 `lib/kb-search.ts`에서 KB 검색 구현
- Supabase `kb_embeddings` 테이블에서 벡터 유사도 검색 (pgvector)
- 유사도 상위 3개 문서를 시스템 프롬프트에 context로 삽입
- KB 테이블이 없으면 건너뜀 (graceful fallback)

### 5. 파일 상단 Task ID 주석
```typescript
/**
 * @task S2BA2
 */
```

## Expected Output Files
- `Process/S2_개발-1차/Backend_APIs/app/api/chat/route.ts`
- `Process/S2_개발-1차/Backend_APIs/app/api/chat/stream/route.ts`
- `Process/S2_개발-1차/Backend_Infra/lib/persona-loader.ts`

## Completion Criteria
- [ ] POST /api/chat 호출 시 페르소나 컨텍스트가 적용된 AI 응답 반환
- [ ] `emotionLevel` 값이 모델 선택에 반영된다
- [ ] 대화 로그가 Supabase `messages` 테이블에 저장된다
- [ ] POST /api/chat/stream 호출 시 SSE 스트리밍 응답이 반환된다
- [ ] 페르소나 로더 캐싱으로 동일 botId 재요청 시 DB 조회 없음
- [ ] KB 검색 결과가 시스템 프롬프트에 반영된다 (KB 없으면 건너뜀)

## Tech Stack
- TypeScript, Next.js (App Router)
- Supabase (PostgreSQL, pgvector)
- OpenRouter API

## Tools
- npm
- supabase (MCP)
- openai-sdk

## Execution Type
AI-Only

## Remarks
- SSE 스트리밍은 Next.js `Response` with `ReadableStream` 사용
- `conversationId`가 없으면 새 conversation 레코드 생성 후 ID 반환
- KB 검색은 `match_threshold: 0.7` 기준으로 필터링

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- BA 파일: `Process/S2_개발-1차/Backend_APIs/`
- BI 파일: `Process/S2_개발-1차/Backend_Infra/`

### 제2 규칙: Production 코드 이중 저장
- git commit → Pre-commit Hook → 루트 폴더 자동 복사
