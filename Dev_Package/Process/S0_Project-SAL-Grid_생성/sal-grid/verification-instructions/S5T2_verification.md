# S5T2 검증 지침: Happy Path E2E 테스트 작성

## 검증 에이전트
`qa-specialist`

## 검증 항목

### 1. 테스트 파일 존재
- [ ] `tests/e2e/auth.spec.ts` 또는 동등 파일 존재
- [ ] `tests/e2e/chatbot.spec.ts` 또는 동등 파일 존재

### 2. 테스트 시나리오 커버리지
- [ ] 로그인 플로우 테스트 포함
- [ ] 챗봇 생성 플로우 테스트 포함

### 3. 테스트 실행 가능성
- [ ] `npx playwright test` 실행 시 테스트 인식됨
- [ ] 테스트 환경(테스트 계정, 환경변수) 설정 방법 문서화

### 4. CI 연동
- [ ] GitHub Actions에서 자동 실행되도록 설정

## 합격 기준
위 모든 항목 Pass 시 Verified 처리
