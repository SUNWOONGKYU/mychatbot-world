# S4F5: 어드민 대시보드 UI

## Task 정보
- **Task ID**: S4F5
- **Task Name**: 어드민 대시보드 UI
- **Stage**: S4 (개발 마무리)
- **Area**: F (Frontend)
- **Dependencies**: S4BA5, S4S1

## Task 목표
/admin 경로의 어드민 대시보드. 전체 통계(사용자/챗봇/매출), 최근 활동 로그, 사이드바 네비게이션. 권한 체크(admin role만 접근).

## 생성/수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `pages/admin/index.html` | 어드민 진입점 - 권한 체크 및 대시보드 리다이렉트 |
| `pages/admin/dashboard.html` | 어드민 대시보드 - 통계 카드, 차트, 최근 활동 로그 |
| `js/admin-dashboard.js` | 대시보드 로직 - API 연동 및 차트 렌더링 |
| `js/admin-nav.js` | 어드민 사이드바 네비게이션 |
| `css/admin-dashboard.css` | 어드민 대시보드 스타일링 |
