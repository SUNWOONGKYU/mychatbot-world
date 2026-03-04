# Task Instruction - S4T1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S4T1

## Task Name
E2E 테스트

## Task Goal
주요 사용자 시나리오 End-to-End 테스트 (회원가입 → 구독 → 결제 → AI 사용)

## Prerequisites (Dependencies)
- S4F1 (관리자 대시보드) 완료

## Specific Instructions

### 1. Playwright 설정
- 위치: `playwright.config.js`

```javascript
// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 2,
  workers: 1, // 순차 실행 (E2E는 상태 의존)
  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } }
  ]
});
```

### 2. 회원가입 → 로그인 E2E 테스트
- 위치: `tests/e2e/auth-flow.spec.js`

```javascript
// tests/e2e/auth-flow.spec.js
const { test, expect } = require('@playwright/test');

test.describe('회원가입 및 로그인 플로우', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Test1234!@#';

  test('회원가입 성공', async ({ page }) => {
    await page.goto('/pages/auth/signup.html');

    // 이메일 입력
    await page.fill('#email', testEmail);

    // 비밀번호 입력
    await page.fill('#password', testPassword);
    await page.fill('#passwordConfirm', testPassword);

    // 약관 동의
    await page.check('#termsAgree');
    await page.check('#privacyAgree');

    // 회원가입 버튼 클릭
    await page.click('#signupButton');

    // 성공 페이지 또는 대시보드로 이동
    await expect(page).toHaveURL(/dashboard|verify/);
  });

  test('로그인 성공', async ({ page }) => {
    await page.goto('/pages/auth/login.html');

    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.click('#loginButton');

    // 대시보드로 이동 확인
    await page.waitForURL('**/dashboard**');
    await expect(page.locator('.user-profile')).toBeVisible();
  });

  test('Google 소셜 로그인 버튼 존재', async ({ page }) => {
    await page.goto('/pages/auth/login.html');
    await expect(page.locator('#googleLoginBtn')).toBeVisible();
  });
});
```

### 3. 구독 → 결제 E2E 테스트
- 위치: `tests/e2e/subscription-flow.spec.js`

```javascript
// tests/e2e/subscription-flow.spec.js
const { test, expect } = require('@playwright/test');

test.describe('구독 및 결제 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 사용자 로그인
    await page.goto('/pages/auth/login.html');
    await page.fill('#email', 'e2e-test@example.com');
    await page.fill('#password', 'E2ETest123!');
    await page.click('#loginButton');
    await page.waitForURL('**/dashboard**');
  });

  test('플랜 선택 페이지 표시', async ({ page }) => {
    await page.goto('/pages/subscription/pricing.html');

    // 플랜 카드 존재 확인
    await expect(page.locator('[data-plan="basic"]')).toBeVisible();
    await expect(page.locator('[data-plan="premium"]')).toBeVisible();

    // 가격 표시 확인
    await expect(page.locator('.plan-price')).toHaveCount(2);
  });

  test('Premium 플랜 선택 → 결제 페이지 이동', async ({ page }) => {
    await page.goto('/pages/subscription/pricing.html');

    // Premium 플랜 선택
    await page.click('[data-plan="premium"]');

    // 결제 페이지로 이동
    await page.waitForURL('**/payment.html**');

    // 플랜 정보 표시 확인
    await expect(page.locator('#planName')).toContainText('Premium');
    await expect(page.locator('#planPrice')).toContainText('29,900');
  });

  test('토스 결제 위젯 로드', async ({ page }) => {
    await page.goto('/pages/subscription/payment.html?plan=premium&amount=29900');

    // 결제 위젯 로드 대기
    await expect(page.locator('#payment-widget')).toBeVisible();
    await expect(page.locator('#agreement-widget')).toBeVisible();
  });

  test('결제 성공 페이지 표시', async ({ page }) => {
    // 결제 성공 시뮬레이션
    await page.goto('/pages/subscription/payment-success.html?paymentKey=test&orderId=test&amount=29900');

    await expect(page.locator('h1')).toContainText('완료');
    await expect(page.locator('.success-icon')).toBeVisible();
  });

  test('결제 실패 페이지 표시', async ({ page }) => {
    await page.goto('/pages/subscription/payment-fail.html?code=USER_CANCEL&message=취소');

    await expect(page.locator('h1')).toContainText('실패');
    await expect(page.locator('#errorCode')).toContainText('USER_CANCEL');
  });
});
```

### 4. AI 사용 E2E 테스트
- 위치: `tests/e2e/ai-usage-flow.spec.js`

```javascript
// tests/e2e/ai-usage-flow.spec.js
const { test, expect } = require('@playwright/test');

test.describe('AI 서비스 사용 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // Premium 사용자로 로그인
    await page.goto('/pages/auth/login.html');
    await page.fill('#email', 'premium-test@example.com');
    await page.fill('#password', 'PremiumTest123!');
    await page.click('#loginButton');
    await page.waitForURL('**/dashboard**');
  });

  test('AI Q&A 페이지 접근', async ({ page }) => {
    await page.goto('/pages/ai/qa.html');

    // AI 선택 드롭다운 존재
    await expect(page.locator('#aiProvider')).toBeVisible();

    // 질문 입력창 존재
    await expect(page.locator('#questionInput')).toBeVisible();

    // 전송 버튼 존재
    await expect(page.locator('#submitQuestion')).toBeVisible();
  });

  test('AI 프로바이더 선택', async ({ page }) => {
    await page.goto('/pages/ai/qa.html');

    // Gemini 선택
    await page.selectOption('#aiProvider', 'gemini');
    await expect(page.locator('#aiProvider')).toHaveValue('gemini');

    // ChatGPT 선택
    await page.selectOption('#aiProvider', 'chatgpt');
    await expect(page.locator('#aiProvider')).toHaveValue('chatgpt');

    // Perplexity 선택
    await page.selectOption('#aiProvider', 'perplexity');
    await expect(page.locator('#aiProvider')).toHaveValue('perplexity');
  });

  test('크레딧 잔액 표시', async ({ page }) => {
    await page.goto('/pages/ai/qa.html');
    await expect(page.locator('#creditBalance')).toBeVisible();
  });
});
```

### 5. 전체 유저 저니 E2E 테스트
- 위치: `tests/e2e/full-journey.spec.js`

```javascript
// tests/e2e/full-journey.spec.js
const { test, expect } = require('@playwright/test');

test.describe('전체 사용자 여정', () => {
  test('신규 사용자: 가입 → 플랜 선택 → 대시보드', async ({ page }) => {
    const uniqueEmail = `journey_${Date.now()}@test.com`;

    // 1. 랜딩 페이지
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();

    // 2. 회원가입 페이지로 이동
    await page.click('a[href*="signup"]');
    await page.waitForURL('**/signup**');

    // 3. 회원가입
    await page.fill('#email', uniqueEmail);
    await page.fill('#password', 'Journey123!@#');
    await page.fill('#passwordConfirm', 'Journey123!@#');
    await page.check('#termsAgree');
    await page.check('#privacyAgree');
    await page.click('#signupButton');

    // 4. 대시보드 또는 플랜 선택 페이지
    await page.waitForURL(/dashboard|pricing/);
  });
});
```

### 6. 테스트 데이터 시딩
- 위치: `tests/e2e/fixtures/seed-data.js`

```javascript
// tests/e2e/fixtures/seed-data.js
const testUsers = {
  freeUser: {
    email: 'e2e-free@example.com',
    password: 'FreeUser123!',
    subscription: 'free'
  },
  premiumUser: {
    email: 'e2e-premium@example.com',
    password: 'PremiumUser123!',
    subscription: 'premium'
  },
  adminUser: {
    email: 'e2e-admin@example.com',
    password: 'AdminUser123!',
    role: 'admin'
  }
};

module.exports = { testUsers };
```

### 7. package.json 스크립트
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Expected Output Files
- `playwright.config.js`
- `tests/e2e/auth-flow.spec.js`
- `tests/e2e/subscription-flow.spec.js`
- `tests/e2e/ai-usage-flow.spec.js`
- `tests/e2e/full-journey.spec.js`
- `tests/e2e/fixtures/seed-data.js`

## Completion Criteria
- [ ] Playwright 설정 완료
- [ ] 회원가입/로그인 E2E 테스트
- [ ] 구독/결제 플로우 E2E 테스트
- [ ] AI 사용 플로우 E2E 테스트
- [ ] 전체 사용자 여정 테스트
- [ ] 모든 테스트 통과
- [ ] CI/CD 통합 준비

## Tech Stack
- Playwright
- Node.js

## Task Agent
`test-engineer`

## Verification Agent
`qa-specialist`

## Tools
- Write, Read
- Bash (npx playwright test)

## Execution Type
AI-Only

## Remarks
- E2E 테스트는 실제 환경과 유사하게 실행
- 테스트 사용자 사전 생성 필요
- 결제 테스트는 토스 샌드박스 환경 사용
- 실패 시 스크린샷/비디오 자동 저장

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S4T1 → `S4_개발-3차/Testing/`

### 제2 규칙: Production 코드는 이중 저장
- 테스트 코드는 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
