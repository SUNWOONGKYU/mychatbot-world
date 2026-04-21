// 비밀번호 변경 직후 웹 /login 에서 새 비번으로 로그인이 되는지 실측
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const srk = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.argv[2] || 'wksun999@hanmail.net';
const BASE = process.env.BASE_URL || 'https://mychatbot.world';

const admin = createClient(url, srk, { auth: { autoRefreshToken: false, persistSession: false } });

async function genConfirmUrl() {
  const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email: EMAIL });
  if (error) throw error;
  const th = data.properties.hashed_token;
  return `${BASE}/auth/confirm?token_hash=${th}&type=recovery&next=${encodeURIComponent('/reset-password?flow=recovery')}`;
}

const NEW_PW = 'WebTest!' + Date.now().toString(36) + 'Z';

// 1) recovery로 새 비번 설정 (새 세션, 깨끗한 상태)
console.log('[1] set new password via /auth/confirm + /reset-password');
const browser1 = await chromium.launch({ headless: true });
const ctx1 = await browser1.newContext();
const p1 = await ctx1.newPage();
await p1.goto(await genConfirmUrl(), { waitUntil: 'domcontentloaded' });
await p1.waitForURL(/\/reset-password/, { timeout: 15000 });
await p1.waitForSelector('#new-password');
await p1.fill('#new-password', NEW_PW);
await p1.fill('#new-password-confirm', NEW_PW);
await p1.click('button[type="submit"]');
await p1.waitForSelector('text=비밀번호가 변경되었습니다', { timeout: 15000 });
console.log(`  new password: ${NEW_PW}`);
await browser1.close();

// 2) 완전 새 브라우저(persona=웹 신규 방문자)로 /login 에서 새 비번 입력
console.log('\n[2] open FRESH browser context, go to /login, type new password');
const browser2 = await chromium.launch({ headless: true });
const ctx2 = await browser2.newContext();
const p2 = await ctx2.newPage();
const consoleLogs = [];
p2.on('console', (m) => consoleLogs.push(`[${m.type()}] ${m.text()}`));

const tokenReqs = [];
p2.on('response', async (res) => {
  const u = res.url();
  if (u.includes('/auth/v1/token')) {
    tokenReqs.push({ url: u, status: res.status(), body: await res.text().catch(() => '') });
  }
});

await p2.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });

// Find inputs — /login 구조에 맞춰 탐색
await p2.waitForLoadState('networkidle').catch(() => {});
const emailInput = await p2.locator('input[type="email"], input[name="email"], input[id*="email" i]').first();
const pwInput = await p2.locator('input[type="password"]').first();
await emailInput.fill(EMAIL);
await pwInput.fill(NEW_PW);

// Service Worker 감지
const swActive = await p2.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return null;
  const regs = await navigator.serviceWorker.getRegistrations();
  return regs.map(r => ({ scope: r.scope, active: !!r.active, scriptURL: r.active?.scriptURL }));
});

// 로그인 버튼 클릭
const loginBtn = await p2.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Log in")').first();
await loginBtn.click();
await p2.waitForTimeout(5000);

const urlAfter = p2.url();
const bodyText = (await p2.locator('body').innerText()).slice(0, 500);

await p2.screenshot({ path: 'scripts/login-after-reset.png', fullPage: true });

console.log('\n=== 결과 ===');
console.log(JSON.stringify({
  new_password: NEW_PW,
  url_after_login: urlAfter,
  reached_mypage_or_home: /\/(mypage|home|$)/.test(urlAfter.replace(BASE, '')) && !/login/.test(urlAfter),
  body_preview: bodyText,
  token_requests: tokenReqs.map(r => ({ url: r.url, status: r.status, body_preview: r.body.slice(0, 200) })),
  service_workers: swActive,
  console_errors: consoleLogs.filter(l => l.startsWith('[error]')).slice(-5),
}, null, 2));

await browser2.close();
