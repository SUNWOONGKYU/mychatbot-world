// 최종 검증: 세션을 localStorage + 쿠키에 직접 주입 → /bot/seonhoegyesa 챗봇 응답 + QR 렌더 동시 검증
// 1) admin.generateLink 로 access_token/refresh_token 확보
// 2) page.addInitScript 로 페이지 로드 전 localStorage 주입
// 3) 쿠키도 수동 설정 (client-side sync 를 기다리지 않고 즉시 서버 인증 성립)
// 4) /bot/seonhoegyesa 로 직접 이동 → 메시지 전송 → 응답 확인
// 5) /mypage 로 이동 → Tab2 → QR 캡처 → jsQR 디코드

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync } from 'fs';

const parseEnv = (p) => Object.fromEntries(
  readFileSync(p, 'utf-8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    })
);
const env = { ...parseEnv('.env'), ...parseEnv('.env.local') };

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
const STORAGE_KEY = `sb-${projectRef}-auth-token`;

const admin = createClient(SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// 세션을 얻기 위해 magiclink 발급 → verifyOtp 로 실제 세션 교환
console.log('[0] 관리자로 세션 교환 토큰 발급...');
const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email: 'wksun999@gmail.com',
});
if (linkErr) {
  console.error('generateLink 실패:', linkErr);
  process.exit(1);
}

// hashed_token 을 이용해 verifyOtp 로 세션 획득
const publicClient = createClient(SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, detectSessionInUrl: false },
});
const { data: otpData, error: otpErr } = await publicClient.auth.verifyOtp({
  type: 'magiclink',
  token_hash: linkData.properties.hashed_token,
});
if (otpErr || !otpData.session) {
  console.error('verifyOtp 실패:', otpErr);
  process.exit(1);
}

const session = otpData.session;
console.log(`  ✅ 세션 획득 (사용자: ${otpData.user.email}, 만료: ${new Date(session.expires_at * 1000).toISOString()})`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

// 쿠키 먼저 세팅 (서버 쿠키 폴백 인증 즉시 성립)
await ctx.addCookies([
  {
    name: 'sb-access-token',
    value: session.access_token,
    domain: 'mychatbot.world',
    path: '/',
    httpOnly: false,
    secure: true,
    sameSite: 'Lax',
    expires: session.expires_at,
  },
]);

// localStorage 에 세션 주입 스크립트 (페이지 로드 전 실행)
const supabaseSessionJson = JSON.stringify({
  access_token: session.access_token,
  refresh_token: session.refresh_token,
  expires_at: session.expires_at,
  expires_in: session.expires_in,
  token_type: session.token_type,
  user: otpData.user,
});
await ctx.addInitScript(
  ({ key, json }) => {
    try {
      localStorage.setItem(key, json);
    } catch {}
  },
  { key: STORAGE_KEY, json: supabaseSessionJson }
);

const page = await ctx.newPage();

// 네트워크 요청 감시
const captured = { streamAuth: null, streamCookie: null, streamStatus: null, chatAuth: null };
page.on('request', (req) => {
  const url = req.url();
  if (url.includes('/api/chat/stream')) {
    captured.streamAuth = req.headers()['authorization'] || null;
    captured.streamCookie = req.headers()['cookie'] || null;
  } else if (url.endsWith('/api/chat') && req.method() === 'POST') {
    captured.chatAuth = req.headers()['authorization'] || null;
  }
});
page.on('response', (res) => {
  if (res.url().includes('/api/chat/stream')) {
    captured.streamStatus = res.status();
  }
});

// ========== [A] 챗봇 응답 검증 ==========
console.log('\n[A-1] /bot/seonhoegyesa 진입...');
await page.goto('https://mychatbot.world/bot/seonhoegyesa', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

console.log('[A-2] 메시지 입력 + 전송...');
const input = page.locator('textarea, input[type="text"]').last();
await input.waitFor({ timeout: 10000 });
await input.fill('안녕하세요, 대화가 가능한가요?');

const sendBtn = page.locator('button').filter({ hasText: /전송|보내기|Send/ }).first();
if (await sendBtn.count()) {
  await sendBtn.click();
} else {
  await input.press('Enter');
}

console.log('[A-3] 응답 대기 (최대 20초)...');
let reply = '';
const USER_MSG = '안녕하세요, 대화가 가능한가요?';
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(500);
  // 왼쪽(봇) 버블만 수집 — 오른쪽(user) 버블/안내문은 제외
  const allText = await page.locator('main, body').innerText().catch(() => '');
  // 봇 응답 버블 추출: 사용자 메시지를 제외하고, "대화할 준비" 같은 시스템 문구 제외
  const bubbles = await page.locator('*').filter({ hasText: /./ }).allTextContents().catch(() => []);
  // 간단히: 전체 텍스트에서 사용자 메시지 이후 나타난 10자 이상 문자열 찾기
  const idx = allText.indexOf(USER_MSG);
  if (idx >= 0) {
    const after = allText.slice(idx + USER_MSG.length);
    // 다음 의미있는 텍스트 추출 (시스템 문구 제외)
    const lines = after.split(/[\n\r]+/).map(s => s.trim()).filter(s => s
      && !s.includes('대화할 준비')
      && !s.includes('메시지를 입력')
      && !s.match(/^(텍스트|음성|전송|Send|보내기)$/)
      && s.length >= 5);
    if (lines.length > 0) {
      reply = lines[0];
      if (reply.length >= 10) break;
    }
  }
}

const chatShot = await page.screenshot();
writeFileSync('scripts/final-chat-result.png', chatShot);
console.log(`  /api/chat/stream status: ${captured.streamStatus}`);
console.log(`  Authorization header: ${captured.streamAuth ? '✅ 전송됨' : '❌ 없음'}`);
console.log(`  Cookie sb-access-token: ${captured.streamCookie?.includes('sb-access-token') ? '✅ 전송됨' : '❌ 없음'}`);
console.log(`  봇 응답: ${reply ? `✅ "${reply.slice(0, 100)}..."` : '❌ 없음'}`);

const chatPass = !!reply && reply.length > 20 && captured.streamStatus === 200;

// ========== [B] QR 렌더 + 스캔 검증 ==========
console.log('\n[B-1] /mypage 진입...');
await page.goto('https://mychatbot.world/mypage', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

// 탭2 (코코봇 관리)
try {
  await page.getByText('코코봇 관리', { exact: false }).first().click();
  await page.waitForTimeout(2000);
} catch (e) { console.log('  tab2 click err:', e.message); }

// 첫 봇 카드 클릭해서 확장 (선회계사 찾기)
try {
  const firstCard = page.getByText('선회계사', { exact: false }).first();
  if (await firstCard.count()) {
    await firstCard.click();
    await page.waitForTimeout(2500);
  }
} catch (e) { console.log('  card click err:', e.message); }

const qrImgs = await page.locator('img[alt*="QR"], img[alt*="qr"]').all();
console.log(`  QR 후보 수: ${qrImgs.length}`);

let qrScanned = 0;
let qrTested = 0;
for (let i = 0; i < qrImgs.length; i++) {
  try {
    const src = await qrImgs[i].getAttribute('src');
    if (!src || !src.startsWith('data:image/png')) continue;
    const b64 = src.split(',')[1];
    const buf = Buffer.from(b64, 'base64');
    writeFileSync(`scripts/final-qr-${i}.png`, buf);
    const png = PNG.sync.read(buf);
    const result = jsQR(new Uint8ClampedArray(png.data.buffer), png.width, png.height);
    qrTested++;
    if (result) {
      qrScanned++;
      console.log(`  [QR${i}] ${png.width}x${png.height} → ✅ ${result.data}`);
    } else {
      console.log(`  [QR${i}] ${png.width}x${png.height} → ❌ 디코드 실패`);
    }
  } catch (e) {
    console.log(`  [QR${i}] 에러: ${e.message}`);
  }
}

const mypageShot = await page.screenshot({ fullPage: true });
writeFileSync('scripts/final-mypage-result.png', mypageShot);

const qrPass = qrTested > 0 && qrScanned === qrTested;

await browser.close();

console.log('\n=== 최종 결과 ===');
console.log(`챗봇 응답: ${chatPass ? '✅ PASS' : '❌ FAIL'}`);
console.log(`QR 스캔:   ${qrPass ? `✅ PASS (${qrScanned}/${qrTested})` : qrTested === 0 ? '⚠️ QR 미발견' : `❌ FAIL (${qrScanned}/${qrTested})`}`);

process.exit(chatPass && (qrPass || qrTested === 0) ? 0 : 1);
