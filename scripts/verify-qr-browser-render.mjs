// Playwright로 프로덕션 Step8 + mypage QR을 실제 브라우저 렌더 후 디코드
import { chromium } from 'playwright';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const parseEnv = p => Object.fromEntries(
  readFileSync(p,'utf-8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
    .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')];})
);
const env = { ...parseEnv('.env'), ...parseEnv('.env.local') };

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false}});
const { data: link } = await admin.auth.admin.generateLink({ type:'magiclink', email:'wksun999@gmail.com' });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// 1) 매직링크로 로그인
console.log('[1] 로그인...');
await page.goto(link.properties.action_link);
await page.waitForURL(/mychatbot\.world/, { timeout: 30000 });
await page.waitForTimeout(2000);

// 2) mypage로 가서 봇 카드 확인 (QR이 렌더되는 곳)
console.log('[2] mypage Tab2 이동...');
await page.goto('https://mychatbot.world/mypage', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

// 탭 2 (봇 관리) 클릭
try {
  const tab2 = page.getByRole('button', { name: /봇 관리|챗봇 관리/ }).first();
  if (await tab2.count()) await tab2.click();
  await page.waitForTimeout(2000);
} catch {}

// 봇 카드 확장 시도
try {
  const expandBtns = await page.locator('button:has-text("URL")').all();
  for (const btn of expandBtns) { try { await btn.click(); } catch {} }
  await page.waitForTimeout(1500);
} catch {}

// QR 이미지 찾기
const qrImgs = await page.locator('img[alt*="QR"]').all();
console.log(`  QR 이미지 수: ${qrImgs.length}`);

let scannable = 0;
let tested = 0;
for (let i = 0; i < qrImgs.length; i++) {
  const img = qrImgs[i];
  try {
    const box = await img.boundingBox();
    if (!box) continue;
    const buf = await img.screenshot();
    writeFileSync(`scripts/qr-render-${i}.png`, buf);
    const png = PNG.sync.read(buf);
    const result = jsQR(new Uint8ClampedArray(png.data.buffer), png.width, png.height);
    tested++;
    if (result) {
      scannable++;
      console.log(`  [QR${i}] ${png.width}x${png.height} → SUCCESS: ${result.data}`);
    } else {
      console.log(`  [QR${i}] ${png.width}x${png.height} → FAIL (디코드 불가)`);
    }
  } catch (e) {
    console.log(`  [QR${i}] 스크린샷 실패: ${e.message}`);
  }
}

console.log(`\n결과: ${scannable}/${tested} 디코드 성공`);

await browser.close();
process.exit(tested > 0 && scannable === tested ? 0 : 1);
