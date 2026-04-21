// S7SC1 verification — 비밀번호 재설정 플로우 실측
// 프로덕션 배포본에서 다음을 검증:
//   1. /reset-password 페이지 로드 시 에러 없이 렌더
//   2. 이메일 발송 요청 시 redirectTo=/auth/callback 포함 여부 (네트워크 캡처)
//   3. /reset-password?flow=recovery 로 접속 후 새 비밀번호 입력 중
//      "재설정 링크가 만료되었거나 이미 사용되었습니다" 에러가 뜨지 않음
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'https://mychatbot.world';
const EMAIL = process.env.TEST_EMAIL || 'wksun99@gmail.com';

const result = {
  base_url: BASE,
  email: EMAIL,
  deploy_sha: process.env.DEPLOY_SHA || null,
  at: new Date().toISOString(),
  steps: {},
  pass: false,
};

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

// 네트워크 요청 캡처 (resetPasswordForEmail의 redirectTo 확인용)
const resetCalls = [];
page.on('request', (req) => {
  const url = req.url();
  if (url.includes('/auth/v1/recover')) {
    resetCalls.push({
      url,
      method: req.method(),
      postData: req.postData(),
    });
  }
});

const consoleMsgs = [];
page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));

try {
  // Step 1: /reset-password 기본 로드
  await page.goto(`${BASE}/reset-password`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('h1', { timeout: 10000 });
  const title1 = await page.locator('h1').textContent();
  const hasExpiredError1 = await page.locator('text=재설정 링크가 만료').count();
  result.steps.step1_load = {
    title: title1,
    expired_error_visible: hasExpiredError1 > 0,
    pass: title1?.includes('비밀번호 찾기') && hasExpiredError1 === 0,
  };

  // Step 2: 이메일 입력 → 발송 → redirectTo 검증 (요청 URL만 확인, rate-limit 허용)
  await page.fill('#reset-email', EMAIL);
  const recoverReq = page
    .waitForRequest((req) => req.url().includes('/auth/v1/recover'), { timeout: 15000 })
    .catch(() => null);
  await page.click('button[type="submit"]');
  await recoverReq;
  await page.waitForTimeout(1500);
  // Supabase는 redirectTo를 URL query string (?redirect_to=...) 로 보냄 (percent-encoded)
  const redirectToOk = resetCalls.some((c) => {
    const combined = decodeURIComponent(`${c.url}\n${c.postData || ''}`);
    return combined.includes('/auth/callback');
  });
  result.steps.step2_send_email = {
    reset_calls: resetCalls.length,
    call_urls: resetCalls.map((c) => c.url),
    redirectTo_includes_auth_callback: redirectToOk,
    pass: resetCalls.length > 0 && redirectToOk,
  };

  // Step 3: recovery 모드 접속 (토큰 없이 flow=recovery만) — useEffect once-guard 검증
  await page.goto(`${BASE}/reset-password?flow=recovery`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForSelector('h1', { timeout: 10000 });
  const title3 = await page.locator('h1').textContent();

  // 새 비밀번호 필드 대기
  await page.waitForSelector('#new-password', { timeout: 10000 });

  // 천천히 타이핑 — 이 도중 리렌더가 setSession 재호출을 트리거하면 에러가 뜸
  const testPw = 'TestPw!23456';
  for (const ch of testPw) {
    await page.type('#new-password', ch, { delay: 80 });
  }
  for (const ch of testPw) {
    await page.type('#new-password-confirm', ch, { delay: 80 });
  }

  // 타이핑 완료 후 0.5초 대기 (리렌더 종료)
  await page.waitForTimeout(500);

  const hasExpiredError3 = await page.locator('text=재설정 링크가 만료되었거나 이미 사용되었습니다').count();
  const hasAnyErrorRole = await page.locator('[role="alert"]').allTextContents();

  result.steps.step3_recovery_typing = {
    title: title3,
    expired_error_visible: hasExpiredError3 > 0,
    alerts_present: hasAnyErrorRole,
    pass: title3?.includes('새 비밀번호 설정') && hasExpiredError3 === 0,
  };

  result.pass =
    result.steps.step1_load.pass &&
    result.steps.step2_send_email.pass &&
    result.steps.step3_recovery_typing.pass;
} catch (err) {
  result.error = String(err?.message || err);
  result.pass = false;
} finally {
  result.console = consoleMsgs.slice(-30);
  await browser.close();
}

console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
