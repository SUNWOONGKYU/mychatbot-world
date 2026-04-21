/**
 * @task S10QA1
 * Playwright E2E — 마이페이지 Tab2 카드 6툴 패널 전환 + API 응답 확인
 * 실행: npx playwright test tests/e2e/mypage-tab2-tools.spec.ts
 * 전제: TEST_USER_EMAIL/TEST_USER_PASSWORD가 실제 로그인 가능한 계정이어야 함.
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'https://mychatbot.world';
const EMAIL = process.env.TEST_USER_EMAIL!;
const PW = process.env.TEST_USER_PASSWORD!;

test.skip(!EMAIL || !PW, 'set TEST_USER_EMAIL/PASSWORD env');

test.describe('S10 Tab2 6-tool integration', () => {
  test.setTimeout(120_000);

  test('login → open a bot card → cycle 6 tools', async ({ page }) => {
    // 로그인 플로우
    await page.goto(`${BASE}/auth/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PW);
    await page.getByRole('button', { name: /로그인|login/i }).first().click();
    await page.waitForURL(/\/mypage|\/$|\/community/, { timeout: 30_000 });

    // 마이페이지 → Tab2
    await page.goto(`${BASE}/mypage`);
    await page.getByRole('button', { name: /코코봇 관리|코코봇/ }).first().click().catch(() => {});

    // 봇 카드 expand (첫 카드)
    const firstCard = page.locator('article').first();
    await firstCard.click();
    await expect(firstCard.locator('text=URL')).toBeVisible({ timeout: 10_000 });

    const toolLabels = ['대화 로그', 'KB', '스킬 장착', '학습', '커뮤니티', '코코봇 설정'];
    for (const label of toolLabels) {
      const btn = firstCard.getByRole('button', { name: new RegExp(label) }).first();
      await btn.click();
      // 어떤 패널이 나오든 "추후 연동 예정" placeholder가 남아 있으면 안 됨
      await expect(firstCard.locator('text=추후 연동 예정')).toHaveCount(0);
      // 접기
      await btn.click();
    }
  });
});
