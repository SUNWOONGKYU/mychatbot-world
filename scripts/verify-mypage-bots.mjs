// /api/bots GET 응답 실측 — mypage가 실제 받는 데이터
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const BASE = process.argv[3] || 'https://mychatbot.world';
const EMAIL = process.argv[2] || 'wksun999@gmail.com';

function parseEnv(p) {
  return Object.fromEntries(
    readFileSync(p, 'utf-8').split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
      .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')]; })
  );
}
const env = { ...parseEnv('.env'), ...parseEnv('.env.local') };
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

const { data: link } = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL });
const { data: verified } = await anon.auth.verifyOtp({ type: 'magiclink', token_hash: link.properties.hashed_token });
const token = verified.session.access_token;

console.log(`\n[verify-mypage-bots] ${BASE}/api/bots  (user=${EMAIL})\n`);

const res = await fetch(`${BASE}/api/bots`, {
  headers: { Authorization: `Bearer ${token}` },
});
console.log('status:', res.status);
const body = await res.text();
let json;
try { json = JSON.parse(body); } catch { console.log('body(raw):', body.slice(0,500)); process.exit(1); }

console.log('top-level keys:', Object.keys(json));
console.log('raw shape:');
console.log(JSON.stringify(json, null, 2).slice(0, 2000));

// mypage의 파싱 로직 재현
const rawBots = Array.isArray(json) ? json : (json.data?.bots ?? json.bots ?? []);
console.log(`\n[파싱 결과] rawBots.length = ${rawBots.length}`);
if (rawBots.length > 0) {
  console.log('[첫 봇 필드]', Object.keys(rawBots[0]));
  console.log('[첫 봇 샘플]');
  console.log(JSON.stringify(rawBots[0], null, 2).slice(0, 1000));
}
