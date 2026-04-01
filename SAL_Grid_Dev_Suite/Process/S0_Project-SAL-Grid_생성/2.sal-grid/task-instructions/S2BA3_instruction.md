# Task Instruction - S2BA3

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

# Task Instruction - S2BA3

## Task ID
S2BA3

## Task Name
Home API (KB 임베딩, 설정 저장, 클라우드 동기화)

## Task Goal
홈 대시보드에서 필요한 백엔드 API를 구현한다. KB(지식베이스) 파일 업로드 및 임베딩 처리, 챗봇 설정 CRUD, 클라우드 동기화 API를 완성한다.

## Prerequisites (Dependencies)
- S1DB1 — 데이터베이스 스키마 (kb_documents, kb_embeddings, bot_settings 테이블)
- S1SC1 — 인증/보안 미들웨어

## Specific Instructions

### 1. KB 기본 CRUD API (app/api/kb/route.ts)
- GET: 로그인 사용자의 KB 문서 목록 조회 (botId 필터)
- POST: 새 KB 문서 텍스트 등록 (title, content, botId)
- DELETE: KB 문서 삭제 (문서 + 임베딩 함께 삭제)
- Supabase `kb_documents` 테이블 CRUD

### 2. KB 임베딩 API (app/api/kb/embed/route.ts)
- POST 요청으로 `{ documentId, content }` 수신
- OpenAI / OpenRouter embedding API 호출 (text-embedding-3-small)
- 반환된 벡터를 Supabase `kb_embeddings` 테이블에 저장 (pgvector)
- 대용량 문서는 청크 분할 (1000 토큰 단위, 200 토큰 오버랩)
- `{ documentId, chunkCount }` 반환

### 3. 챗봇 설정 API (app/api/settings/route.ts)
- GET: botId로 설정 조회 (`bot_settings` 테이블)
- PUT: 설정 전체 업데이트 (emotionDefault, costDefault, greeting, language 등)
- PATCH: 설정 부분 업데이트
- 존재하지 않는 설정은 기본값으로 자동 생성 (upsert)

### 4. 클라우드 동기화 API (app/api/settings/route.ts 확장 또는 별도 엔드포인트)
- POST /api/settings/sync: 로컬 설정을 DB와 병합
  - 클라이언트 `lastSyncAt` 타임스탬프 기준으로 최신 데이터 반환
  - 충돌 시 서버 데이터 우선
- 응답: `{ settings, syncedAt }`

### 5. 파일 상단 Task ID 주석
```typescript
/**
 * @task S2BA3
 */
```

## Expected Output Files
- `Process/S2_개발-1차/Backend_APIs/app/api/kb/route.ts`
- `Process/S2_개발-1차/Backend_APIs/app/api/kb/embed/route.ts`
- `Process/S2_개발-1차/Backend_APIs/app/api/settings/route.ts`

## Completion Criteria
- [ ] GET/POST/DELETE /api/kb 가 정상 동작한다
- [ ] POST /api/kb/embed 호출 시 벡터 임베딩이 DB에 저장된다
- [ ] 대용량 문서가 청크로 분할되어 처리된다
- [ ] GET/PUT/PATCH /api/settings 가 정상 동작한다
- [ ] POST /api/settings/sync 가 lastSyncAt 기준 병합 응답을 반환한다
- [ ] 인증 없는 요청은 401 반환

## Tech Stack
- TypeScript, Next.js (App Router)
- Supabase (PostgreSQL, pgvector)
- OpenAI Embeddings API (text-embedding-3-small)

## Tools
- npm
- supabase (MCP)
- openai-sdk

## Execution Type
AI-Only

## Remarks
- 임베딩 API는 비용 발생, 청크 분할로 최소화
- pgvector 확장이 Supabase에 활성화되어 있어야 함 (S1DB1 선행)
- 동기화 충돌 정책: server-wins (클라이언트 최신 데이터 무시)

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S2BA3 → `Process/S2_개발-1차/Backend_APIs/`

### 제2 규칙: Production 코드 이중 저장
- git commit → Pre-commit Hook → `api/Backend_APIs/` 자동 복사
