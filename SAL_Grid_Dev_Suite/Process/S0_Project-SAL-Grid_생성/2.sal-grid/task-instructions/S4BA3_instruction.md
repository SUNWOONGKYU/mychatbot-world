# Task Instruction - S4BA3

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
- **S4** = 개발 3차 (Advanced Development)

### Area 명칭
- **BA** = Backend APIs (백엔드 API)

---

# Task Instruction - S4BA3

## Task ID
S4BA3

## Task Name
피상속 API (피상속인 지정, 동의, 전환)

## Task Goal
디지털 유산 기능의 핵심 API를 구현한다. 크리에이터가 자신의 페르소나를 사후에 관리할 피상속인을 지정하고, 피상속인의 사전 동의를 관리하며, 페르소나별 허용/불허 설정 및 실제 디지털 유산 전환 프로세스를 처리하는 API를 구현한다.

## Prerequisites (Dependencies)
- S1DB2 — 사용자/페르소나 관련 DB 스키마
- S3SC1 — 인증/인가 미들웨어 확장

## Specific Instructions

### 1. 피상속인 지정 API (`app/api/inheritance/route.ts`)
- `GET /api/inheritance` — 현재 피상속인 지정 현황 조회
  - 응답: `{ heir: { userId, name, email, status }, personas: [{id, name, allowed}] }`
- `POST /api/inheritance` — 피상속인 지정
  - 요청 바디: `{ heirEmail, message }`
  - 피상속인에게 이메일 초대 발송 (이메일 서비스 연동 또는 로그 기록)
  - 중복 지정 시 기존 피상속인 대체
- `DELETE /api/inheritance` — 피상속인 지정 해제

### 2. 사전 동의 관리 API (`app/api/inheritance/consent/route.ts`)
- `GET /api/inheritance/consent` — 나에게 온 피상속 동의 요청 목록
  - 피상속인 역할로 조회 (자신이 지정된 건들)
- `POST /api/inheritance/consent` — 동의 수락/거부
  - 요청 바디: `{ inheritanceId, action: 'accept' | 'decline', note }`
  - 수락 시 상태: `consent_status: 'accepted'`
  - 거부 시 원래 크리에이터에게 알림 (이벤트 로그 기록)

### 3. 페르소나별 허용/불허 설정 API
- `PATCH /api/inheritance` — 페르소나별 피상속 허용 여부 일괄 업데이트
  - 요청 바디: `{ personas: [{personaId, allowed: boolean}] }`
  - `inheritance_persona_settings` 테이블 upsert

### 4. 디지털 유산 전환 API (`app/api/inheritance/transfer/route.ts`)
- `POST /api/inheritance/transfer` — 유산 전환 시작 (관리자 또는 인증된 피상속인)
  - 요청 바디: `{ originalOwnerId, proof }` (proof: 사망 증명 문서 URL 등)
  - 전환 프로세스: 페르소나 소유권 이전 + 구독 상태 유지 + 수익 정산 트리거
  - 전환 상태: `pending_review` → `approved` → `transferred`
- `GET /api/inheritance/transfer/:id` — 전환 프로세스 상태 조회

### 5. 파일 상단 Task ID 주석 필수
```typescript
/**
 * @task S4BA3
 * @description 피상속 API — 피상속인 지정, 동의, 페르소나 설정, 유산 전환
 */
```

## Expected Output Files
- `Process/S4_개발_마무리/Backend_APIs/app/api/inheritance/route.ts`
- `Process/S4_개발_마무리/Backend_APIs/app/api/inheritance/consent/route.ts`
- `Process/S4_개발_마무리/Backend_APIs/app/api/inheritance/transfer/route.ts`

## Completion Criteria
- [ ] `POST /api/inheritance` 가 피상속인을 지정하고 초대 이벤트를 기록한다
- [ ] `POST /api/inheritance/consent` 가 수락/거부를 처리하고 상태를 업데이트한다
- [ ] `PATCH /api/inheritance` 가 페르소나별 허용 여부를 저장한다
- [ ] `POST /api/inheritance/transfer` 가 전환 요청을 생성하고 `pending_review` 상태로 설정한다
- [ ] 비인증 요청 시 401을 반환한다
- [ ] TypeScript 타입 오류 없음

## Tech Stack
- TypeScript, Next.js App Router
- Supabase (PostgreSQL)
- Next.js Route Handlers

## Tools
- npm (빌드/타입 검사)
- supabase (MCP 서버, DB 조회)

## Execution Type
AI-Only

## Remarks
- 실제 유산 전환은 관리자 수동 승인이 필요한 프로세스 (자동화 금지)
- 사망 증명 문서는 URL만 저장 (파일 업로드는 별도 스토리지 서비스)
- 피상속인이 없으면 자동 전환 불가 (데이터 보존 정책)
- 저장 후 git commit 시 Pre-commit Hook이 루트 폴더로 자동 복사

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S4BA3 → `Process/S4_개발_마무리/Backend_APIs/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `api/Backend_APIs/`

---

## 📝 파일 명명 규칙
- Next.js App Router 규칙 준수: `route.ts`
- 파일 상단 `@task S4BA3` 주석 필수
