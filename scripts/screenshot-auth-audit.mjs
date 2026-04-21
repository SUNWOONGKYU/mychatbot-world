// S7FE9 HOTFIX5 — 로그인 상태 전체 메뉴 감사
// 이메일/비밀번호 로그인 후 인증된 페이지 전부 캡처 + 대비 측정

import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'https://mychatbot.world';
const EMAIL = 'wksun999@hanmail.net';
const PASSWORD = 'na*5215900';
const OUT = 'scripts/audit-auth-shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  bypassCSP: true,
});

// 라이트 모드 강제
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  } catch {}
});

// ── 1단계: 로그인 ─────────────────────────────────────
const loginPage = await ctx.newPage();
console.log('[login] → /login');
await loginPage.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
await loginPage.waitForTimeout(500);

// 이메일 입력
const emailInput = await loginPage.locator('input[type="email"], input[placeholder*="이메일"]').first();
await emailInput.fill(EMAIL);

// 비밀번호 입력
const pwInput = await loginPage.locator('input[type="password"]').first();
await pwInput.fill(PASSWORD);

await loginPage.screenshot({ path: `${OUT}/00-login-filled.png`, fullPage: true });

// 로그인 버튼 클릭 (텍스트 "로그인")
const loginBtn = loginPage.locator('button:has-text("로그인")').first();
await loginBtn.click();

// 로그인 완료 대기: URL 이동 또는 쿠키 확인
try {
  await loginPage.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
  console.log('[login] success → ' + loginPage.url());
} catch {
  console.log('[login] timeout or stayed on login page. URL=' + loginPage.url());
  await loginPage.screenshot({ path: `${OUT}/00-login-after-click.png`, fullPage: true });
}

await loginPage.waitForTimeout(1500);
await loginPage.close();

// ── 2단계: 인증 쿠키 유지한 채 모든 페이지 순회 ─────────
const pages = [
  { slug: 'mypage',                path: '/mypage' },
  { slug: 'mypage-profile',        path: '/mypage?tab=profile' },
  { slug: 'mypage-bots',           path: '/mypage?tab=bots' },
  { slug: 'mypage-learning',       path: '/mypage?tab=learning' },
  { slug: 'mypage-skills',         path: '/mypage?tab=skills' },
  { slug: 'mypage-business',       path: '/mypage?tab=business' },
  { slug: 'mypage-inherit',        path: '/mypage?tab=inherit' },
  { slug: 'mypage-credits',        path: '/mypage?tab=credits' },
  { slug: 'mypage-shop',           path: '/mypage?tab=shop' },
  { slug: 'mypage-security',       path: '/mypage?tab=security' },
  { slug: 'birth',                 path: '/birth' },
  { slug: 'create',                path: '/create' },
  { slug: 'skills',                path: '/skills' },
  { slug: 'skills-my',             path: '/skills/my' },
  { slug: 'jobs',                  path: '/jobs' },
  { slug: 'jobs-hire',             path: '/jobs/hire' },
  { slug: 'jobs-match',            path: '/jobs/match' },
  { slug: 'community',             path: '/community' },
  { slug: 'community-gallery',     path: '/community/gallery' },
  { slug: 'community-write',       path: '/community/write' },
  { slug: 'business',              path: '/business' },
  { slug: 'business-revenue',      path: '/business/revenue' },
  { slug: 'business-settlement',   path: '/business/settlement' },
  { slug: 'onboarding',            path: '/onboarding' },
];

const results = [];

for (const p of pages) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });

  try {
    await page.goto(BASE + p.path + (p.path.includes('?') ? '&' : '?') + '_=' + Date.now(), {
      waitUntil: 'networkidle',
      timeout: 25000,
    });
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await page.waitForTimeout(500);

    const shot = `${OUT}/${p.slug}-light.png`;
    await page.screenshot({ path: shot, fullPage: true });

    // URL이 /login으로 튕겼다면 인증 실패
    const finalUrl = page.url();
    const bouncedToLogin = finalUrl.includes('/login');

    const contrastIssues = await page.evaluate(() => {
      const out = [];
      const all = document.querySelectorAll('body *');
      const toRgb = (s) => {
        const m = s.match(/\d+/g);
        if (!m || m.length < 3) return null;
        return [+m[0], +m[1], +m[2]];
      };
      const lum = ([r,g,b]) => {
        const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const ratio = (a, b) => {
        const L1 = Math.max(lum(a), lum(b));
        const L2 = Math.min(lum(a), lum(b));
        return (L1 + 0.05) / (L2 + 0.05);
      };
      let i = 0;
      for (const el of all) {
        if (i > 3000) break; i++;
        const txt = el.textContent?.trim();
        if (!txt || txt.length < 2 || el.children.length > 0) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 5 || rect.height < 5) continue;  // 숨겨진 요소 제외
        const st = getComputedStyle(el);
        if (st.visibility === 'hidden' || st.display === 'none' || parseFloat(st.opacity) < 0.3) continue;
        const fg = toRgb(st.color);
        let bg = null, node = el;
        while (node && node !== document.documentElement) {
          const s = getComputedStyle(node);
          const c = toRgb(s.backgroundColor);
          if (c && !/rgba\(0, 0, 0, 0\)/.test(s.backgroundColor) && parseFloat(s.backgroundColor.match(/[\d.]+\)$/)?.[0] || '1') > 0.5) {
            bg = c; break;
          }
          node = node.parentElement;
        }
        if (!fg || !bg) continue;
        const r = ratio(fg, bg);
        if (r < 4.5) {
          out.push({
            tag: el.tagName.toLowerCase(),
            text: txt.slice(0, 50),
            fg: `rgb(${fg.join(',')})`,
            bg: `rgb(${bg.join(',')})`,
            ratio: r.toFixed(2),
          });
        }
      }
      const seen = new Set();
      return out.filter(o => {
        const k = `${o.fg}|${o.bg}|${o.text.slice(0,30)}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }).slice(0, 15);
    });

    results.push({ path: p.path, shot, finalUrl, bouncedToLogin, errors: errors.slice(0, 3), contrastIssues });
  } catch (e) {
    results.push({ path: p.path, error: String(e).slice(0, 200) });
  }
  await page.close();
}

fs.writeFileSync(`${OUT}/audit-report.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.map(r => ({
  path: r.path,
  bouncedToLogin: r.bouncedToLogin,
  issueCount: r.contrastIssues?.length || 0,
  errorCount: r.errors?.length || 0,
})), null, 2));

await browser.close();
