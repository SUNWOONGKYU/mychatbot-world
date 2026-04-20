# S5T1 검증 지침: E2E 테스트 환경 구축 (Playwright)

## 검증 에이전트
`qa-specialist`

## 검증 항목

### 1. 설치 확인
- [ ] `package.json`에 `@playwright/test` 의존성 존재
- [ ] `playwright.config.ts` 파일 존재

### 2. 설정 완성도
- [ ] `testDir` 설정 (tests/e2e 등)
- [ ] `baseURL` 설정 (환경변수 또는 localhost)
- [ ] 최소 1개 브라우저 프로젝트 설정

### 3. 스크립트 확인
- [ ] `package.json`에 `test:e2e` 스크립트 존재
- [ ] `npx playwright test` 실행 가능

### 4. CI 통합
- [ ] `.github/workflows/` 또는 동등 경로에 E2E 워크플로우 파일 존재

### 5. 샘플 테스트
- [ ] `tests/e2e/` 디렉토리에 최소 1개 테스트 파일 존재
- [ ] 샘플 테스트 실행 성공 (또는 환경 제약 명시)

## 합격 기준
위 모든 항목 Pass 시 Verified 처리
