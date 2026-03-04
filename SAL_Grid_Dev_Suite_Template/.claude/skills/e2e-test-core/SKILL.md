# /e2e-test-core

> **SAL Grid Dev Suite** — Playwright 기반 End-to-End 테스트 작성 및 실행 스킬
>
> **사용 시점**: 주요 사용자 플로우 구현 후, 배포 전 회귀 테스트, 크로스 브라우저 호환성 검증이 필요할 때
> **적용 대상**: Vanilla 및 React/Next.js 모두 적용 가능

---

## 원칙 요약

- **허용**: Playwright CLI 실행, 스크린샷/비디오 자동 캡처, 결과 파일 저장
- **금지**: 브라우저 수동 테스트, GUI 도구 수동 사용, 사용자에게 수동 시나리오 요청
- **역할**: 사용자 플로우 검증 · 크로스 브라우저(Chrome/Firefox/Safari) · 시각적 회귀 · 접근성 · 모바일

---

## Playwright 설정

### 초기 설정
```bash
# 프로젝트 루트에서 실행
# Playwright 설치
npm install -D @playwright/test
npx playwright install

# 설정 파일 생성 (이미 있다면 스킵)
npx playwright init
```

### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Vanilla 프로젝트의 경우**: `webServer.command`를 로컬 서버 실행 명령으로 교체
```typescript
webServer: {
  command: 'npx serve .',  // 또는 'python -m http.server 3000'
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
},
```

---

## E2E 테스트 실행

### 기본 명령어
```bash
# 모든 테스트 실행
npx playwright test

# 특정 파일만
npx playwright test auth.spec.ts

# 특정 브라우저만
npx playwright test --project=chromium

# 헤드리스 모드 비활성화 (브라우저 보이기)
npx playwright test --headed

# UI 모드 (인터랙티브)
npx playwright test --ui

# 디버그 모드
npx playwright test --debug
```

### 테스트 결과 확인
```bash
# HTML 리포트 열기
npx playwright show-report

# 특정 테스트 재실행
npx playwright test --grep "user login"
```

---

## 핵심 사용자 플로우 테스트

### 1. 인증 플로우

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should sign up new user', async ({ page }) => {
    // 1. 회원가입 페이지로 이동
    // Vanilla: await page.goto('/pages/auth/signup.html');
    // React: await page.getByRole('link', { name: '회원가입' }).click();
    await page.getByRole('link', { name: '회원가입' }).click();

    // 2. 폼 작성
    await page.getByLabel('이메일').fill('test@example.com');
    await page.getByLabel('비밀번호').fill('SecurePass123!');
    await page.getByLabel('비밀번호 확인').fill('SecurePass123!');

    // 3. 제출
    await page.getByRole('button', { name: '가입하기' }).click();

    // 4. 성공 확인
    await expect(page.getByText('가입이 완료되었습니다')).toBeVisible();
  });

  test('should login existing user', async ({ page }) => {
    // 1. 로그인 페이지
    await page.getByRole('link', { name: '로그인' }).click();

    // 2. 자격 증명 입력
    await page.getByLabel('이메일').fill('existing@example.com');
    await page.getByLabel('비밀번호').fill('password123');

    // 3. 로그인
    await page.getByRole('button', { name: '로그인' }).click();

    // 4. 리다이렉션 확인
    await expect(page.getByText('환영합니다')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('이메일').fill('wrong@example.com');
    await page.getByLabel('비밀번호').fill('wrongpassword');
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page.getByText('이메일 또는 비밀번호가 올바르지 않습니다')).toBeVisible();
  });

  test('should logout user', async ({ page }) => {
    await page.goto('/');

    // 로그아웃
    await page.getByRole('button', { name: '프로필' }).click();
    await page.getByRole('menuitem', { name: '로그아웃' }).click();

    // 로그아웃 확인
    await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
  });
});
```

---

### 2. 주요 데이터 조회 및 필터링

```typescript
// tests/e2e/item-search.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Item Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should search item by name', async ({ page }) => {
    // 검색창에 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('검색어');

    // 결과 대기
    await page.waitForResponse(resp => resp.url().includes('/api/search'));

    // 결과 확인
    await expect(page.getByTestId('item-card')).toHaveCount(1);
  });

  test('should filter by category', async ({ page }) => {
    // 카테고리 필터 선택
    await page.getByRole('combobox', { name: '카테고리' }).selectOption('category_a');

    // API 요청 대기
    await page.waitForResponse(resp => resp.url().includes('category='));

    // 결과 확인
    const cards = page.getByTestId('item-card');
    await expect(cards.first()).toBeVisible();
  });

  test('should show no results message', async ({ page }) => {
    await page.getByPlaceholder('검색어를 입력하세요').fill('존재하지않는항목xyz123');
    await page.keyboard.press('Enter');

    await expect(page.getByText('검색 결과가 없습니다')).toBeVisible();
  });
});
```

---

### 3. 데이터 작성/수정/삭제 플로우

```typescript
// tests/e2e/crud.spec.ts
import { test, expect } from '@playwright/test';

test.describe('CRUD Flow', () => {
  test.use({ storageState: 'tests/e2e/.auth/user.json' }); // 로그인 상태

  test('should create new item', async ({ page }) => {
    // 1. 작성 페이지로 이동
    await page.getByRole('button', { name: '새로 만들기' }).click();

    // 2. 폼 작성
    await page.getByLabel('제목').fill('테스트 제목');
    await page.getByLabel('내용').fill('테스트 내용입니다. 충분히 길게 입력해야 합니다.');

    // 3. 제출
    await page.getByRole('button', { name: '저장' }).click();

    // 4. 성공 메시지 확인
    await expect(page.getByText('저장되었습니다')).toBeVisible();
  });

  test('should validate form fields', async ({ page }) => {
    await page.getByRole('button', { name: '새로 만들기' }).click();

    // 빈 폼 제출
    await page.getByRole('button', { name: '저장' }).click();

    // 검증 에러 메시지
    await expect(page.getByText('제목을 입력해주세요')).toBeVisible();
  });

  test('should edit existing item', async ({ page }) => {
    await page.goto('/my/items');

    // 첫 번째 항목 수정
    await page.getByTestId('item-card').first().getByRole('button', { name: '수정' }).click();

    // 내용 수정
    await page.getByLabel('내용').clear();
    await page.getByLabel('내용').fill('수정된 내용입니다.');

    await page.getByRole('button', { name: '수정 완료' }).click();

    // 수정 확인
    await expect(page.getByText('수정되었습니다')).toBeVisible();
  });

  test('should delete item', async ({ page }) => {
    await page.goto('/my/items');

    // 삭제 버튼 클릭
    await page.getByTestId('item-card').first().getByRole('button', { name: '삭제' }).click();

    // 확인 다이얼로그
    page.on('dialog', dialog => dialog.accept());
    await expect(page.getByText('삭제되었습니다')).toBeVisible();
  });
});
```

---

### 4. 페이지네이션 및 무한 스크롤

```typescript
// tests/e2e/pagination.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Pagination', () => {
  test('should navigate through pages', async ({ page }) => {
    await page.goto('/items');

    // 첫 페이지 확인
    await expect(page.getByText('페이지 1')).toBeVisible();

    // 다음 페이지로
    await page.getByRole('button', { name: '다음' }).click();
    await page.waitForURL('**/items?page=2');

    // 이전 페이지로
    await page.getByRole('button', { name: '이전' }).click();
    await page.waitForURL('**/items?page=1');
  });

  test('should load more on infinite scroll', async ({ page }) => {
    await page.goto('/items');

    // 초기 카드 수
    const initialCount = await page.getByTestId('item-card').count();

    // 스크롤 다운
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // 로딩 인디케이터 확인
    await expect(page.getByText('로딩 중...')).toBeVisible();

    // 추가 카드 로드 대기
    await expect(page.getByTestId('item-card')).toHaveCount(initialCount * 2);
  });
});
```

---

## 테스트 데이터 관리

### Fixtures 사용

```typescript
// tests/e2e/fixtures/auth.fixture.ts
import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // 로그인 수행
    await page.goto('/');
    await page.getByLabel('이메일').fill('test@example.com');
    await page.getByLabel('비밀번호').fill('password123');
    await page.getByRole('button', { name: '로그인' }).click();
    await page.waitForURL('/');

    await use(page);

    // 로그아웃 (정리)
    await page.getByRole('button', { name: '로그아웃' }).click();
  },
});
```

### 테스트 데이터 시드

```typescript
// tests/e2e/setup/seed.ts
import { createClient } from '@supabase/supabase-js';

export async function seedTestData() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // 관리자 키
  );

  // 테스트 데이터 생성
  const { data: item } = await supabase
    .from('items')           // 실제 테이블명으로 교체
    .insert({
      name: '테스트항목',
      category: '테스트',
      user_id: 'test-user-id',
    })
    .select()
    .single();

  return { item };
}

export async function cleanupTestData() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // 테스트 데이터 삭제
  await supabase.from('items').delete().eq('category', '테스트');
}
```

### Global Setup/Teardown

```typescript
// tests/e2e/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';
import { seedTestData } from './setup/seed';

async function globalSetup(config: FullConfig) {
  console.log('Seeding test data...');
  await seedTestData();

  console.log('Authenticating test user...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/');
  await page.getByLabel('이메일').fill('test@example.com');
  await page.getByLabel('비밀번호').fill('password123');
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL('http://localhost:3000/');

  // 인증 상태 저장
  await page.context().storageState({ path: 'tests/e2e/.auth/user.json' });
  await browser.close();

  console.log('Global setup complete');
}

export default globalSetup;
```

```typescript
// tests/e2e/global-teardown.ts
import { cleanupTestData } from './setup/seed';

async function globalTeardown() {
  console.log('Cleaning up test data...');
  await cleanupTestData();
  console.log('Global teardown complete');
}

export default globalTeardown;
```

---

## 시각적 회귀 테스트

```typescript
// tests/e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('item card should match snapshot', async ({ page }) => {
    await page.goto('/items');

    const card = page.getByTestId('item-card').first();
    await expect(card).toHaveScreenshot('item-card.png');
  });

  test('homepage should match snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
    });
  });

  test('should detect layout shifts', async ({ page }) => {
    await page.goto('/items');

    // CLS 측정
    const cls = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        let clsValue = 0;
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift') {
              clsValue += (entry as any).value;
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 3000);
      });
    });

    expect(cls).toBeLessThan(0.1);
  });
});
```

---

## 접근성 테스트

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Tab으로 네비게이션
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '홈' })).toBeFocused();

    // Enter로 링크 클릭
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
  });
});
```

---

## 모바일 테스트

```typescript
// tests/e2e/mobile.spec.ts
import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Experience', () => {
  test.use({ ...devices['iPhone 12'] });

  test('should show mobile menu', async ({ page }) => {
    await page.goto('/');

    // 햄버거 메뉴 클릭
    await page.getByRole('button', { name: '메뉴' }).click();

    // 모바일 메뉴 확인
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should be usable on small screen', async ({ page }) => {
    await page.goto('/items');

    // 주요 콘텐츠가 보이는지 확인
    await expect(page.getByTestId('item-card').first()).toBeVisible();
  });
});
```

---

## E2E 테스트 보고서 템플릿

```markdown
# E2E 테스트 보고서

**실행 날짜**: [YYYY-MM-DD HH:mm:ss]
**실행자**: Claude Code
**브라우저**: Chromium, Firefox, WebKit

---

## 요약

### 전체 결과
- 통과: N개
- 실패: N개
- 건너뜀: N개
- **통과율**: X%

### 브라우저별 결과
- Chromium: N/N (X%)
- Firefox: N/N (X%)
- WebKit: N/N (X%)

---

## 실패 테스트

### 1. [테스트명] ([브라우저])

**브라우저**: WebKit (Safari)
**파일**: `tests/e2e/[파일].spec.ts:25`

**에러**:
```
TimeoutError: locator.click: Timeout 30000ms exceeded.
```

**스크린샷**: `test-results/[파일명]-webkit-failure.png`

**재현 단계**:
1. [브라우저]에서 [URL] 방문
2. [버튼] 클릭
3. [동작] 시도 시 타임아웃 발생

**원인**: [추정 원인]

**수정 방안**: [수정 방법]

---

## 다음 단계

1. 실패 테스트 수정
2. 추가 테스트 케이스 작성
3. 성능 메트릭 측정 추가
```

---

**이 스킬을 활성화하면, 실제 사용자 관점에서 이 프로젝트의 모든 기능을 자동으로 검증하여 품질을 보장합니다.**
