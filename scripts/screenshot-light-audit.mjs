// S7FE9 HOTFIX4 — 라이트 모드 전체 메뉴 스크린샷 감사
// 주요 4대 메뉴 + 탄생(create) + 비즈니스(business) + 마이페이지 각 탭
// 라이트 모드 강제 전환 후 각 페이지 캡처

import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'https://mychatbot.world';
const OUT = 'scripts/audit-shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  bypassCSP: true,
  extraHTTPHeaders: { 'Cache-Control': 'no-cache' },
});

// next-themes localStorage 초기값으로 light 지정 → 모든 페이지 라이트로 렌더
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  } catch {}
});

const pages = [
  { slug: 'home',             path: '/' },
  { slug: 'birth',            path: '/birth' },
  { slug: 'create',           path: '/create' },
  { slug: 'skills',           path: '/skills' },
  { slug: 'jobs',             path: '/jobs' },
  { slug: 'jobs-hire',        path: '/jobs/hire' },
  { slug: 'community',        path: '/community' },
  { slug: 'community-gallery',path: '/community/gallery' },
  { slug: 'business',         path: '/business' },
  { slug: 'business-revenue', path: '/business/revenue' },
  { slug: 'business-settlement', path: '/business/settlement' },
  { slug: 'mypage',           path: '/mypage' },
  { slug: 'onboarding',       path: '/onboarding' },
];

const results = [];

for (const p of pages) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  try {
    await page.goto(BASE + p.path + '?_=' + Date.now(), { waitUntil: 'networkidle', timeout: 25000 });
    // 확실하게 라이트 모드 적용
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await page.waitForTimeout(400);

    const shot = `${OUT}/${p.slug}-light.png`;
    await page.screenshot({ path: shot, fullPage: true });

    // 대비비 간이 진단: text 노드들 중 bg와 color가 비슷한 것 추출
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
        if (i > 2000) break; i++;
        const txt = el.textContent?.trim();
        if (!txt || txt.length < 2 || el.children.length > 0) continue;
        const st = getComputedStyle(el);
        const fg = toRgb(st.color);
        // find first non-transparent bg ancestor
        let bg = null, node = el;
        while (node && node !== document.documentElement) {
          const s = getComputedStyle(node);
          const c = toRgb(s.backgroundColor);
          if (c && !/rgba\(0, 0, 0, 0\)/.test(s.backgroundColor)) { bg = c; break; }
          node = node.parentElement;
        }
        if (!fg || !bg) continue;
        const r = ratio(fg, bg);
        if (r < 4.5) {
          out.push({
            tag: el.tagName.toLowerCase(),
            text: txt.slice(0, 60),
            fg: `rgb(${fg.join(',')})`,
            bg: `rgb(${bg.join(',')})`,
            ratio: r.toFixed(2),
          });
        }
      }
      // dedupe by fg+bg+text pattern
      const seen = new Set();
      return out.filter(o => {
        const k = `${o.fg}|${o.bg}|${o.text.slice(0,20)}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }).slice(0, 20);
    });

    results.push({ path: p.path, shot, errors: errors.slice(0, 5), contrastIssues });
  } catch (e) {
    results.push({ path: p.path, error: String(e) });
  }
  await page.close();
}

fs.writeFileSync(`${OUT}/audit-report.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.map(r => ({
  path: r.path,
  shot: r.shot,
  issueCount: r.contrastIssues?.length || 0,
  errorCount: r.errors?.length || 0,
})), null, 2));

await browser.close();
