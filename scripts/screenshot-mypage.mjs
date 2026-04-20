import { chromium } from 'playwright';

const URL = 'https://mychatbot.world/mypage?_=' + Date.now();

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  bypassCSP: true,
  extraHTTPHeaders: { 'Cache-Control': 'no-cache' },
});
const page = await ctx.newPage();

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);

await page.screenshot({ path: 'scripts/mypage-1440.png', fullPage: false });

// 사이드바 검출
const probe = await page.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="마이페이지 탭 네비게이션"]');
  if (!nav) return { hasNav: false };
  const sidebar = nav.querySelector('[aria-orientation="vertical"]');
  const horizontal = nav.querySelector('[aria-orientation="horizontal"]');
  const main = document.querySelector('main[aria-label="마이페이지"]');
  return {
    hasNav: true,
    sidebarExists: !!sidebar,
    sidebarVisible: sidebar ? sidebar.offsetWidth > 0 : false,
    sidebarWidth: sidebar ? sidebar.offsetWidth : 0,
    sidebarDisplay: sidebar ? getComputedStyle(sidebar).display : null,
    horizontalDisplay: horizontal ? getComputedStyle(horizontal.parentElement).display : null,
    mainGridDisplay: main ? getComputedStyle(main.querySelector('div.sm\\:grid, div.md\\:grid') || main).display : null,
    viewportWidth: window.innerWidth,
    sidebarClasses: sidebar ? sidebar.className : null,
    horizontalClasses: horizontal ? horizontal.parentElement.className : null,
  };
});

// 배포 빌드 확인 — 빌드 ID
const buildInfo = await page.evaluate(() => {
  const next = document.querySelector('script#__NEXT_DATA__');
  if (next) {
    try {
      const data = JSON.parse(next.textContent);
      return { buildId: data.buildId };
    } catch { return null; }
  }
  return null;
});
console.log('=== Build Info ===');
console.log(JSON.stringify(buildInfo, null, 2));

console.log('=== /mypage 1440px ===');
console.log(JSON.stringify(probe, null, 2));
console.log('\n=== Console Errors ===');
errors.forEach(e => console.log(e));

// 모바일 뷰
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
await page.screenshot({ path: 'scripts/mypage-390.png', fullPage: false });

await browser.close();
