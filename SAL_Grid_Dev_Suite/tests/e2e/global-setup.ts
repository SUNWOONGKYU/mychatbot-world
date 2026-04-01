/**
 * @task S4TS1
 * @description Playwright globalSetup — 테스트 계정 인증 세션 사전 생성
 *
 * - Supabase OAuth 세션을 직접 주입하거나
 * - TEST_USER_EMAIL / TEST_USER_PASSWORD 환경변수로 Supabase REST API 호출
 * - 결과 storageState를 playwright/.auth/user.json 에 저장
 *
 * 주의:
 *   실제 프로덕션은 Google/Kakao OAuth만 지원하므로,
 *   E2E용 테스트 계정은 Supabase Dashboard에서
 *   이메일+비밀번호 계정으로 별도 생성해야 합니다.
 */

import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const STORAGE_STATE_PATH = path.join(__dirname, '../../playwright/.auth/user.json');

async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:3000';

  // auth 디렉토리 생성
  const authDir = path.dirname(STORAGE_STATE_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // 이미 유효한 세션이 있으면 재사용
  if (fs.existsSync(STORAGE_STATE_PATH)) {
    const stored = JSON.parse(fs.readFileSync(STORAGE_STATE_PATH, 'utf-8'));
    const cookies: Array<{ expires?: number }> = stored?.cookies ?? [];
    const isExpired = cookies.some(
      (c) => c.expires && c.expires !== -1 && c.expires * 1000 < Date.now()
    );
    if (!isExpired && cookies.length > 0) {
      console.log('[global-setup] 기존 인증 세션 재사용');
      return;
    }
  }

  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.warn(
      '[global-setup] TEST_USER_EMAIL / TEST_USER_PASSWORD 환경 변수가 없습니다. ' +
        '인증이 필요한 테스트는 건너뜁니다.'
    );
    // 빈 storageState 저장 (인증 없이 실행되는 스모크 테스트를 위해)
    fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('[global-setup] 테스트 계정으로 로그인 중...');

    /**
     * Supabase 이메일 로그인 — Next.js 앱의 /api/auth/session 엔드포인트 활용
     * (없으면 Supabase REST API 직접 호출)
     */
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      // Supabase REST API로 직접 로그인
      const response = await page.request.post(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          headers: {
            apikey: supabaseAnonKey,
            'Content-Type': 'application/json',
          },
          data: { email, password },
        }
      );

      if (!response.ok()) {
        throw new Error(`Supabase 로그인 실패: ${response.status()} ${await response.text()}`);
      }

      const { access_token, refresh_token } = await response.json();

      // Next.js 앱에서 쿠키 기반 세션 설정
      await page.goto(`${baseURL}/login`);
      await page.evaluate(
        ({ accessToken, refreshToken, url, key }) => {
          const storageKey = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            })
          );
          void key; // suppress unused warning
        },
        { accessToken: access_token, refreshToken: refresh_token, url: supabaseUrl, key: supabaseAnonKey }
      );

      // 페이지 새로고침으로 세션 반영
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
    } else {
      // 앱 로그인 페이지 접근 — OAuth 리다이렉트 mock 처리 안 됨
      console.warn('[global-setup] Supabase 환경 변수 없음. 빈 세션으로 진행합니다.');
    }

    await page.context().storageState({ path: STORAGE_STATE_PATH });
    console.log('[global-setup] 인증 세션 저장 완료:', STORAGE_STATE_PATH);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
