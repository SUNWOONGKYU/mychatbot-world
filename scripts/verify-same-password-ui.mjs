// 실제 UI에서 동일 비밀번호 입력 시 에러 메시지 노출 여부 실측
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

for (const f of ['.env', '.env.local']) {
  try {
    const txt = readFileSync(f, 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
    }
  } catch {}
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const srk = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.argv[2] || 'wksun999@hanmail.net';
const BASE = process.env.BASE_URL || 'https://mychatbot.world';
const admin = createClient(url, srk, { auth: { autoRefreshToken: false, persistSession: false } });

async function getConfirmUrl() {
  const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email: EMAIL });
  if (error) throw error;
  const th = data.properties.hashed_token;
  return `${BASE}/auth/confirm?token_hash=${th}&type=recovery&next=${encodeURIComponent('/reset-password?flow=recovery')}`;
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const consoleLogs = [];
page.on('console', (m) => consoleLogs.push(`[${m.type()}] ${m.text()}`));

try {
  const PW = 'SameTest!' + Date.now().toString(36) + 'A';

  // 1) 첫 번째 reset: 새 비번 PW 로 변경
  console.log('[Round 1] generating link + visiting /auth/confirm');
  await page.goto(await getConfirmUrl(), { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/reset-password/, { timeout: 15000 });
  await page.waitForSelector('#new-password');
  await page.fill('#new-password', PW);
  await page.fill('#new-password-confirm', PW);
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=비밀번호가 변경되었습니다', { timeout: 15000 });
  console.log('  first change OK');

  // 2) 두 번째 reset: 같은 PW 입력 → same_password 에러 기대
  console.log('[Round 2] generating link + visiting /auth/confirm');
  await page.goto(await getConfirmUrl(), { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/reset-password/, { timeout: 15000 });
  await page.waitForSelector('#new-password');
  await page.fill('#new-password', PW);
  await page.fill('#new-password-confirm', PW);

  // 제출 후 /login 으로 튕기지 않아야 함 — 에러로 머물러야 함
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const urlAfter = page.url();
  const alertTexts = await page.locator('[role="alert"]').allTextContents();
  const errorTextsUnderInput = await page.locator('p.text-xs.text-error, p[role="alert"]').allTextContents();
  const fullBody = await page.locator('body').innerText();
  const hasFriendlyMsg = /이전과 동일한 비밀번호/.test(fullBody);
  const hasGenericMsg = /비밀번호 변경에 실패/.test(fullBody);
  const hasRawSupabase = /should be different|same_password|New password/.test(fullBody);

  await page.screenshot({ path: 'scripts/same-password-error.png', fullPage: true });

  console.log('\n=== UI state after submit (same password) ===');
  console.log(JSON.stringify({
    url_after: urlAfter,
    redirected_to_login: /\/login/.test(urlAfter),
    alert_texts: alertTexts,
    error_texts: errorTextsUnderInput,
    has_friendly_same_pw_msg: hasFriendlyMsg,
    has_generic_fail_msg: hasGenericMsg,
    has_raw_supabase_leak: hasRawSupabase,
    console_tail: consoleLogs.slice(-5),
  }, null, 2));
} catch (err) {
  console.error('FAIL:', err?.message || err);
  await page.screenshot({ path: 'scripts/same-password-fail.png' }).catch(() => {});
} finally {
  await browser.close();
}
