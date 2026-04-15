/**
 * 스크린샷 검증 — Playwright로 전 페이지 캡처
 * npx playwright test tests/screenshot-verify.ts
 */
import { test } from '@playwright/test';

const BASE = 'http://localhost:3888';
const OUT = 'C:/mcw-screenshots-local/pw';

const PAGES = [
  { name: '01_landing', path: '/' },
  { name: '02_skills', path: '/skills' },
  { name: '03_jobs', path: '/jobs' },
  { name: '04_community', path: '/community' },
  { name: '05_guest', path: '/guest' },
  { name: '06_login', path: '/login' },
  { name: '07_signup', path: '/signup' },
  { name: '08_create', path: '/create' },
  { name: '09_home', path: '/home' },
  { name: '10_learning', path: '/learning' },
  { name: '11_business', path: '/business' },
  { name: '12_marketplace', path: '/marketplace' },
];

for (const pg of PAGES) {
  test(`screenshot ${pg.name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}${pg.path}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${OUT}_${pg.name}.png`, fullPage: false });
  });
}
