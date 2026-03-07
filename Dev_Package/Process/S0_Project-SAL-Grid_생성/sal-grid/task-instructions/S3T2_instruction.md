# S3T2: Jobs/Community API 정합성 수정

## Task 정보
- **Task ID**: S3T2
- **Task Name**: Jobs/Community API 정합성 수정
- **Stage**: S3 (개발 2차)
- **Area**: T (Testing)
- **Dependencies**: S3F9, S3F11, S3BA6, S3BA7

## Task 목표

Jobs와 Community 페이지의 프론트엔드 JS 코드와 백엔드 API 간의 파라미터 네이밍 불일치, API 경로 불일치를 수정하고 테스트한다.

## 배경 및 목적

코드 분석 결과 다음 불일치가 발견됨:

### Jobs 불일치
1. `js/jobs.js` line 11: `const JOBS_API = '/api/Backend_APIs/job-list.js'` — `.js` 확장자 불필요
2. hire.html로의 네비게이션 흐름이 index.html에서 직접 연결 안 됨
3. search.html 존재하나 index.html의 hero 검색폼과 미연결

### Community 불일치
1. `js/community.js`에서 `targetId` 사용 → API는 `target_id` (snake_case) 기대
2. Like API: camelCase vs snake_case 혼재
3. 신고(report) submit 핸들러 미연결
4. 검색 API 엔드포인트 완전 연결 확인

## 기능 요구사항

### 1. Jobs 수정
- API 경로에서 `.js` 확장자 제거
- 봇/일감 카드 클릭 → detail.html 이동 연결 확인
- hero 검색폼 submit → 필터 적용 연결

### 2. Community 수정
- 모든 API 호출 파라미터를 snake_case로 통일 (`target_id`, `target_type`)
- 신고 모달 submit → API 호출 핸들러 연결
- 검색 기능 → API `?keyword=` 파라미터 연결

### 3. 통합 테스트
- Jobs: 탭 전환, 카테고리 필터, 정렬, 검색, 페이지네이션 동작 확인
- Community: 카테고리 탭, 정렬, 검색, 좋아요, 신고 동작 확인

## 코드 작성 기준
- 파일 상단 `@task` 주석 유지 (기존 Task ID 보존)
- 기존 기능 회귀 방지 — 수정 범위 최소화

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `js/jobs.js` | API 경로 수정, 네비게이션 연결 |
| `js/community.js` | 파라미터 snake_case 통일, 신고 핸들러 연결 |

## 완료 기준
- [ ] Jobs API 호출 시 `.js` 확장자 없이 정상 동작
- [ ] Community 파라미터가 snake_case로 통일
- [ ] 신고 모달 submit이 API와 연결
- [ ] 검색 기능이 양쪽 페이지에서 정상 동작
- [ ] 기존 기능 회귀 없음
