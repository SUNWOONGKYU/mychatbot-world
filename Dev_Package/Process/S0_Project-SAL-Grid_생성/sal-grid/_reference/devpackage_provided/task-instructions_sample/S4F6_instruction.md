# S4F6: My Page 기능 (알림/문의)

## Task 정보
- **Task ID**: S4F6
- **Task Name**: My Page 기능 (알림/문의)
- **Stage**: S4 (개발-3차)
- **Area**: F (Frontend)
- **Dependencies**: S4D2

## Task 목표

My Page 사용자 기능 구현:
1. 메인 대시보드 헤더에 인앱 알림 UI
2. My Page 문의 관리 페이지

---

## Part 1: 인앱 알림 UI

### 1. 헤더 알림 벨 추가

- 헤더 우측에 알림 벨 아이콘 추가
- 읽지 않은 알림 개수 배지 표시
- 클릭 시 드롭다운 토글

### 2. JavaScript 함수

| 함수 | 기능 |
|------|------|
| loadUserNotifications() | 사용자 알림 목록 로드 |
| toggleNotificationDropdown() | 드롭다운 표시/숨김 |
| markNotificationRead() | 알림 읽음 처리 |
| markAllNotificationsRead() | 전체 알림 읽음 |

### 3. 관리자 대시보드 연동

관리자 작업 시 자동으로 사용자 알림 생성

---

## Part 2: My Page 문의 관리

### 1. 문의 관리 페이지 기능

- 문의 목록 조회 (자신이 등록한 문의만)
- 문의 상태 확인 (대기/처리중/완료)
- 새 문의 작성
- 문의 상세 보기 및 답변 확인

### 2. 문의 상태 표시

| 상태 | 의미 |
|------|------|
| pending | 대기 - 관리자 확인 전 |
| in_progress | 처리중 - 답변 준비 중 |
| answered | 완료 - 답변 완료 |

---

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| Production/index.html | 알림 UI 추가 |
| Production/admin-dashboard.html | 알림 생성 로직 |
| Production/Frontend/Pages/mypage/inquiries.html | 문의 관리 UI |
| Production/Frontend/inquiries.css | 스타일시트 |
| Production/Frontend/inquiries.js | JavaScript |

## Task Agent
- **Task Agent**: frontend-developer
- **Verification Agent**: code-reviewer

---

## 수정 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2025-12-22 | 인앱 알림 UI 구현 |
| 2025-12-23 | My Page 문의 관리 페이지 추가 |

---

## 필수 참조 규칙

| 규칙 파일 | 내용 |
|----------|------|
| .claude/rules/02_save-location.md | 저장 위치 규칙 |
| .claude/rules/05_execution-process.md | 6단계 실행 프로세스 |
