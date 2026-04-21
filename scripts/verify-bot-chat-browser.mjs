// 브라우저에서 /bot/seonhoegyesa 방문 → 메시지 전송 → 응답 수신 확인
// Bearer 토큰이 클라이언트에서 실제로 실리는지 + 서버 응답이 UI에 표시되는지 검증
import { chromium } from 'playwright';
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
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

// 네트워크 요청 감시
const authHeaderCaptured = { stream: null, chat: null };
page.on('request', (req) => {
  const url = req.url();
  if (url.includes('/api/chat/stream')) {
    authHeaderCaptured.stream = req.headers()['authorization'] || null;
  } else if (url.endsWith('/api/chat') && req.method() === 'POST') {
    authHeaderCaptured.chat = req.headers()['authorization'] || null;
  }
});

console.log('[1] 로그인...');
await page.goto(link.properties.action_link);
await page.waitForURL(/mychatbot\.world/, { timeout: 30000 });
await page.waitForTimeout(2000);

console.log('[2] /bot/seonhoegyesa 이동...');
await page.goto('https://mychatbot.world/bot/seonhoegyesa', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

// 메시지 입력란 찾기
console.log('[3] 메시지 입력...');
const input = page.locator('input[type="text"], textarea').filter({ hasText: '' }).last();
await input.waitFor({ timeout: 10000 });
await input.fill('대화를 할 수 있나?');

// 전송 버튼 클릭
const sendBtn = page.locator('button').filter({ hasText: /전송|보내기|Send/ }).first();
if (await sendBtn.count()) {
  await sendBtn.click();
} else {
  await input.press('Enter');
}

console.log('[4] 응답 대기 (최대 15초)...');
let reply = '';
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(500);
  const bubbles = await page.locator('[class*="bubble"], [class*="message"], .whitespace-pre-wrap').allTextContents();
  const nonUserBubbles = bubbles.filter(t => t && !t.includes('대화를 할 수 있나') && t.length > 5 && !t.includes('대화할 준비'));
  if (nonUserBubbles.length > 0) {
    reply = nonUserBubbles[nonUserBubbles.length - 1];
    if (reply.length > 20) break;
  }
}

const ss = await page.screenshot({ fullPage: false });
writeFileSync('scripts/bot-chat-result.png', ss);

console.log('\n=== 결과 ===');
console.log('Authorization 헤더 (/api/chat/stream):', authHeaderCaptured.stream ? '전송됨 ✅' : '누락 ❌');
console.log('Authorization 헤더 (/api/chat):', authHeaderCaptured.chat ? '전송됨' : '(호출 안됨)');
console.log('봇 응답 수신:', reply ? `✅ "${reply.slice(0, 80)}..."` : '❌ 응답 없음');

await browser.close();
const pass = !!authHeaderCaptured.stream && !!reply && reply.length > 20 && !reply.includes('로그인');
console.log(pass ? '\n✅ PASS' : '\n❌ FAIL');
process.exit(pass ? 0 : 1);
