import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const cssUrls = new Set();
page.on('response', r => {
  const url = r.url();
  if (url.endsWith('.css') || url.includes('/_next/static/css/')) cssUrls.add(url);
});

await page.goto('https://mychatbot.world/mypage?_=' + Date.now(), { waitUntil: 'networkidle' });

console.log('=== CSS files loaded ===');
for (const url of cssUrls) console.log(url);

// 각 CSS 파일에서 sm:flex / md:flex / hidden 룰 검색
for (const url of cssUrls) {
  try {
    const txt = await (await fetch(url)).text();
    const has_sm_flex = /\.sm\\:flex\s*\{/.test(txt);
    const has_sm_flex_col = /\.sm\\:flex-col\s*\{/.test(txt);
    const has_sm_hidden = /\.sm\\:hidden\s*\{/.test(txt);
    const has_sm_grid = /\.sm\\:grid\s*\{/.test(txt);
    const has_md_flex = /\.md\\:flex\s*\{/.test(txt);
    const has_hidden = /\.hidden\s*\{/.test(txt);
    console.log(`\n--- ${url.split('/').pop()} (${txt.length} bytes) ---`);
    console.log({ has_sm_flex, has_sm_flex_col, has_sm_hidden, has_sm_grid, has_md_flex, has_hidden });
  } catch (e) {
    console.log(`  ${url} - fetch failed: ${e.message}`);
  }
}

await browser.close();
