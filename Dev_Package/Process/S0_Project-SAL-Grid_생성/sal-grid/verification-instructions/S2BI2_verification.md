# S2BI2 검증 지시서

## 검증 대상
- **Task ID**: S2BI2
- **Task 이름**: API 미배포 파일 Root 동기화
- **Verification Agent**: code-reviewer-core

## 검증 체크리스트

### 1. 파일 존재 확인
- [ ] 생성 대상 파일이 모두 존재하는가
- [ ] 파일명이 kebab-case 규칙을 따르는가
- [ ] @task S2BI2 주석이 파일 최상단에 있는가

### 2. 코드 품질
- [ ] 하드코딩된 API 키/비밀번호 없음
- [ ] 오류 처리(try-catch) 포함
- [ ] 환경 변수를 올바르게 참조

### 3. 기능 검증
- [ ] Stage 폴더의 API 파일이 Root api/에 모두 복사되었는가
- [ ] 복사된 파일의 내용이 Stage 원본과 동일한가
- [ ] Vercel 배포 시 API 엔드포인트 정상 응답

### 4. 통합 검증
- [ ] 선행 Task 결과물과 호환
- [ ] 다른 Task와 데이터 충돌 없음
