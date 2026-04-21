import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

for (const [label, url] of [
  ['main', 'https://mychatbot.world/'],
  ['skills', 'https://mychatbot.world/skills'],
]) {
  const page = await ctx.newPage();
  await page.goto(url + '?_=' + Date.now(), { waitUntil: 'networkidle', timeout: 30000 });
  // crop just the header
  await page.screenshot({ path: `scripts/header-${label}.png`, clip: { x: 0, y: 0, width: 1440, height: 100 } });
  const items = await page.$$eval('header a, header button', els =>
    els.filter(el => el.offsetWidth > 0).map(el => el.textContent?.trim()).filter(Boolean)
  );
  console.log(`[${label}] visible header items:`, JSON.stringify(items));
  await page.close();
}
await browser.close();
