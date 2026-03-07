# S3BA8: Learning 진행률 Supabase 동기화 API

## Task 정보
- **Task ID**: S3BA8
- **Task Name**: Learning 진행률 Supabase 동기화 API
- **Stage**: S3 (개발 2차)
- **Area**: BA (Backend APIs)
- **Dependencies**: S3BA5, S3DB2

## Task 목표

Learning 학습 진행률을 LocalStorage 전용에서 Supabase `bot_growth` 테이블과 양방향 동기화하는 API 엔드포인트를 생성한다.

## 배경 및 목적

현재 Learning 진행률은 브라우저 LocalStorage에만 저장된다 (`mcw_learning_progress`).
다른 기기에서 접속하면 진행률이 0%로 초기화된다.
`bot_growth` 테이블은 이미 존재하며 (S3DB2에서 생성), `school_sessions_completed`, `experience`, `level` 컬럼이 있다.

## 기능 요구사항

### 1. GET `/api/Backend_APIs/learning-progress`
- Query: `?botId={botId}`
- 인증: Bearer token 필수
- 응답:
  ```json
  {
    "progress": {
      "basic": 75,
      "intermediate": 50,
      "advanced": 0,
      "master": 0
    },
    "history": [...],
    "stats": {
      "completedCourses": 1,
      "overallProgress": 31,
      "totalSessions": 12
    }
  }
  ```
- `bot_growth` 테이블 + 별도 `learning_progress` JSON 컬럼 활용

### 2. POST `/api/Backend_APIs/learning-progress`
- Body: `{ botId, curriculumId, progress, historyEntry }`
- 인증: Bearer token 필수
- 동작:
  - `bot_growth` 테이블의 해당 봇 레코드 UPDATE
  - `school_sessions_completed` 증가
  - `experience` XP 추가
  - `level` 재계산
  - 진행률 JSON 저장

### 3. 데이터 병합 전략
- 서버 진행률 > 로컬 진행률 → 서버 값 사용
- 로컬 진행률 > 서버 진행률 → 로컬 값으로 서버 업데이트
- 충돌 시: 더 높은 진행률 유지 (max 전략)

## 코드 작성 기준
- 파일 상단에 `@task S3BA8` 주석 필수
- Supabase client 사용 (`@supabase/supabase-js`)
- JWT 토큰 검증: `supabase.auth.getUser(token)`
- 에러 응답: `{ error: "message" }` + 적절한 HTTP 상태 코드

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `api/Backend_APIs/learning-progress.js` | 진행률 동기화 API (신규) |

## 완료 기준
- [ ] GET 요청으로 서버 진행률 조회 가능
- [ ] POST 요청으로 진행률 저장 가능
- [ ] 인증 없는 요청 시 401 반환
- [ ] XP/레벨 자동 재계산
- [ ] 병합 전략(max)이 올바르게 동작
