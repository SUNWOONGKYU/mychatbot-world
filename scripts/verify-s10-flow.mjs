#!/usr/bin/env node
/**
 * @task S10QA1 — Tab2 6도구 API smoke test (프로덕션)
 * 실 로그인 세션 Bearer로 각 API 200 확인. 패널이 실제로 fetch하는 엔드포인트만.
 * Usage:
 *   BASE_URL=https://mychatbot.world \
 *   TEST_USER_EMAIL=... TEST_USER_PASSWORD=... \
 *   node scripts/verify-s10-flow.mjs
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.BASE_URL || 'https://mychatbot.world';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const EMAIL = process.env.TEST_USER_EMAIL;
const PW = process.env.TEST_USER_PASSWORD;

if (!SUPABASE_URL || !ANON || !EMAIL || !PW) {
  console.error('Missing env: TEST_USER_EMAIL/TEST_USER_PASSWORD/NEXT_PUBLIC_SUPABASE_URL/ANON_KEY');
  process.exit(2);
}

const supa = createClient(SUPABASE_URL, ANON);
const { data: auth, error: authErr } = await supa.auth.signInWithPassword({ email: EMAIL, password: PW });
if (authErr || !auth?.session) {
  console.error('Auth failed:', authErr?.message);
  process.exit(1);
}
const token = auth.session.access_token;
const userId = auth.user?.id;
console.log('✓ login', userId);

// 첫 봇 하나 잡기
const { data: bots } = await supa.from('mcw_bots').select('id, bot_name').eq('owner_id', userId).limit(1);
if (!bots?.[0]) { console.error('no bot for user'); process.exit(1); }
const botId = bots[0].id;
console.log('✓ bot', botId, bots[0].bot_name);

const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const results = [];

async function hit(label, method, url, body) {
  const res = await fetch(`${BASE_URL}${url}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const txt = await res.text();
  const ok = res.status >= 200 && res.status < 300;
  results.push({ label, url: `${method} ${url}`, status: res.status, ok, body: txt.slice(0, 200) });
  console.log(ok ? '✓' : '✗', `[${res.status}] ${method} ${url}`);
  return { ok, status: res.status, text: txt };
}

await hit('chat-logs GET', 'GET', `/api/bots/${botId}/chat-logs?limit=5`);
await hit('kb GET', 'GET', `/api/kb?chatbot_id=${botId}&limit=5`);
await hit('bot-skills GET', 'GET', `/api/bots/${botId}/skills`);
await hit('growth GET', 'GET', `/api/bots/${botId}/growth`);
await hit('community GET', 'GET', `/api/community?bot_id=${botId}&limit=5`);
// PATCH dry (기존 값 그대로)
await hit('bot PATCH', 'PATCH', `/api/bots/${botId}`, { tone: null });

const pass = results.filter(r => r.ok).length;
console.log(`\n=== ${pass}/${results.length} endpoints OK ===`);
if (pass !== results.length) {
  console.log('Failures:', results.filter(r => !r.ok));
  process.exit(1);
}
