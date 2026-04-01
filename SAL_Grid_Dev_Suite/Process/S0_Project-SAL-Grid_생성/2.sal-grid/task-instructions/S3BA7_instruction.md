# Task Instruction - S3BA7

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

> **⚠️ 소급(Retroactive) Task 안내**
> 이 Task는 이미 완료된 작업을 SAL Grid에 등록하는 소급 Task입니다.

---

# Task Instruction - S3BA7

## Task ID
S3BA7

## Task Name
Jobs API 기본 4개 (소급)

## Task Goal
이미 구현된 Jobs 기본 API 파일들(`api/Backend_APIs/job-*.js`, 5개)을 SAL Grid에 소급 등록한다. 기존 파일의 기능을 검토하고 Task 결과물로 문서화한다.

## Prerequisites (Dependencies)
- 없음 (소급 Task — 이미 구현 완료)

## Specific Instructions

### 1. 기존 파일 확인 (5개)
다음 파일들이 `api/Backend_APIs/` 에 존재하는지 확인:
- `job-list.js` — 채용 공고 목록 조회
- `job-detail.js` — 채용 공고 상세 조회
- `job-apply.js` — 채용 지원
- `job-search.js` — 채용 공고 검색
- `job-create.js` — 채용 공고 등록

### 2. 파일 상단 주석 추가 (소급)
```javascript
/**
 * @task S3BA7
 * @description Jobs API 기본 — 소급 등록
 */
```

### 3. 기능 검토
- 각 API 엔드포인트 확인
- Supabase `job_postings`, `job_matches` 테이블 연동 여부
- 에러 처리 로직 점검

## Expected Output Files
- `api/Backend_APIs/job-list.js`
- `api/Backend_APIs/job-detail.js`
- `api/Backend_APIs/job-apply.js`
- `api/Backend_APIs/job-search.js`
- `api/Backend_APIs/job-create.js`

## Completion Criteria
- [ ] 5개 파일 모두 존재 확인
- [ ] 각 파일 상단 `@task S3BA7` 주석 추가
- [ ] 주요 기능 동작 확인
- [ ] Grid JSON 파일 상태 업데이트 (Completed, Verified)

## Tech Stack
- JavaScript (Node.js/Vercel Serverless)
- Supabase

## Tools
- supabase CLI

## Task Agent
`backend-developer-core`

## Verification Agent
`code-reviewer-core`

## Execution Type
AI-Only

## Remarks
- 소급 Task이므로 신규 개발보다 검증과 문서화에 집중
- S3BA3(Jobs API 강화)와 기능 범위가 다름 — S3BA7는 기본 CRUD, S3BA3은 AI 매칭/정산 고도화
- 누락 파일은 기본 구조로 신규 생성

---

## ⚠️ 작업 결과물 저장 규칙

- 소급 Task이므로 이미 루트 폴더(`api/Backend_APIs/`)에 저장되어 있음
- 루트 `api/Backend_APIs/job-*.js` 파일들이 배포본

---

## 📝 파일 명명 규칙
- 기존 파일명 유지: `job-{기능}.js`
- 파일 상단 `@task S3BA7` 주석 추가
