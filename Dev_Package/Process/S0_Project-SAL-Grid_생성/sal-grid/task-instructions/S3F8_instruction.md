# S3F8: Learning(학습) 전용 페이지

## Task 정보
- **Task ID**: S3F8
- **Task Name**: Learning(학습) 전용 페이지
- **Stage**: S3 (개발 2차)
- **Area**: F (Frontend)
- **Dependencies**: S2F8, S3BA1

## Task 목표
학습 메뉴 전용 페이지 구현. 챗봇스쿨 커리큘럼 목록, 학습 진행 상태, 수료증 표시. 기존 school-session.js API 연동.

## 생성/수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `pages/learning/index.html` | 학습 메인 페이지 - 커리큘럼 목록 및 진행 상태 표시 |
| `pages/learning/curriculum.html` | 커리큘럼 상세 페이지 - 강의 모듈 및 진행 추적 |
| `pages/learning/certificate.html` | 수료증 표시 페이지 |
| `js/learning.js` | 학습 페이지 로직 - API 연동 및 진행 상태 관리 |
| `css/learning.css` | 학습 페이지 스타일링 |
