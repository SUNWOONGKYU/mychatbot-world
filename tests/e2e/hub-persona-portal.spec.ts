/**
 * @task S12QA1
 * @description 페르소나 포털 E2E 검증 — 8개 KPI 시나리오
 *
 * 사용법:
 *   TEST_BASE_URL=https://mychatbot.world \
 *   TEST_USER_EMAIL=... TEST_USER_PASSWORD=... \
 *   npx playwright test tests/e2e/hub-persona-portal.spec.ts --project=chromium --reporter=list
 *
 * 요구사항:
 *   - 로그인 계정에 봇이 최소 1개 존재 (시나리오 2/3/5/6 은 2개 이상 필요)
 *   - 시나리오 8 은 10개 봇 보유 시에만 실행 (없으면 skip)
 *   - 시나리오 7 은 10개 미만일 때만 실행
 *
 * 산출물:
 *   - tests/e2e/output/hub-metrics.json (측정값 집계)
 *   - tests/e2e/output/hub-screenshots/*.png (5종)
 */
import { test, expect, Page, BrowserContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const EMAIL = process.env.TEST_USER_EMAIL ?? '';
const PASSWORD = process.env.TEST_USER_PASSWORD ?? '';
const HAS_CREDS = Boolean(EMAIL && PASSWORD);

const OUTPUT_DIR = path.join(process.cwd(), 'tests', 'e2e', 'output');
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, 'hub-screenshots');
const METRICS_PATH = path.join(OUTPUT_DIR, 'hub-metrics.json');

type Metrics = {
  runAt: string;
  baseUrl: string;
  scenarios: Record<string, {
    status: 'PASS' | 'FAIL' | 'SKIP';
    value?: unknown;
    note?: string;
  }>;
};

const metrics: Metrics = {
  runAt: new Date().toISOString(),
  baseUrl: process.env.TEST_BASE_URL ?? 'http://localhost:3000',
  scenarios: {},
};

function recordScenario(name: string, status: 'PASS' | 'FAIL' | 'SKIP', value?: unknown, note?: string) {
  metrics.scenarios[name] = { status, value, note };
  try {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(METRICS_PATH, JSON.stringify(metrics, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`  [WARN] metrics write failed: ${(err as Error).message}`);
  }
}

async function ensureScreenshotDir(): Promise<void> {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function login(page: Page): Promise<boolean> {
  await page.goto('/login');
  await page.getByPlaceholder(/이메일/).fill(EMAIL);
  await page.getByPlaceholder(/비밀번호/).first().fill(PASSWORD);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  try {
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

async function readBotsFromApi(context: BrowserContext, baseUrl: string): Promise<Array<{ id: string; bot_name: string }>> {
  // localStorage에서 Supabase 토큰 조회 → /api/bots 호출
  // 각 브라우저 프로세스에서 실행되므로 context.storageState() 로 접근
  const storage = await context.storageState();
  const origin = storage.origins.find((o) => baseUrl.startsWith(o.origin));
  const tokenItem = origin?.localStorage?.find((i) => i.name.startsWith('sb-') && i.name.endsWith('-auth-token'));
  if (!tokenItem) return [];
  try {
    const parsed = JSON.parse(tokenItem.value);
    const accessToken: string | undefined = parsed?.access_token;
    if (!accessToken) return [];
    const resp = await fetch(`${baseUrl}/api/bots`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data?.bots) ? data.bots : Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

test.describe.configure({ mode: 'serial' });

test.describe('S12QA1 — 페르소나 포털 E2E', () => {
  test.skip(!HAS_CREDS, 'TEST_USER_EMAIL/PASSWORD 미설정');

  test.beforeAll(async () => {
    await ensureScreenshotDir();
  });

  test('1. 봇 목록 렌더 — /hub 접속 시 모든 탭 노출 (KPI1)', async ({ page, context }) => {
    const okLogin = await login(page);
    expect(okLogin).toBeTruthy();

    const baseUrl = metrics.baseUrl;
    const bots = await readBotsFromApi(context, baseUrl);
    if (bots.length < 1) {
      recordScenario('KPI1_render_tabs', 'SKIP', { botsCount: 0 }, '봇 0개 — 스킵');
      test.skip(true, '테스트 계정에 봇이 없음');
      return;
    }

    await page.goto('/hub');
    await page.waitForLoadState('networkidle');

    const tablist = page.getByRole('tablist', { name: '페르소나 탭' });
    await expect(tablist).toBeVisible({ timeout: 10_000 });

    const tabs = await tablist.getByRole('tab').count();
    // 봇 수 최소 min(bots.length, 10)
    const expected = Math.min(bots.length, 10);
    console.log(`  [KPI1] bots=${bots.length} visibleTabs=${tabs} expected=${expected}`);
    expect(tabs).toBeGreaterThanOrEqual(expected);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-hub-desktop.png'), fullPage: false });
    recordScenario('KPI1_render_tabs', 'PASS', { botsCount: bots.length, tabsRendered: tabs });
  });

  test('2. 탭 전환 성능 — <150ms (KPI2)', async ({ page, context }) => {
    await login(page);
    const bots = await readBotsFromApi(context, metrics.baseUrl);
    if (bots.length < 2) {
      recordScenario('KPI2_switch_perf', 'SKIP', { botsCount: bots.length }, '봇 <2 — 스킵');
      test.skip(true, '봇 2개 이상 필요');
      return;
    }

    await page.goto('/hub');
    await page.waitForLoadState('networkidle');
    const tablist = page.getByRole('tablist', { name: '페르소나 탭' });
    await expect(tablist).toBeVisible();

    const tabButtons = tablist.getByRole('tab');
    await tabButtons.nth(0).click();
    await page.waitForTimeout(200); // 초기 탭 렌더 안정화

    const elapsedMs: number = await page.evaluate(async () => {
      const buttons = document.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      if (buttons.length < 2) return -1;
      const t0 = performance.now();
      buttons[1].click();
      // 다음 프레임까지 대기
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      return performance.now() - t0;
    });

    console.log(`  [KPI2] tab switch: ${elapsedMs.toFixed(1)}ms`);
    expect(elapsedMs).toBeGreaterThan(0);
    expect(elapsedMs).toBeLessThan(150);
    recordScenario('KPI2_switch_perf', 'PASS', { switchMs: Number(elapsedMs.toFixed(1)) });
  });

  test('3. 탭별 상태 보존 — conv_id 유지 (KPI3)', async ({ page, context }) => {
    await login(page);
    const bots = await readBotsFromApi(context, metrics.baseUrl);
    if (bots.length < 2) {
      recordScenario('KPI3_state_preservation', 'SKIP', { botsCount: bots.length });
      test.skip(true, '봇 2개 이상 필요');
      return;
    }

    await page.goto('/hub');
    await page.waitForLoadState('networkidle');
    const tablist = page.getByRole('tablist', { name: '페르소나 탭' });
    const tabButtons = tablist.getByRole('tab');

    // 탭1 활성
    await tabButtons.nth(0).click();
    await page.waitForTimeout(300);
    const tab1Url = page.url();

    // 탭2 전환
    await tabButtons.nth(1).click();
    await page.waitForTimeout(300);
    const tab2Url = page.url();
    expect(tab1Url).not.toBe(tab2Url);

    // 탭1 복귀
    await tabButtons.nth(0).click();
    await page.waitForTimeout(300);
    const tab1Again = page.url();
    expect(tab1Again).toBe(tab1Url);

    console.log(`  [KPI3] tab1=${tab1Url} tab2=${tab2Url} tab1Again=${tab1Again}`);
    recordScenario('KPI3_state_preservation', 'PASS', { tab1Url, tab2Url, tab1Again });
  });

  test('4. 딥링크 — /hub?tab=<botId> 즉시 활성 (KPI4)', async ({ page, context }) => {
    await login(page);
    const bots = await readBotsFromApi(context, metrics.baseUrl);
    if (bots.length < 2) {
      recordScenario('KPI4_deeplink', 'SKIP', { botsCount: bots.length });
      test.skip(true, '봇 2개 이상 필요');
      return;
    }
    const targetBot = bots[1]; // 두 번째 봇으로 딥링크

    await page.goto(`/hub?tab=${targetBot.id}`);
    await page.waitForLoadState('networkidle');

    const activeTabId = await page.evaluate(() => {
      const el = document.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]');
      return el?.getAttribute('title') ?? el?.textContent?.trim() ?? null;
    });

    console.log(`  [KPI4] deeplink bot=${targetBot.bot_name} activeTabTitle=${activeTabId}`);
    expect(activeTabId).toBeTruthy();
    // title 속성에 bot_name 이 들어감
    expect(activeTabId).toContain(targetBot.bot_name);
    recordScenario('KPI4_deeplink', 'PASS', { botId: targetBot.id, botName: targetBot.bot_name });
  });

  test('5. 모바일 390x844 — 가로 스크롤 0 + 탭 44px (KPI5)', async ({ page, context }) => {
    await login(page);
    const bots = await readBotsFromApi(context, metrics.baseUrl);
    if (bots.length < 1) {
      recordScenario('KPI5_mobile_layout', 'SKIP', { botsCount: 0 });
      test.skip(true, '봇 1개 이상 필요');
      return;
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/hub');
    await page.waitForLoadState('networkidle');

    const layout = await page.evaluate(() => {
      const body = document.body;
      const tab = document.querySelector<HTMLButtonElement>('[role="tab"]');
      const rect = tab?.getBoundingClientRect();
      return {
        bodyScrollWidth: body.scrollWidth,
        bodyClientWidth: body.clientWidth,
        tabHeight: rect ? Math.round(rect.height) : 0,
      };
    });

    console.log(`  [KPI5] scrollW=${layout.bodyScrollWidth} clientW=${layout.bodyClientWidth} tabH=${layout.tabHeight}`);
    // body 가로 스크롤 없음 (탭바 내부 스크롤은 예외)
    expect(layout.bodyScrollWidth).toBeLessThanOrEqual(layout.bodyClientWidth + 1);
    // 탭 최소 44px
    expect(layout.tabHeight).toBeGreaterThanOrEqual(44);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-hub-mobile-390.png'), fullPage: false });
    recordScenario('KPI5_mobile_layout', 'PASS', layout);
  });

  test('6. 활성 탭만 DOM 유지 — 단일 ChatWindow (KPI6)', async ({ page, context }) => {
    await login(page);
    const bots = await readBotsFromApi(context, metrics.baseUrl);
    if (bots.length < 2) {
      recordScenario('KPI6_single_chatwindow', 'SKIP', { botsCount: bots.length });
      test.skip(true, '봇 2개 이상 필요');
      return;
    }

    await page.goto('/hub');
    await page.waitForLoadState('networkidle');
    // role=tabpanel 이 1개만 존재
    const tabpanels = await page.locator('[role="tabpanel"]').count();
    console.log(`  [KPI6] tabpanels=${tabpanels}`);
    expect(tabpanels).toBe(1);
    recordScenario('KPI6_single_chatwindow', 'PASS', { tabpanels });
  });

  test('7. + 탭 → 위저드 모달 오픈 (KPI7)', async ({ page, context }) => {
    await login(page);
    const bots = await readBotsFromApi(context, metrics.baseUrl);
    if (bots.length >= 10) {
      recordScenario('KPI7_wizard_modal', 'SKIP', { botsCount: bots.length }, '10개 상한 — + 탭 disabled');
      test.skip(true, '10개 봇 계정 — + 탭 disabled 상태');
      return;
    }

    await page.goto('/hub');
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: '새 페르소나 추가' });
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toBeEnabled();
    await addBtn.click();

    // dialog role 확인
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    console.log(`  [KPI7] wizard dialog opened`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-wizard-modal.png'), fullPage: false });
    recordScenario('KPI7_wizard_modal', 'PASS', { dialogVisible: true });
  });

  test('8. 10개 봇 — + 탭 disabled + 오버플로우 드롭다운', async ({ page, context }) => {
    await login(page);
    const bots = await readBotsFromApi(context, metrics.baseUrl);
    if (bots.length < 10) {
      recordScenario('KPI8_limit_overflow', 'SKIP', { botsCount: bots.length }, '10개 미만 — 스킵');
      test.skip(true, '10개 봇 계정이 아님');
      return;
    }

    await page.goto('/hub');
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: '새 페르소나 추가' });
    await expect(addBtn).toBeDisabled();

    if (bots.length > 10) {
      const overflow = page.getByRole('button', { expanded: false }).filter({ hasText: /▼/ });
      await expect(overflow).toBeVisible();
    }
    recordScenario('KPI8_limit_overflow', 'PASS', { botsCount: bots.length });
  });

  test.afterAll(async () => {
    // 최종 metrics.json 다시 쓰기 (모든 시나리오 반영 보장)
    try {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      fs.writeFileSync(METRICS_PATH, JSON.stringify(metrics, null, 2), 'utf-8');
      console.log(`  [DONE] metrics saved to ${METRICS_PATH}`);
    } catch (err) {
      console.warn(`  [WARN] final metrics write failed: ${(err as Error).message}`);
    }
  });
});
