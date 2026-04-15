/**
 * @task S4TS1
 * @description Playwright E2E 테스트 설정
 * baseURL: http://localhost:3000
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',

  /* 타임아웃 */
  timeout: 30_000,
  expect: { timeout: 10_000 },

  /* CI 재시도 */
  retries: process.env.CI ? 2 : 0,
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,

  /* 리포터 */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  /* 공통 설정 */
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  outputDir: 'test-results',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
