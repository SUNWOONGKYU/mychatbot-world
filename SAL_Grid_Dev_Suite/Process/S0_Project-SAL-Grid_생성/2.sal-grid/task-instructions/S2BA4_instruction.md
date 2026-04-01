# Task Instruction - S2BA4

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
> 이미 구현된 코드를 Grid에 소급 등록하는 작업입니다.

---

# Task Instruction - S2BA4

## Task ID
S2BA4

## Task Name
챗봇 생성 API (소급)

## Task Goal
기존에 구현된 챗봇 생성 API(`api/create-bot.js`, `api/guest-create.js`)를 SAL Grid 체계에 소급 등록한다. 코드 현황을 확인하고 Grid 데이터를 업데이트하며, 필요 시 코드 품질 개선을 수행한다.

## Prerequisites (Dependencies)
- 없음 (소급 등록 Task, 독립적으로 수행)

## Specific Instructions

### 1. 기존 코드 현황 확인
- `api/create-bot.js` 파일 내용 검토
- `api/guest-create.js` 파일 내용 검토
- 코드 동작 여부, 누락 기능, 개선 필요사항 파악

### 2. Stage 폴더에 원본 복사
- 기존 파일을 Stage 폴더로 복사
  - `Process/S2_개발-1차/Backend_APIs/api/create-bot.js`
  - `Process/S2_개발-1차/Backend_APIs/api/guest-create.js`
- 파일 상단에 `@task S2BA4` 주석 추가

### 3. 코드 품질 검토 및 개선 (필요 시)
- 에러 핸들링 누락 여부 확인
- 인증 로직 적용 여부 확인 (guest-create는 인증 불필요)
- 응답 형식 표준화 (`{ success, data, error }`)

### 4. Grid JSON 파일 업데이트
- `method/json/data/grid_records/S2BA4.json` 상태를 Completed/Verified로 업데이트
- `generated_files` 필드에 파일 목록 기록

## Expected Output Files
- `Process/S2_개발-1차/Backend_APIs/api/create-bot.js` (복사 + 주석 추가)
- `Process/S2_개발-1차/Backend_APIs/api/guest-create.js` (복사 + 주석 추가)

## Completion Criteria
- [ ] 기존 파일이 Stage 폴더에 복사되었다
- [ ] `@task S2BA4` 주석이 추가되었다
- [ ] 코드 현황 검토 완료 및 개선사항 반영
- [ ] Grid JSON 파일이 Completed 상태로 업데이트되었다

## Tech Stack
- JavaScript (Node.js / Vercel Serverless)

## Tools
- npm
- git

## Execution Type
AI-Only

## Remarks
- 소급 등록이므로 신규 구현보다 현황 파악과 정리가 중심
- 기능 변경은 최소화, 주석 추가와 구조 확인에 집중
- S2BA1(강화 버전)과 역할 충돌 없이 공존할 수 있도록 확인

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S2BA4 → `Process/S2_개발-1차/Backend_APIs/`

### 제2 규칙: Production 코드 이중 저장
- 소급 Task이므로 기존 루트 파일(`api/`) 현행 유지
