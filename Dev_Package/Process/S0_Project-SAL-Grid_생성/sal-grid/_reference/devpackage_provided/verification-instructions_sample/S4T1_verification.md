# Verification Instruction - S4T1

---

## Task ID
S4T1

## Task Name
E2E 테스트

## Verification Agent
qa-specialist

## Verification Criteria

### 1. 테스트 파일 존재 확인
- [ ] tests/e2e/auth-flow.spec.js 존재
- [ ] tests/e2e/subscription-flow.spec.js 존재
- [ ] tests/e2e/ai-usage-flow.spec.js 존재
- [ ] tests/e2e/full-journey.spec.js 존재

### 2. 인증 플로우 테스트 검증
- [ ] 회원가입 테스트
- [ ] 로그인 테스트
- [ ] 로그아웃 테스트
- [ ] 비밀번호 재설정 테스트

### 3. 구독 플로우 테스트 검증
- [ ] 구독 플랜 선택 테스트
- [ ] 결제 페이지 이동 테스트
- [ ] 결제 완료 후 상태 변경 테스트

### 4. AI 사용 플로우 테스트 검증
- [ ] AI Q&A 페이지 접근 테스트
- [ ] AI 서비스 선택 테스트
- [ ] 질문 입력 및 답변 수신 테스트
- [ ] 크레딧 차감 확인 테스트

### 5. 전체 여정 테스트 검증
- [ ] 회원가입 → 로그인 → 구독 → AI 사용 전체 플로우

### 6. Playwright 설정 검증
- [ ] playwright.config.js 설정 완료
- [ ] 브라우저 설정 (chromium, firefox, webkit)
- [ ] 스크린샷/비디오 설정

## Test Commands
```bash
# E2E 테스트 실행
npx playwright test

# 특정 테스트 실행
npx playwright test auth-flow.spec.js

# UI 모드로 실행
npx playwright test --ui

# 테스트 리포트 생성
npx playwright show-report
```

## Build Verification
- [ ] Playwright 설치 완료
- [ ] 테스트 파일 문법 오류 없음
- [ ] 환경 설정 정상

## Integration Verification
- [ ] S4F1 관리자 대시보드 테스트 포함
- [ ] S2BA1 OAuth 테스트 포함
- [ ] S3F1 AI Q&A 테스트 포함

## Expected Files
- S4_개발-3차/Testing/e2e/*.spec.js
- S4_개발-3차/Testing/playwright.config.js

## Pass Criteria
- 모든 E2E 테스트 통과
- 크로스 브라우저 테스트 통과
- 전체 사용자 여정 검증 완료

---

## 저장 위치 검증 항목
- [ ] S4_개발-3차/Testing/ 폴더에 저장되었는가?
