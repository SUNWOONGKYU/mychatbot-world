# Task Instruction - S3BA8

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

# Task Instruction - S3BA8

## Task ID
S3BA8

## Task Name
스킬 API 기본 (소급)

## Task Goal
이미 구현된 스킬 API 파일들(`api/skills.js`, `api/skill-integrations.js`)을 SAL Grid에 소급 등록한다. 기존 파일의 기능을 검토하고 Task 결과물로 문서화한다.

## Prerequisites (Dependencies)
- 없음 (소급 Task — 이미 구현 완료)

## Specific Instructions

### 1. 기존 파일 확인 (2개)
- `api/skills.js` — 스킬 목록/설치/실행 기본 API
- `api/skill-integrations.js` — 외부 서비스 스킬 통합 API

### 2. 파일 상단 주석 추가 (소급)
```javascript
/**
 * @task S3BA8
 * @description 스킬 API 기본 — 소급 등록
 */
```

### 3. 기능 검토
- `api/skills.js`:
  - 스킬 목록 조회
  - 스킬 설치/제거
  - 스킬 실행 기본 로직
- `api/skill-integrations.js`:
  - 외부 서비스 연동 (GitHub, Slack 등)
  - 통합 스킬 인증/실행

### 4. S3BA2와 관계 명확화
- S3BA8 (소급) = 기존 Vanilla JS 기반 API
- S3BA2 (신규) = Next.js App Router 방식 고도화 API
- 두 파일의 역할 범위가 명확히 분리되도록 주석에 기술

## Expected Output Files
- `api/skills.js` (기존 파일 확인 + 주석 추가)
- `api/skill-integrations.js` (기존 파일 확인 + 주석 추가)

## Completion Criteria
- [ ] `api/skills.js` 파일 존재 확인
- [ ] `api/skill-integrations.js` 파일 존재 확인
- [ ] 각 파일 상단 `@task S3BA8` 주석 추가
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
- `api/skills.js`가 없는 경우 기본 구조 신규 생성
- S3BA2(Skills API 고도화)와 역할 범위 명확히 구분

---

## ⚠️ 작업 결과물 저장 규칙

- 소급 Task이므로 이미 루트 폴더(`api/`)에 저장되어 있음
- `api/skills.js`, `api/skill-integrations.js`가 배포본

---

## 📝 파일 명명 규칙
- 기존 파일명 유지: `skills.js`, `skill-integrations.js`
- 파일 상단 `@task S3BA8` 주석 추가
