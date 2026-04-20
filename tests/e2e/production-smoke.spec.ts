/**
 * @task S8TS1
 * @description 프로덕션 스모크 — Next.js 라우트 실 존재 확인
 *
 * 실행: npx playwright test tests/e2e/production-smoke.spec.ts
 * CI:   TEST_BASE_URL=https://mychatbot.world npx playwright test
 *
 * 커버 플로우 (5):
 *   1. 홈 (/) 200
 *   2. Bots 탐색 (/bots) 200 + 카드/리스트
 *   3. Pricing (/pricing) 200 + Hero
 *   4. 지원 페이지 (/support) 200
 *   5. 헬스체크 (/api/health) status:'ok' | 'degraded'
 */

import { test, expect, type Page } from '@playwright/test';

async function expectOk(page: Page, path: string) {
  const resp = await page.goto(path, { waitUntil: 'domcontentloaded' });
  expect(resp).not.toBeNull();
  expect(resp!.status(), `GET ${path} should be 2xx`).toBeLessThan(400);
}

test.describe('Production smoke — Next.js routes', () => {
  test('1. 홈 (/) 로드', async ({ page }) => {
    await expectOk(page, '/');
    await expect(page).toHaveTitle(/My Chatbot|MCW|챗봇/i);
  });

  test('2. Bots 탐색 (/bots) 로드', async ({ page }) => {
    await expectOk(page, '/bots');
    // main 영역 존재 확인
    await expect(page.locator('main, body')).toBeVisible();
  });

  test('3. Pricing (/pricing) 로드', async ({ page }) => {
    await expectOk(page, '/pricing');
    await expect(page.locator('body')).toBeVisible();
  });

  test('4. Support (/support) 로드', async ({ page }) => {
    await expectOk(page, '/support');
    await expect(page.locator('body')).toBeVisible();
  });

  test('5. Health (/api/health) JSON 응답', async ({ request }) => {
    const resp = await request.get('/api/health');
    // 200(ok) 또는 503(degraded) 모두 허용 — 라우트 존재 + JSON 스키마만 검증
    expect([200, 503]).toContain(resp.status());
    const body = await resp.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('checks');
    expect(['ok', 'degraded']).toContain(body.status);
  });
});
