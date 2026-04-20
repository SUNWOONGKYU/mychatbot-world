/**
 * @task S8FE2 — Axe WCAG AA 전수 감사
 *
 * WCAG 2.1 AA 위반 0건을 강제한다.
 * 대상 페이지: 5개 (/, /skills, /community, /support, /login)
 *
 * 실행: npx playwright test tests/e2e/a11y-audit.spec.ts
 * CI: .github/workflows/e2e.yml 에서 workflow_dispatch 시 별도 step 으로 수행.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.env.TEST_BASE_URL || 'https://mychatbot.world';

const PAGES: Array<{ path: string; name: string }> = [
  { path: '/', name: 'Landing' },
  { path: '/skills', name: 'Skills (CollectionPage)' },
  { path: '/community', name: 'Community' },
  { path: '/support', name: 'Support (ContactPage)' },
  { path: '/login', name: 'Login' },
];

for (const { path, name } of PAGES) {
  test(`a11y: ${name} (${path}) — WCAG 2.1 AA 위반 0건`, async ({ page }) => {
    const url = `${BASE}${path}`;
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    expect(resp, `page load failed: ${url}`).toBeTruthy();
    expect(resp!.status(), `unexpected status for ${url}`).toBeLessThan(500);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // 외부 요인(써드파티 SDK color-contrast 등) 배제 필요 시 disableRules 사용.
      .disableRules([
        // 랜딩 히어로 배경 그라디언트 위 텍스트는 디자인 의도상 허용.
        // 실 측정 결과에 따라 조정.
      ])
      .analyze();

    if (results.violations.length > 0) {
      console.log(
        `[a11y] ${name} violations:\n` +
          results.violations
            .map(
              (v) =>
                `  - [${v.impact}] ${v.id}: ${v.description}\n    help: ${v.helpUrl}\n    nodes: ${v.nodes.length}`,
            )
            .join('\n'),
      );
    }

    expect(results.violations, `WCAG AA 위반 ${results.violations.length}건 (${name})`).toEqual([]);
  });
}
