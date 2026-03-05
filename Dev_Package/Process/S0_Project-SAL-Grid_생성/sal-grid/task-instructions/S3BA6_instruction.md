# S3BA6: Jobs(구봇구직) 중개 API

## Task 정보
- **Task ID**: S3BA6
- **Task Name**: Jobs(구봇구직) 중개 API
- **Stage**: S3 (개발 2차)
- **Area**: BA (Backend APIs)
- **Dependencies**: S3BA3, S3DB3

## Task 목표
구봇구직 중개 시스템 API. 챗봇 목록/검색, 고용 요청 생성, 매칭 알고리즘, 리뷰 CRUD, 수수료 계산.

## 생성/수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `api/Backend_APIs/job-list.js` | 챗봇 목록 조회 API - 필터, 검색, 정렬 포함 |
| `api/Backend_APIs/job-hire.js` | 고용 요청 생성/조회/수락 API |
| `api/Backend_APIs/job-review.js` | 리뷰 CRUD API - 평점, 댓글 관리 |
| `api/Backend_APIs/job-matching.js` | 매칭 알고리즘 API - 최적 챗봇 추천 |
| `api/Backend_APIs/job-fee.js` | 수수료 계산 API - 거래액 기반 수수료 산정 |
