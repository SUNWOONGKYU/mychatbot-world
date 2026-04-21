// Supabase updateUser 가 동일 비밀번호일 때 반환하는 원본 에러(code/message/status) 캡처
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const f of ['.env', '.env.local']) {
  try {
    const txt = readFileSync(f, 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
    }
  } catch {}
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const srk = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.argv[2] || 'wksun999@hanmail.net';

// 1) recovery 링크 발급 → 세션 수립 (verifyOtp 사용)
const admin = createClient(url, srk, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: gen, error: gErr } = await admin.auth.admin.generateLink({ type: 'recovery', email: EMAIL });
if (gErr) { console.error('generateLink:', gErr); process.exit(1); }
const tokenHash = gen.properties.hashed_token;

// 2) 일반 client 로 verifyOtp
const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const { data: vo, error: vErr } = await client.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
if (vErr) { console.error('verifyOtp:', vErr); process.exit(1); }
console.log('session acquired, user:', vo.user?.email);

// 3) 동일한(직전과 같은) 비밀번호로 updateUser — 현재 비밀번호를 모르므로
//    일단 '임의 강한 새 비번'으로 한 번 바꾸고, 같은 값으로 한 번 더 시도 →
//    두 번째 호출에서 same_password 에러를 유도.
const pw1 = 'Probe!' + Math.random().toString(36).slice(2, 10) + 'A1';
const { error: u1 } = await client.auth.updateUser({ password: pw1 });
if (u1) { console.error('first update failed:', u1); process.exit(1); }
console.log('first update ok (pw1 set)');

// 같은 비밀번호로 다시 → same_password 에러 기대
const { data: u2data, error: u2 } = await client.auth.updateUser({ password: pw1 });
console.log('\n=== second update (same password) ===');
console.log('data:', JSON.stringify(u2data, null, 2));
console.log('error:', u2 ? JSON.stringify({
  name: u2.name,
  message: u2.message,
  status: u2.status,
  code: u2.code,
  __isAuthError: u2.__isAuthError,
  raw: Object.fromEntries(Object.entries(u2)),
}, null, 2) : '(null)');
