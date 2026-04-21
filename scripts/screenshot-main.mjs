import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  bypassCSP: true,
  extraHTTPHeaders: { 'Cache-Control': 'no-cache' },
});
const page = await ctx.newPage();

const errors = [];
const failed = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('requestfailed', r => failed.push(`${r.url()} - ${r.failure()?.errorText}`));
page.on('response', r => {
  if (!r.ok() && r.url().includes('mychatbot.world')) failed.push(`${r.status()} ${r.url()}`);
});

await page.goto('https://mychatbot.world/?_=' + Date.now(), { waitUntil: 'networkidle', timeout: 30000 });
await page.screenshot({ path: 'scripts/main-screenshot.png', fullPage: false });

console.log('=== Console Errors ===');
errors.forEach(e => console.log(e));
console.log('\n=== Failed Requests ===');
failed.forEach(f => console.log(f));

const navItems = await page.$$eval('header nav a, header nav button', els =>
  els.map(el => ({
    text: el.textContent?.trim(),
    color: getComputedStyle(el).color,
    visible: el.offsetWidth > 0 && el.offsetHeight > 0,
  }))
);
console.log('\n=== Header Nav Items ===');
console.log(JSON.stringify(navItems, null, 2));

await browser.close();
