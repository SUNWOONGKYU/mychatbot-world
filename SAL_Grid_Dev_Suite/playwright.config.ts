/**
 * @task S4TS1
 * @description Playwright E2E 테스트 설정
 *
 * - 3개 브라우저: Chromium, Firefox, WebKit(Safari)
 * - Base URL: 환경 변수 TEST_BASE_URL (기본: http://localhost:3000)
 * - 글로벌 타임아웃: 30초 / 테스트 타임아웃: 60초
 * - 실패 시 스크린샷 자동 캡처
 * - 첫 번째 재시도 시 비디오 녹화
 * - 리포터: HTML + 목록
 * - globalSetup: 인증 세션 사전 생성
 */

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');

export default defineConfig({
  testDir: './tests/e2e',

  /* 글로벌 타임아웃 30초 */
  timeout: 30_000,

  /* 전체 테스트 타임아웃 60초 */
  expect: {
    timeout: 10_000,
  },

  /* 실패 시 재시도 (CI 환경에서는 2회) */
  retries: process.env.CI ? 2 : 0,

  /* 병렬 실행 설정 */
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,

  /* 리포터 설정 */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  /* 공통 설정 */
  use: {
    /* Base URL — 환경 변수 우선 */
    baseURL: process.env.TEST_BASE_URL ?? 'http://localhost:3000',

    /* 실패 시 스크린샷 자동 캡처 */
    screenshot: 'only-on-failure',

    /* 첫 번째 재시도 시 비디오 녹화 */
    video: 'on-first-retry',

    /* 브라우저 트레이스 (CI에서 첫 번째 재시도 시 기록) */
    trace: 'on-first-retry',

    /* 기본 테스트 타임아웃 60초 */
    actionTimeout: 60_000,
    navigationTimeout: 30_000,
  },

  /* globalSetup: 인증 세션 사전 생성 */
  globalSetup: require.resolve('./tests/e2e/global-setup'),

  /* 결과물 폴더 */
  outputDir: 'test-results',

  /* 프로젝트 설정: 3개 브라우저 */
  projects: [
    /* 인증 설정 (Chromium에서만 수행) */
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /* Chromium (Chrome/Edge) */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },

    /* Firefox */
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },

    /* WebKit (Safari) */
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
  ],
});
