# Task Instruction - S3BA5

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
> 신규 개발이 아닌 기존 파일 검증 및 문서화가 주 목적입니다.

---

# Task Instruction - S3BA5

## Task ID
S3BA5

## Task Name
학습 진도 API (소급)

## Task Goal
이미 구현된 학습 진도 API (`api/Backend_APIs/learning-progress.js`)를 SAL Grid에 소급 등록한다. 기존 파일의 기능을 검토하고 Task 결과물로 문서화한다.

## Prerequisites (Dependencies)
- 없음 (소급 Task — 이미 구현 완료)

## Specific Instructions

### 1. 기존 파일 확인
- `api/Backend_APIs/learning-progress.js` 파일 존재 여부 확인
- 파일 상단 `@task S3BA5` 주석 추가 (없는 경우)
- 구현된 기능 목록 파악:
  - 진도 조회 (GET)
  - 진도 업데이트 (PUT/POST)
  - 완료율 계산 로직

### 2. 파일 상단 주석 추가 (소급)
```javascript
/**
 * @task S3BA5
 * @description 학습 진도 API — 소급 등록
 */
```

### 3. 기능 검토 및 보완
- API 엔드포인트 목록 확인
- 에러 처리 로직 점검
- Supabase 연동 여부 확인
- 미흡한 부분은 보완

## Expected Output Files
- `api/Backend_APIs/learning-progress.js` (기존 파일 확인 + 주석 추가)

## Completion Criteria
- [ ] `api/Backend_APIs/learning-progress.js` 파일 존재 확인
- [ ] 파일 상단 `@task S3BA5` 주석 추가
- [ ] 주요 기능 (진도 조회, 업데이트) 동작 확인
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
- 기존 파일이 없는 경우 `api/Backend_APIs/learning-progress.js` 신규 생성
- 상태는 처음부터 'Completed'로 설정 가능

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- 소급 Task이므로 이미 루트 폴더(`api/Backend_APIs/`)에 저장되어 있음
- Stage 폴더(`Process/S3_개발-2차/Backend_APIs/`)에도 복사본 생성 권장

### 제2 규칙: Production 코드 이중 저장
- 루트 `api/Backend_APIs/learning-progress.js`가 배포본

---

## 📝 파일 명명 규칙
- 기존 파일명 유지: `learning-progress.js`
- 파일 상단 `@task S3BA5` 주석 추가
