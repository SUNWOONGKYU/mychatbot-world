# S4BA4: 어드민 API (인증 + CRUD)

## Task 정보
- **Task ID**: S4BA4
- **Task Name**: 어드민 API (인증 + CRUD)
- **Stage**: S4 (개발 마무리)
- **Area**: BA (Backend APIs)
- **Dependencies**: S4S1, S3DB3

## Task 목표
어드민 전용 API. role 체크 미들웨어, Supabase Service Role Key 사용. 사용자/챗봇/스킬/일감/커뮤니티/결제 관리 엔드포인트.

## 생성/수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `api/Backend_APIs/admin-auth.js` | 어드민 인증 미들웨어 - role 체크 |
| `api/Backend_APIs/admin-users.js` | 사용자 관리 API - CRUD, 정지, 삭제 |
| `api/Backend_APIs/admin-bots.js` | 챗봇 관리 API - 비활성화, 삭제 |
| `api/Backend_APIs/admin-skills.js` | 스킬 승인/거부/삭제 API |
| `api/Backend_APIs/admin-jobs.js` | 일감 관리 및 분쟁 해결 API |
| `api/Backend_APIs/admin-reports.js` | 신고 처리 API |
| `api/Backend_APIs/admin-payments.js` | 결제/환불 관리 API |
| `api/Backend_APIs/admin-content.js` | 콘텐츠 관리 API - 템플릿, FAQ |
