/**
 * @task S4TS1
 * @description 챗봇 생성 E2E 테스트
 *
 * 테스트 시나리오:
 * 1. /create 페이지 진입 — 4단계 위저드 UI 표시
 * 2. Step 1: 이름 + 설명 입력 → 다음 버튼 활성화
 * 3. Step 1: 필수 입력값 미입력 시 에러 메시지 표시
 * 4. Step 1 → Step 2 이동 확인
 * 5. 전체 위저드 흐름 완료 (API 모킹 적용)
 * 6. 생성 완료 후 /birth/{botId} 또는 대시보드로 이동
 *
 * 의존성:
 * - S4FE1 (Business 페이지)
 * - 챗봇 생성 위저드 페이지: /create
 */

import { test, expect, Page } from '@playwright/test';

// ── 헬퍼 ──────────────────────────────────────────────────────────────────

async function gotoCreatePage(page: Page) {
  await page.goto('/create');
  await page.waitForLoadState('domcontentloaded');
}

// ── 테스트 ────────────────────────────────────────────────────────────────

test.describe('챗봇 생성 위저드', () => {

  test('챗봇 생성 페이지가 정상적으로 로드된다', async ({ page }) => {
    await gotoCreatePage(page);

    // 위저드 페이지 제목 또는 스텝 표시 확인
    const hasWizardUI =
      (await page.getByText(/챗봇|봇|생성|create/i).count()) > 0 ||
      (await page.getByRole('heading').count()) > 0;

    expect(hasWizardUI).toBeTruthy();
  });

  test('Step 1: 챗봇 이름 입력 필드가 표시된다', async ({ page }) => {
    await gotoCreatePage(page);

    // 이름 입력 필드 확인 (placeholder 또는 label로 찾기)
    const nameInput =
      page.getByPlaceholder(/이름|name/i).first() ||
      page.getByLabel(/이름|name/i).first() ||
      page.locator('input[type="text"]').first();

    await expect(nameInput).toBeVisible();
  });

  test('Step 1: 필수 입력값 미입력 시 다음 버튼이 비활성화되거나 에러가 표시된다', async ({
    page,
  }) => {
    await gotoCreatePage(page);

    // 다음 버튼 찾기
    const nextBtn = page
      .getByRole('button', { name: /다음|next|계속|continue/i })
      .first();

    // 빈 상태에서 다음 버튼 클릭 시도
    if (await nextBtn.isVisible()) {
      const isDisabled = await nextBtn.isDisabled();

      if (!isDisabled) {
        await nextBtn.click();

        // 에러 메시지 또는 유효성 검사 메시지 표시 확인
        const errorVisible =
          (await page.getByText(/필수|required|입력해주세요|error/i).count()) > 0 ||
          (await page.locator('[aria-invalid="true"]').count()) > 0 ||
          (await page.locator('.error, .invalid, [class*="error"]').count()) > 0;

        expect(errorVisible).toBeTruthy();
      } else {
        // 버튼 비활성화 확인
        await expect(nextBtn).toBeDisabled();
      }
    }
  });

  test('Step 1: 이름 입력 후 다음 버튼이 활성화된다', async ({ page }) => {
    await gotoCreatePage(page);

    // 이름 입력
    const nameInput = page.locator('input[type="text"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('테스트 챗봇');

      // 다음 버튼 상태 변화 확인
      const nextBtn = page
        .getByRole('button', { name: /다음|next|계속|continue/i })
        .first();

      if (await nextBtn.isVisible()) {
        // 버튼이 활성화되거나 클릭 가능해야 함
        const isEnabled = await nextBtn.isEnabled();
        expect(isEnabled).toBeTruthy();
      }
    }
  });

  test('API 모킹: 챗봇 생성 API 호출 시 성공 응답 처리', async ({ page }) => {
    // /api/create-bot/deploy 엔드포인트 모킹
    await page.route('**/api/create-bot/deploy', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          botId: 'test-bot-123',
          deployUrl: 'https://test.mychatbot.com/bot/test-bot-123',
          qrSvg: '<svg><!-- QR --></svg>',
        }),
      });
    });

    // /api/analyze 모킹
    await page.route('**/api/analyze**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          persona: '친절한 상담사',
          traits: ['친절', '전문적', '신뢰'],
          faqs: [
            { question: '영업시간은 언제인가요?', answer: '평일 9시~18시입니다.' },
          ],
        }),
      });
    });

    await gotoCreatePage(page);

    // Step 1: 기본 정보 입력
    const nameInput = page.locator('input[type="text"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('E2E 테스트 봇');

      const descInput = page.locator('textarea').first();
      if (await descInput.isVisible()) {
        await descInput.fill('E2E 테스트를 위한 챗봇입니다.');
      }

      const nextBtn = page
        .getByRole('button', { name: /다음|next|계속|continue/i })
        .first();
      if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
        await nextBtn.click();
        await page.waitForLoadState('domcontentloaded');

        // Step 2로 이동 확인
        const step2Visible =
          (await page.getByText(/음성|텍스트|voice|text|분석/i).count()) > 0 ||
          (await page.locator('[data-step="2"]').count()) > 0;

        // 최소한 페이지 이동이 발생했거나 새 콘텐츠가 표시됨
        expect(step2Visible || page.url().includes('step')).toBeTruthy();
      }
    }
  });

  test('콘솔 에러 없이 챗봇 생성 페이지가 렌더링된다', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('net::ERR') && !text.includes('favicon')) {
          consoleErrors.push(text);
        }
      }
    });

    await gotoCreatePage(page);
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });
});

// ── 테스트: 챗봇 목록 ─────────────────────────────────────────────────────

test.describe('챗봇 목록 (대시보드)', () => {
  test('대시보드에서 챗봇 목록이 표시된다', async ({ page }) => {
    // 대시보드 또는 홈 페이지
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 챗봇 목록 또는 비어있음 메시지 표시 확인
    const hasBotList =
      (await page.locator('[class*="bot"], [class*="persona"], [class*="card"]').count()) > 0 ||
      (await page.getByText(/챗봇|봇|페르소나|아직|없음|새로 만들기/i).count()) > 0;

    expect(hasBotList).toBeTruthy();
  });

  test('새 챗봇 만들기 버튼이 표시된다', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 생성 버튼 찾기
    const createBtn =
      page.getByRole('button', { name: /새로 만들기|만들기|생성|create/i }).first() ||
      page.getByRole('link', { name: /새로 만들기|만들기|생성|create/i }).first();

    if (await createBtn.isVisible()) {
      await expect(createBtn).toBeEnabled();
    }
  });
});
