/**
 * @task PO 수동 실행 — 실프로덕션 E2E 전수 점검 (2026-04-20)
 * 자격증명: TEST_USER_EMAIL / TEST_USER_PASSWORD
 * 독립 test — 하나 실패해도 나머지 진행.
 */
import { test, expect, Page } from '@playwright/test';

const EMAIL = process.env.TEST_USER_EMAIL ?? '';
const PASSWORD = process.env.TEST_USER_PASSWORD ?? '';
const HAS_CREDS = Boolean(EMAIL && PASSWORD);

async function login(page: Page): Promise<{ ok: boolean; finalUrl: string; errorText: string }> {
  await page.goto('/login');
  await page.getByPlaceholder(/이메일/).fill(EMAIL);
  await page.getByPlaceholder(/비밀번호/).first().fill(PASSWORD);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  try {
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
    return { ok: true, finalUrl: page.url(), errorText: '' };
  } catch {
    const errorText = await page.locator('body').innerText().catch(() => '');
    return { ok: false, finalUrl: page.url(), errorText: errorText.slice(0, 500) };
  }
}

test.describe('전체 사용자 여정', () => {
  test.skip(!HAS_CREDS, 'TEST_USER_EMAIL/PASSWORD 미설정');

  test('1. 랜딩 페이지 로드', async ({ page }) => {
    const resp = await page.goto('/');
    const title = await page.title();
    console.log(`  [RESULT] status=${resp?.status()}, title="${title}"`);
    expect(resp?.status()).toBeLessThan(400);
  });

  test('2. /signup 페이지 렌더링', async ({ page }) => {
    const resp = await page.goto('/signup');
    const hasForm = await page.getByPlaceholder(/이메일/).isVisible().catch(() => false);
    const hasPw = await page.getByPlaceholder(/6자 이상/).isVisible().catch(() => false);
    const hasPwConfirm = await page.getByPlaceholder(/비밀번호를 다시/).isVisible().catch(() => false);
    const hasSubmit = await page.getByRole('button', { name: /가입/ }).isVisible().catch(() => false);
    console.log(`  [RESULT] status=${resp?.status()} email=${hasForm} pw=${hasPw} pw확인=${hasPwConfirm} 제출=${hasSubmit}`);
    expect(hasForm && hasPw && hasPwConfirm && hasSubmit).toBeTruthy();
  });

  test.skip('3. 회원가입 — 중복 이메일 에러 확인 (기존 계정)', async ({ page }) => {
    await page.goto('/signup');
    await page.getByPlaceholder(/이메일/).fill(EMAIL);
    // 닉네임은 이메일 다음 필드
    const inputs = await page.locator('input[type="text"], input:not([type])').all();
    if (inputs.length > 0) await inputs[inputs.length - 1].fill('E2E테스터').catch(() => {});
    await page.getByPlaceholder(/6자 이상/).fill(PASSWORD);
    await page.getByPlaceholder(/비밀번호를 다시/).fill(PASSWORD);
    // 필수 체크박스 전부 체크
    const cbs = await page.getByRole('checkbox').all();
    for (const cb of cbs) {
      await cb.check({ force: true }).catch(() => {});
    }
    await page.getByRole('button', { name: /가입/ }).click();
    await page.waitForTimeout(4000);
    const url = page.url();
    const body = await page.locator('body').innerText().catch(() => '');
    const isDuplicate = /이미|already|registered|중복|존재/i.test(body);
    const verifySent = /인증 이메일|이메일.*발송|verification.*email|check.*email/i.test(body);
    const movedOut = !url.includes('/signup');
    console.log(`  [RESULT] url=${url}`);
    console.log(`  [RESULT] duplicate=${isDuplicate}, verifySent=${verifySent}, movedOut=${movedOut}`);
    console.log(`  [RESULT] body snippet: ${body.slice(0, 400).replace(/\s+/g, ' ')}`);
    // duplicate / verifySent / moved 중 하나면 정상 동작
    expect(isDuplicate || verifySent || movedOut).toBeTruthy();
  });

  test('4. 로그인 성공 + 세션 쿠키 발급', async ({ page }) => {
    const result = await login(page);
    const cookies = await page.context().cookies();
    console.log(`  [RESULT] ok=${result.ok}, finalUrl=${result.finalUrl}`);
    console.log(`  [RESULT] cookies: ${cookies.map(c => c.name).join(', ') || '(none)'}`);
    if (!result.ok) console.log(`  [RESULT] error: ${result.errorText.replace(/\s+/g, ' ').slice(0, 300)}`);
    expect(result.ok).toBeTruthy();
  });

  const publicPages: Array<{ path: string; label: string; expectText?: RegExp }> = [
    { path: '/', label: '랜딩', expectText: /코코봇|CoCoBot|챗봇/i },
    { path: '/skills', label: '스킬마켓' },
    { path: '/community', label: '커뮤니티' },
    { path: '/jobs', label: '구인' },
    { path: '/pricing', label: '가격' },
    { path: '/marketplace', label: '마켓' },
    { path: '/customer-service', label: '고객지원' },
    { path: '/terms', label: '이용약관', expectText: /약관|서비스|CoCoBot/ },
    { path: '/privacy', label: '개인정보처리방침', expectText: /개인정보/ },
    { path: '/refund', label: '환불정책', expectText: /환불|청약/ },
    { path: '/guest', label: '게스트' },
  ];

  for (const { path, label, expectText } of publicPages) {
    test(`5. 공개 페이지 ${path} (${label})`, async ({ page }) => {
      const resp = await page.goto(path, { waitUntil: 'networkidle', timeout: 30_000 }).catch(() => null);
      if (!resp) throw new Error(`Navigation failed: ${path}`);
      const status = resp.status();
      let textMatch: boolean | null = null;
      if (expectText) {
        const body = await page.locator('body').innerText();
        textMatch = expectText.test(body);
      }
      console.log(`  [RESULT] ${path} status=${status} textMatch=${textMatch}`);
      expect(status).toBeLessThan(500);
    });
  }

  const authedPages: Array<{ path: string; label: string }> = [
    { path: '/mypage', label: '마이페이지' },
    { path: '/home', label: '홈 (로그인 후 랜딩)' },
    { path: '/create', label: '봇 생성 위저드' },
  ];

  for (const { path, label } of authedPages) {
    test(`6. 인증 페이지 ${path} (${label})`, async ({ page }) => {
      const loginRes = await login(page);
      if (!loginRes.ok) {
        console.log(`  [SKIP] 로그인 실패로 건너뜀`);
        test.skip(true, '로그인 실패');
        return;
      }
      const resp = await page.goto(path, { waitUntil: 'networkidle', timeout: 30_000 }).catch(() => null);
      if (!resp) throw new Error(`Navigation failed: ${path}`);
      const status = resp.status();
      const finalUrl = page.url();
      const redirectedToLogin = finalUrl.includes('/login');
      console.log(`  [RESULT] ${path} status=${status} final=${finalUrl} → login리다이렉트=${redirectedToLogin}`);
      expect(status).toBeLessThan(500);
    });
  }

  test('7. /api/health 실제 응답', async ({ request }) => {
    const resp = await request.get('/api/health');
    const body = await resp.text();
    console.log(`  [RESULT] status=${resp.status()}`);
    console.log(`  [RESULT] body: ${body.slice(0, 500)}`);
    expect([200, 503]).toContain(resp.status());
  });

  test('8. /api/health/ping 빠른 체크', async ({ request }) => {
    const resp = await request.get('/api/health/ping').catch(() => null);
    if (resp) {
      console.log(`  [RESULT] ping status=${resp.status()}, body=${(await resp.text()).slice(0, 200)}`);
    } else {
      console.log(`  [RESULT] ping 엔드포인트 없음`);
    }
  });

  test('9. robots.txt + sitemap.xml', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    const sitemap = await request.get('/sitemap.xml');
    console.log(`  [RESULT] robots.txt status=${robots.status()}`);
    console.log(`  [RESULT] sitemap.xml status=${sitemap.status()}`);
    expect(robots.status()).toBe(200);
    expect(sitemap.status()).toBe(200);
  });

  test('10. 404 페이지 처리', async ({ page }) => {
    const resp = await page.goto('/this-definitely-does-not-exist-xyz123', { waitUntil: 'networkidle' });
    const status = resp?.status();
    const body = await page.locator('body').innerText().catch(() => '');
    console.log(`  [RESULT] status=${status}, has 404 text: ${/404|찾을 수 없|not found/i.test(body)}`);
  });

  test('11. 로그인 후 로그아웃', async ({ page }) => {
    const loginRes = await login(page);
    if (!loginRes.ok) {
      test.skip(true, '로그인 실패');
      return;
    }
    // 로그아웃 버튼/링크 찾기
    const logoutLink = page.getByRole('link', { name: /로그아웃|logout/i }).first();
    const logoutBtn = page.getByRole('button', { name: /로그아웃|logout/i }).first();
    const hasLink = await logoutLink.isVisible().catch(() => false);
    const hasBtn = await logoutBtn.isVisible().catch(() => false);
    console.log(`  [RESULT] 로그아웃 UI — link=${hasLink}, button=${hasBtn}`);
    if (hasLink) await logoutLink.click();
    else if (hasBtn) await logoutBtn.click();
    else {
      // 폴백: API 직접 호출
      await page.request.post('/api/auth/logout').catch(() => {});
    }
    await page.waitForTimeout(2000);
    console.log(`  [RESULT] 로그아웃 후 URL: ${page.url()}`);
  });
});
