# Task Instruction - S3BA6

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

# Task Instruction - S3BA6

## Task ID
S3BA6

## Task Name
커뮤니티 API 7개 (소급)

## Task Goal
이미 구현된 커뮤니티 API 파일 7개(`api/Backend_APIs/community-*.js`)를 SAL Grid에 소급 등록한다. 기존 파일의 기능을 검토하고 Task 결과물로 문서화한다.

## Prerequisites (Dependencies)
- 없음 (소급 Task — 이미 구현 완료)

## Specific Instructions

### 1. 기존 파일 확인 (7개)
다음 파일들이 `api/Backend_APIs/` 에 존재하는지 확인:
- `community-posts.js` — 게시글 CRUD
- `community-comments.js` — 댓글 CRUD
- `community-likes.js` — 좋아요/취소
- `community-search.js` — 게시글 검색
- `community-categories.js` — 카테고리 관리
- `community-notifications.js` — 알림
- `community-report.js` — 신고 기능

### 2. 파일 상단 주석 추가 (소급)
각 파일에 주석 추가:
```javascript
/**
 * @task S3BA6
 * @description 커뮤니티 API — 소급 등록
 */
```

### 3. 기능 검토 및 보완
- 각 API의 주요 엔드포인트 확인
- 에러 처리 로직 점검
- Supabase 연동 여부 확인
- 7개 파일 중 누락된 파일이 있다면 신규 생성

## Expected Output Files
- `api/Backend_APIs/community-posts.js`
- `api/Backend_APIs/community-comments.js`
- `api/Backend_APIs/community-likes.js`
- `api/Backend_APIs/community-search.js`
- `api/Backend_APIs/community-categories.js`
- `api/Backend_APIs/community-notifications.js`
- `api/Backend_APIs/community-report.js`

## Completion Criteria
- [ ] 7개 파일 모두 존재 확인
- [ ] 각 파일 상단 `@task S3BA6` 주석 추가
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
- 누락 파일은 기본 구조로 신규 생성 후 등록
- S3BA4와 기능 중복 확인 필요

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- 소급 Task이므로 이미 루트 폴더(`api/Backend_APIs/`)에 저장되어 있음

### 제2 규칙: Production 코드 이중 저장
- 루트 `api/Backend_APIs/community-*.js` 파일들이 배포본

---

## 📝 파일 명명 규칙
- 기존 파일명 유지: `community-{기능}.js`
- 파일 상단 `@task S3BA6` 주석 추가
