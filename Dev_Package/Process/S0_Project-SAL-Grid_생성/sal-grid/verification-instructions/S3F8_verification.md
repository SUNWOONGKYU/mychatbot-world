# S3F8 검증 지시서

## 검증 대상
- **Task ID**: S3F8
- **Task 이름**: Learning(학습) 전용 페이지
- **Verification Agent**: code-reviewer-core

## 검증 체크리스트

### 1. 파일 존재 확인
- [ ] 생성 대상 파일이 모두 존재하는가
- [ ] 파일명이 kebab-case 규칙을 따르는가
- [ ] @task S3F8 주석이 파일 최상단에 있는가

### 2. 코드 품질
- [ ] 하드코딩된 API 키/비밀번호 없음
- [ ] 오류 처리(try-catch) 포함
- [ ] 환경 변수를 올바르게 참조

### 3. 기능 검증
- [ ] 학습 페이지 정상 로드, 커리큘럼 목록 표시
- [ ] school-session.js API 연동 정상
- [ ] 학습 진행 상태 UI 정상 표시

### 4. 통합 검증
- [ ] 선행 Task 결과물과 호환
- [ ] 다른 Task와 데이터 충돌 없음
