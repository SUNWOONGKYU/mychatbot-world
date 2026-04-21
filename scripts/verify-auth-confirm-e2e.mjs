// S7SC2 실측: admin.generateLink 로 token_hash 발급 → /auth/confirm 에 직접 주입 →
//            /reset-password?flow=recovery 로 세션과 함께 리다이렉트되는지 확인
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
if (!url || !srk) { console.error('missing env'); process.exit(1); }

const EMAIL = process.argv[2] || 'wksun999@hanmail.net';
const BASE = process.env.BASE_URL || 'https://mychatbot.world';

const admin = createClient(url, srk, { auth: { autoRefreshToken: false, persistSession: false } });

console.log(`[1] generateLink(recovery) for ${EMAIL}`);
const { data, error } = await admin.auth.admin.generateLink({
  type: 'recovery',
  email: EMAIL,
  options: { redirectTo: `${BASE}/auth/callback` },
});
if (error) { console.error('generateLink failed:', error.message); process.exit(1); }

const tokenHash = data?.properties?.hashed_token || data?.properties?.token_hash;
const actionLink = data?.properties?.action_link;
console.log('  token_hash:', tokenHash ? tokenHash.slice(0, 16) + '...' : '(none)');
console.log('  action_link:', actionLink);

if (!tokenHash) { console.error('no token_hash in response'); process.exit(1); }

const confirmUrl = `${BASE}/auth/confirm?token_hash=${tokenHash}&type=recovery&next=${encodeURIComponent('/reset-password?flow=recovery')}`;
console.log(`\n[2] open ${confirmUrl}`);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

try {
  await page.goto(confirmUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // /reset-password?flow=recovery 로 replace 되기를 기다림
  await page.waitForURL(/\/reset-password/, { timeout: 20000 });
  const finalUrl = page.url();
  console.log('  final URL:', finalUrl);

  await page.waitForSelector('#new-password', { timeout: 10000 });
  const title = await page.locator('h1').textContent();
  const hasExpiredError = await page.locator('text=재설정 링크가 만료').count();

  const ok =
    finalUrl.includes('/reset-password') &&
    finalUrl.includes('flow=recovery') &&
    title?.includes('새 비밀번호 설정') &&
    hasExpiredError === 0;

  console.log('\n=== 결과 ===');
  console.log(JSON.stringify({
    final_url: finalUrl,
    title,
    new_password_field_visible: true,
    expired_error_count: hasExpiredError,
    console_errors: consoleErrors.slice(-5),
    pass: ok,
  }, null, 2));
  process.exit(ok ? 0 : 1);
} catch (err) {
  console.error('FAIL:', err?.message || err);
  console.error('console errors:', consoleErrors.slice(-10));
  await page.screenshot({ path: 'scripts/confirm-fail.png' }).catch(() => {});
  process.exit(1);
} finally {
  await browser.close();
}
