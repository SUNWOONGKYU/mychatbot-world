# S5T2: Happy Path E2E 테스트 작성

## Task 정보
- **Task ID**: S5T2
- **Task Name**: Happy Path E2E 테스트 작성
- **Stage**: S5 (품질 개선)
- **Area**: T (Testing)
- **Dependencies**: S5T1

## Task 목표

핵심 사용자 플로우(Happy Path)에 대한 E2E 테스트를 작성한다. 배포 전 주요 기능이 정상 동작하는지 자동으로 검증한다.

## 구현 범위

### 테스트 시나리오 1: 인증 플로우
```typescript
// tests/e2e/auth.spec.ts
test('회원가입 → 로그인 → 로그아웃', async ({ page }) => {
  // 회원가입
  await page.goto('/signup');
  await page.fill('[name=email]', testEmail);
  await page.fill('[name=password]', testPassword);
  await page.click('[type=submit]');

  // 이메일 인증 (테스트 환경에서는 건너뜀)

  // 로그인
  await page.goto('/login');
  await page.fill('[name=email]', testEmail);
  await page.fill('[name=password]', testPassword);
  await page.click('[type=submit]');
  await expect(page).toHaveURL('/dashboard');

  // 로그아웃
  await page.click('[data-testid=logout]');
  await expect(page).toHaveURL('/');
});
```

### 테스트 시나리오 2: 챗봇 생성 플로우
```typescript
// tests/e2e/chatbot.spec.ts
test('챗봇 생성 → 대화', async ({ page }) => {
  await loginAs(page, testUser);
  await page.goto('/birth');

  // 챗봇 생성 폼 작성
  await page.fill('[name=name]', '테스트 챗봇');
  await page.click('[data-testid=create-chatbot]');

  // 대화 시작
  await page.goto('/chat');
  await page.fill('[data-testid=chat-input]', '안녕하세요');
  await page.press('[data-testid=chat-input]', 'Enter');

  // 응답 대기
  await expect(page.locator('[data-testid=ai-response]')).toBeVisible({ timeout: 30000 });
});
```

### 테스트 픽스처
```typescript
// tests/e2e/fixtures/auth.ts
export async function loginAs(page: Page, user: TestUser) {
  // 테스트 로그인 헬퍼
}
```

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `tests/e2e/auth.spec.ts` | 인증 플로우 E2E 테스트 |
| `tests/e2e/chatbot.spec.ts` | 챗봇 생성/대화 E2E 테스트 |
| `tests/e2e/fixtures/auth.ts` | 인증 픽스처 |

## 완료 기준

- [ ] 인증 플로우 테스트 통과
- [ ] 챗봇 생성 플로우 테스트 통과
- [ ] CI에서 자동 실행
