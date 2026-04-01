# Verification Instruction - S4TS1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S4TS1

## Task Name
E2E 테스트 (Playwright)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S4_개발_마무리/Testing/playwright.config.ts` 존재
- [ ] `Process/S4_개발_마무리/Testing/tests/e2e/auth.spec.ts` 존재
- [ ] `Process/S4_개발_마무리/Testing/tests/e2e/create-bot.spec.ts` 존재
- [ ] `Process/S4_개발_마무리/Testing/tests/e2e/chat.spec.ts` 존재

### 2. 설정 파일 검증 (`playwright.config.ts`)
- [ ] 3개 브라우저 프로젝트 설정 (Chromium, Firefox, Safari/WebKit)
- [ ] `testDir: 'tests/e2e'` 설정
- [ ] Base URL 설정 (`TEST_BASE_URL` 환경 변수 또는 `http://localhost:3000`)
- [ ] 실패 시 스크린샷 자동 캡처 설정 (`screenshot: 'on'` 또는 `'only-on-failure'`)
- [ ] HTML 리포터 설정

### 3. 인증 테스트 검증 (`auth.spec.ts`)
- [ ] 로그인 성공 테스트 케이스 존재
- [ ] 잘못된 비밀번호 에러 표시 테스트 케이스 존재
- [ ] 로그인 후 리다이렉트 확인 테스트 케이스 존재
- [ ] 로그아웃 후 보호 경로 리다이렉트 테스트 케이스 존재

### 4. 봇 생성 테스트 검증 (`create-bot.spec.ts`)
- [ ] 페르소나 생성 플로우 테스트 케이스 존재
- [ ] 필수 입력값 미입력 에러 테스트 케이스 존재
- [ ] 생성 후 목록 확인 테스트 케이스 존재

### 5. 대화 테스트 검증 (`chat.spec.ts`)
- [ ] 대화 시작 테스트 케이스 존재
- [ ] AI 응답 대기 (타임아웃 15초 이상) 설정
- [ ] 대화 이력 유지 테스트 케이스 존재

### 6. 통합 검증
- [ ] 테스트 계정 정보가 환경 변수로 관리됨 (하드코딩 자격증명 없음)
- [ ] S4FE1, S4FE2, S4FE3 의존 페이지들이 스모크 테스트에 포함됨

## Test Commands
```bash
# Playwright 설치 확인
npx playwright --version

# 설정 파일 검증
npx playwright test --list --config="Process/S4_개발_마무리/Testing/playwright.config.ts"

# 테스트 케이스 수 확인
grep -c "test(" "Process/S4_개발_마무리/Testing/tests/e2e/auth.spec.ts"

# 하드코딩 자격증명 없음 확인
grep -n "password.*=.*['\"]" "Process/S4_개발_마무리/Testing/tests/e2e/auth.spec.ts"
```

## Expected Results
- `playwright.config.ts` 가 문법 오류 없이 로드된다
- `--list` 명령으로 10개 이상의 테스트 케이스가 열거된다
- 자격증명이 환경 변수로 참조된다 (`process.env.TEST_USER_...`)
- 3개 브라우저 프로젝트가 설정되어 있다

## Verification Agent
qa-specialist

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 설정 파일 문법 오류 없음
- [ ] 10개 이상 테스트 케이스 구현
- [ ] 하드코딩 자격증명 없음
- [ ] Blocker 없음

---

## ⚠️ 저장 위치 검증 항목
- [ ] 코드가 `S4_개발_마무리/Testing/`에 저장되었는가?
- [ ] Testing Area는 Production 자동 복사 대상이 아님을 확인
