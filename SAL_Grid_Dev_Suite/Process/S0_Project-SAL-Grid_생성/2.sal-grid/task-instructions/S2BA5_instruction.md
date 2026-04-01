# Task Instruction - S2BA5

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

> **이 Task는 소급(Completed) 등록 Task입니다.**

---

# Task Instruction - S2BA5

## Task ID
S2BA5

## Task Name
대화 API 기본 (chat, chat-stream) (소급)

## Task Goal
기존에 구현된 기본 대화 API(`api/chat.js`, `api/chat-stream.js`)를 SAL Grid 체계에 소급 등록한다. 코드 현황을 확인하고, 필요 시 개선 후 Stage 폴더에 정리한다.

## Prerequisites (Dependencies)
- 없음 (소급 등록 Task)

## Specific Instructions

### 1. 기존 코드 현황 확인
- `api/chat.js` 파일 내용 검토: AI 호출 방식, 응답 형식, 에러 처리
- `api/chat-stream.js` 파일 내용 검토: 스트리밍 구현 방식 확인

### 2. Stage 폴더에 원본 복사
- `Process/S2_개발-1차/Backend_APIs/api/chat.js`
- `Process/S2_개발-1차/Backend_APIs/api/chat-stream.js`
- 각 파일 상단에 `@task S2BA5` 주석 추가

### 3. 코드 품질 검토
- AI API 호출 시 API 키 환경변수 사용 여부 확인 (`process.env.OPENROUTER_API_KEY`)
- 스트리밍 응답이 클라이언트에 올바르게 전달되는지 확인
- 에러 응답 형식 통일 확인

### 4. Grid JSON 파일 업데이트
- `method/json/data/grid_records/S2BA5.json` 상태를 Completed/Verified로 업데이트

## Expected Output Files
- `Process/S2_개발-1차/Backend_APIs/api/chat.js`
- `Process/S2_개발-1차/Backend_APIs/api/chat-stream.js`

## Completion Criteria
- [ ] 기존 파일이 Stage 폴더에 복사되었다
- [ ] `@task S2BA5` 주석이 추가되었다
- [ ] API 키 환경변수 사용이 확인되었다
- [ ] Grid JSON 파일이 Completed 상태로 업데이트되었다

## Tech Stack
- JavaScript (Node.js / Vercel Serverless)

## Tools
- npm
- git

## Execution Type
AI-Only

## Remarks
- 소급 등록이므로 기능 변경 최소화
- S2BA2(강화 버전)와 역할 분리: 기본 버전(S2BA5)은 페르소나 로딩 없음

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S2BA5 → `Process/S2_개발-1차/Backend_APIs/`
