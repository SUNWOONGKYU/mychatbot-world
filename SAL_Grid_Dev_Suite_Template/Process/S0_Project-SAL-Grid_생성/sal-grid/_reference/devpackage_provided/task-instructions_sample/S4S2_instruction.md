# S4S2: Viewer 접근 보안 구현

## Task 정보
- **Task ID**: S4S2
- **Task Name**: Viewer 접근 보안 구현
- **Stage**: S4 (개발 3차)
- **Area**: S (Security)
- **Dependencies**: S4F8, S2S1
- **Task Agent**: security-specialist
- **Verification Agent**: security-auditor

## Task 목표

SAL Grid Viewer에 대한 접근 보안을 구현하여, 로그인 사용자만 자신의 프로젝트 데이터를 볼 수 있도록 합니다.

## 구현 내용

### 1. 접근 제어 정책
| 사용자 유형 | 접근 가능 데이터 |
|------------|----------------|
| 비로그인 | SSAL Works 예시 프로젝트만 |
| 로그인 (일반) | 자신의 프로젝트만 |
| 로그인 (관리자) | 모든 프로젝트 |

### 2. RLS (Row Level Security) 정책
- `projects` 테이블에 user_id 기반 RLS 적용
- `project_sal_grid` 테이블에 project_id 기반 RLS 적용

### 3. 프론트엔드 보안
- JWT 토큰 기반 인증 확인
- 비로그인 시 "진행중인 프로젝트" 버튼 숨김
- 로그인 시 사용자 project_name 표시

### 4. API 보안
- Viewer API에 인증 미들웨어 적용
- 프로젝트 소유권 검증

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `Production/index.html` | 로그인 상태별 버튼 표시 로직 |
| `S4_개발-3차/Database/rls_viewer_policy.sql` | RLS 정책 SQL |
| `Production/api/Backend_APIs/viewer/auth.js` | Viewer 인증 API |

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/CAUTION.md` | RLS 정책 주의사항 | 보안 구현 시 |
