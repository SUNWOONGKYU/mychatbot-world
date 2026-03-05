# S3F9: Jobs(구봇구직) 챗봇 목록/탐색 페이지

## Task 정보
- **Task ID**: S3F9
- **Task Name**: Jobs(구봇구직) 챗봇 목록/탐색 페이지
- **Stage**: S3 (개발 2차)
- **Area**: F (Frontend)
- **Dependencies**: S2F8, S3BA6

## Task 목표
구봇구직 메인 페이지. 챗봇 카드 목록, 카테고리 필터, 검색, 정렬(인기순/최신순/평점순). 구봇(챗봇 찾기) + 구직(일감 찾기) 탭.

## 생성/수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `pages/jobs/index.html` | 구봇구직 메인 페이지 - 탭 네비게이션 및 검색/필터 UI |
| `pages/jobs/search.html` | 검색 결과 페이지 - 필터 및 정렬 옵션 |
| `js/jobs.js` | 구봇구직 페이지 로직 - API 연동, 검색/필터/정렬 |
| `css/jobs.css` | 구봇구직 페이지 스타일링 |
