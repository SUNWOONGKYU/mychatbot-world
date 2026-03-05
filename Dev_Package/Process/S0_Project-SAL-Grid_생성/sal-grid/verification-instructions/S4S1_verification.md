# S4S1 검증 지시서

## 검증 대상
- **Task ID**: S4S1
- **Task 이름**: 어드민 권한 체계 + 감사 로그
- **Verification Agent**: security-specialist-core

## 검증 체크리스트

### 1. 파일 존재 확인
- [ ] 생성 대상 파일이 모두 존재하는가
- [ ] 파일명이 kebab-case 규칙을 따르는가
- [ ] @task S4S1 주석이 파일 최상단에 있는가

### 2. 코드 품질
- [ ] 하드코딩된 API 키/비밀번호 없음
- [ ] 오류 처리(try-catch) 포함
- [ ] 환경 변수를 올바르게 참조

### 3. 기능 검증
- [ ] role ENUM(user/moderator/admin) 정상
- [ ] RLS 정책 테스트 (admin만 관리 테이블 접근)
- [ ] 감사 로그 트리거 정상 작동
- [ ] admin_audit_logs 자동 기록 확인

### 4. 통합 검증
- [ ] 선행 Task 결과물과 호환
- [ ] 다른 Task와 데이터 충돌 없음
