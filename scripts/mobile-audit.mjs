// S11QA1 — 48페이지 모바일 뷰포트 감사 (베이스라인)
// Playwright로 각 페이지를 390px/768px 뷰포트에서 로드 → 스크린샷 + KPI 4종 측정
//   KPI-1: 가로 스크롤 발생 페이지 (scrollWidth > viewportWidth)
//   KPI-2: 터치 타겟 <44px 요소 (버튼/링크/입력)
//   KPI-3: 본문 폰트 <12px 요소
//   KPI-4: 캡처 스크린샷 (screenshots/mobile-audit/{viewport}/{page}.png)
//
// 로그인 필요 페이지는 TEST_USER_EMAIL/PASSWORD env로 supabase signInWithPassword → 세션 주입.
// env 없으면 공개 페이지만 측정, 비공개는 skipped 기록.

import 'dotenv/config';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

for (const f of ['.env', '.env.local']) {
  try {
    const txt = readFileSync(resolve(ROOT, f), 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
    }
  } catch {}
}

const BASE = process.env.BASE_URL || 'https://mychatbot.world';
const OUT_ROOT = resolve(ROOT, 'scripts/screenshots/mobile-audit');
mkdirSync(resolve(OUT_ROOT, 'v390'), { recursive: true });
mkdirSync(resolve(OUT_ROOT, 'v768'), { recursive: true });

const VIEWPORTS = [
  { name: 'v390', width: 390, height: 844 }, // iPhone 12/13
  { name: 'v768', width: 768, height: 1024 }, // iPad portrait
];

// 48 페이지 대상 — 동적 경로는 실제 존재하는 id로 교체해야 정확하나, 여기선 일단 리스트 페이지 기준
const PAGES = [
  { path: '/', name: 'root', auth: false },
  { path: '/login', name: 'login', auth: false },
  { path: '/signup', name: 'signup', auth: false },
  { path: '/reset-password', name: 'reset-password', auth: false },
  { path: '/onboarding', name: 'onboarding', auth: false },
  { path: '/home', name: 'home', auth: true },
  { path: '/birth', name: 'birth', auth: true },
  { path: '/create', name: 'create', auth: true },
  { path: '/skills', name: 'skills', auth: false },
  { path: '/skills/register', name: 'skills-register', auth: true },
  { path: '/skills/my', name: 'skills-my', auth: true },
  { path: '/learning', name: 'learning', auth: false },
  { path: '/learning/curriculum', name: 'learning-curriculum', auth: false },
  { path: '/learning/certificate', name: 'learning-certificate', auth: true },
  { path: '/jobs', name: 'jobs', auth: false },
  { path: '/jobs/create', name: 'jobs-create', auth: true },
  { path: '/jobs/search', name: 'jobs-search', auth: false },
  { path: '/jobs/match', name: 'jobs-match', auth: true },
  { path: '/jobs/hire', name: 'jobs-hire', auth: true },
  { path: '/community', name: 'community', auth: false },
  { path: '/community/write', name: 'community-write', auth: true },
  { path: '/community/gallery', name: 'community-gallery', auth: false },
  { path: '/bot/faq', name: 'bot-faq', auth: false },
  { path: '/mypage', name: 'mypage', auth: true },
  { path: '/mypage/inheritance', name: 'mypage-inheritance', auth: true },
  { path: '/business', name: 'business', auth: true },
  { path: '/business/revenue', name: 'business-revenue', auth: true },
  { path: '/business/settlement', name: 'business-settlement', auth: true },
  { path: '/marketplace', name: 'marketplace', auth: false },
  { path: '/marketplace/upload', name: 'marketplace-upload', auth: true },
  { path: '/privacy', name: 'privacy', auth: false },
  { path: '/terms', name: 'terms', auth: false },
  { path: '/refund', name: 'refund', auth: false },
  { path: '/customer-service', name: 'customer-service', auth: false },
  { path: '/security', name: 'security', auth: false },
  { path: '/guest', name: 'guest', auth: false },
  { path: '/guest/chat', name: 'guest-chat', auth: false },
  { path: '/admin', name: 'admin', auth: true },
];

const TEST_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_PW = process.env.TEST_USER_PASSWORD;
const supUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const HAS_AUTH = Boolean(TEST_EMAIL && TEST_PW && supUrl && supAnon);

console.log(`[S11QA1] BASE=${BASE} auth=${HAS_AUTH ? 'on' : 'off'}`);
console.log(`[S11QA1] pages=${PAGES.length} viewports=${VIEWPORTS.length}`);

async function getSession() {
  if (!HAS_AUTH) return null;
  const client = createClient(supUrl, supAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PW,
  });
  if (error) {
    console.warn(`[auth] signIn failed: ${error.message} — proceeding without auth`);
    return null;
  }
  return data.session;
}

async function measure(page, viewport) {
  return await page.evaluate((vw) => {
    const doc = document.documentElement;
    const horizontalScroll = doc.scrollWidth > vw + 1; // 여유 1px

    // 터치 타겟 — 버튼/링크/입력
    const interactiveSel = 'button, a, input, select, textarea, [role="button"]';
    const small = [];
    document.querySelectorAll(interactiveSel).forEach((el) => {
      const cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.width < 44 || r.height < 44) {
        small.push({
          tag: el.tagName.toLowerCase(),
          w: Math.round(r.width),
          h: Math.round(r.height),
          text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30),
        });
      }
    });

    // 본문 폰트 <12px — p, span, li, td
    const textSel = 'p, span, li, td, th, div';
    let smallFontCount = 0;
    document.querySelectorAll(textSel).forEach((el) => {
      if (!el.textContent || el.textContent.trim().length === 0) return;
      const cs = window.getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      if (fs > 0 && fs < 12) smallFontCount++;
    });

    return {
      scrollWidth: doc.scrollWidth,
      viewportWidth: vw,
      horizontalScroll,
      smallTouchTargets: small.length,
      smallTouchSamples: small.slice(0, 5),
      smallFontCount,
    };
  }, viewport.width);
}

const browser = await chromium.launch({ headless: true });
const session = await getSession();
const results = [];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  if (session) {
    // supabase-js v2 는 localStorage key `sb-<ref>-auth-token` 을 사용
    const ref = supUrl.match(/https:\/\/([^.]+)\./)[1];
    const storageKey = `sb-${ref}-auth-token`;
    const storageValue = JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: 'bearer',
      user: session.user,
    });
    await ctx.addInitScript(
      ({ k, v }) => {
        try {
          localStorage.setItem(k, v);
        } catch {}
      },
      { k: storageKey, v: storageValue }
    );
  }

  for (const p of PAGES) {
    if (p.auth && !session) {
      results.push({
        page: p.name,
        path: p.path,
        viewport: vp.name,
        status: 'skipped-no-auth',
      });
      continue;
    }
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    let status = 'ok';
    let metrics = null;
    try {
      const resp = await page.goto(`${BASE}${p.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForTimeout(1500); // 레이아웃 stabilize
      metrics = await measure(page, vp);
      await page.screenshot({
        path: resolve(OUT_ROOT, vp.name, `${p.name}.png`),
        fullPage: true,
      });
      if (resp && resp.status() >= 400) status = `http-${resp.status()}`;
    } catch (e) {
      status = `error:${e.message.slice(0, 80)}`;
    }
    results.push({
      page: p.name,
      path: p.path,
      viewport: vp.name,
      status,
      metrics,
      console_errors: errors.slice(-3),
    });
    await page.close();
    process.stdout.write(`  [${vp.name}] ${p.name.padEnd(22)} ${status}\n`);
  }
  await ctx.close();
}

await browser.close();

// 베이스라인 요약
const bySummary = { v390: {}, v768: {} };
for (const vp of VIEWPORTS) {
  const vr = results.filter((r) => r.viewport === vp.name && r.metrics);
  bySummary[vp.name] = {
    total: results.filter((r) => r.viewport === vp.name).length,
    ok: vr.length,
    skipped: results.filter((r) => r.viewport === vp.name && r.status === 'skipped-no-auth')
      .length,
    horizontal_scroll_pages: vr.filter((r) => r.metrics.horizontalScroll).map((r) => r.page),
    small_touch_total: vr.reduce((a, r) => a + r.metrics.smallTouchTargets, 0),
    small_font_total: vr.reduce((a, r) => a + r.metrics.smallFontCount, 0),
    top_offenders_touch: vr
      .slice()
      .sort((a, b) => b.metrics.smallTouchTargets - a.metrics.smallTouchTargets)
      .slice(0, 5)
      .map((r) => ({ page: r.page, count: r.metrics.smallTouchTargets })),
    top_offenders_font: vr
      .slice()
      .sort((a, b) => b.metrics.smallFontCount - a.metrics.smallFontCount)
      .slice(0, 5)
      .map((r) => ({ page: r.page, count: r.metrics.smallFontCount })),
  };
}

const outPath = resolve(ROOT, 'scripts/mobile-audit-baseline.json');
writeFileSync(
  outPath,
  JSON.stringify({ generated_at: new Date().toISOString(), base: BASE, summary: bySummary, results }, null, 2),
  'utf8'
);

console.log('\n=== 베이스라인 요약 ===');
console.log(JSON.stringify(bySummary, null, 2));
console.log(`\n✓ saved: ${outPath}`);
