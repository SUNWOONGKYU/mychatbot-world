# Task Instruction - S2BA6

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

# Task Instruction - S2BA6

## Task ID
S2BA6

## Task Name
사용량 API (소급)

## Task Goal
기존에 구현된 사용량 API(`api/usage.js`)를 SAL Grid 체계에 소급 등록한다. 코드 현황을 확인하고 필요 시 개선한다.

## Prerequisites (Dependencies)
- 없음 (소급 등록 Task)

## Specific Instructions

### 1. 기존 코드 현황 확인
- `api/usage.js` 파일 내용 검토
- 조회 항목 파악: 토큰 사용량, API 호출 횟수, 비용 등
- DB 테이블 의존성 확인

### 2. Stage 폴더에 복사
- `Process/S2_개발-1차/Backend_APIs/api/usage.js`
- 파일 상단에 `@task S2BA6` 주석 추가

### 3. 코드 품질 검토
- 인증 미들웨어 적용 여부 확인 (사용량은 로그인 필요)
- 날짜 범위 필터 파라미터 지원 여부 확인
- 집계 방식 확인 (DB 쿼리 vs 클라이언트 계산)

### 4. Grid JSON 파일 업데이트
- `method/json/data/grid_records/S2BA6.json` 상태를 Completed/Verified로 업데이트

## Expected Output Files
- `Process/S2_개발-1차/Backend_APIs/api/usage.js`

## Completion Criteria
- [ ] 기존 파일이 Stage 폴더에 복사되었다
- [ ] `@task S2BA6` 주석이 추가되었다
- [ ] 사용량 데이터 조회 로직 확인 완료
- [ ] Grid JSON 파일이 Completed 상태로 업데이트되었다

## Tech Stack
- JavaScript (Node.js / Vercel Serverless)
- Supabase (PostgreSQL)

## Tools
- npm
- supabase (MCP)

## Execution Type
AI-Only

## Remarks
- 소급 등록이므로 기능 변경 최소화
- 미구현 기능이 있으면 remarks에 기록하고 S3에서 개선 Task로 추가

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S2BA6 → `Process/S2_개발-1차/Backend_APIs/`
