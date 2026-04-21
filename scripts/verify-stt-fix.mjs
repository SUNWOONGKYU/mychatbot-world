// STT 엔드포인트 수정 실측 검증 — 프로덕션에 실제 요청
// 검증 대상:
//   A) 인증 없이 multipart → 401 (스펙대로 401 반환되는지)
//   B) 인증 + JSON(예전 클라이언트 형식) → 400 (옛 버그 재현)
//   C) 인증 + multipart + 실제 오디오 → 200 { text, language }
//
// 실행: node scripts/verify-stt-fix.mjs [email]

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const BASE = process.argv[3] || 'https://mychatbot.world';
const EMAIL = process.argv[2] || 'wksun999@gmail.com';
const AUDIO_PATH = '_archive/참고자료_AIRI/xsai/packages/generate-transcription/test/fixtures/basic.wav';

function parseEnv(path) {
  return Object.fromEntries(
    readFileSync(path, 'utf-8')
      .split('\n')
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
      })
  );
}
const env = { ...parseEnv('.env'), ...parseEnv('.env.local') };
const URL_VAL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log(`\n[verify-stt-fix] BASE=${BASE}  email=${EMAIL}\n`);

// --- Supabase admin → 해당 사용자의 access token 획득 ---
const admin = createClient(URL_VAL, SERVICE_KEY, { auth: { persistSession: false } });

// admin.generateLink로 magiclink를 만들고, 그 hashed_token을 verifyOtp에 쓰면
// session을 얻을 수 있음. 하지만 이미 알려진 방법은 signInWithPassword지만
// 비번 필요. 대체로 generateLink + verifyOtp 가장 안전.
const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email: EMAIL,
});
if (linkErr) {
  console.error('[FAIL] admin.generateLink:', linkErr.message);
  process.exit(1);
}

const anonClient = createClient(URL_VAL, ANON_KEY, { auth: { persistSession: false } });
const { data: verifyData, error: verifyErr } = await anonClient.auth.verifyOtp({
  type: 'magiclink',
  token_hash: linkData.properties.hashed_token,
});
if (verifyErr || !verifyData.session) {
  console.error('[FAIL] verifyOtp:', verifyErr?.message);
  process.exit(1);
}
const accessToken = verifyData.session.access_token;
console.log(`[OK] access_token 획득: ${accessToken.slice(0, 24)}...`);

// ======================================================
// A) 인증 없이 multipart → 401
// ======================================================
console.log('\n[A] 인증 없이 호출 → 401 기대');
{
  const form = new FormData();
  form.append('audio', new Blob([readFileSync(AUDIO_PATH)], { type: 'audio/wav' }), 'test.wav');
  form.append('language', 'ko');
  const res = await fetch(`${BASE}/api/stt`, { method: 'POST', body: form });
  const body = await res.text();
  console.log(`    status=${res.status}  body=${body.slice(0, 200)}`);
  console.log(res.status === 401 ? '    ✅ PASS (401)' : `    ❌ FAIL (expected 401, got ${res.status})`);
}

// ======================================================
// B) 인증 + JSON(예전 클라이언트 형식) → 400
// ======================================================
console.log('\n[B] 예전 클라이언트 형식(JSON) → 400 기대 (옛 버그 재현)');
{
  const audioB64 = readFileSync(AUDIO_PATH).toString('base64');
  const res = await fetch(`${BASE}/api/stt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ audio: audioB64, language: 'ko' }),
  });
  const body = await res.text();
  console.log(`    status=${res.status}  body=${body.slice(0, 200)}`);
  console.log(res.status === 400 ? '    ✅ PASS (400) — 옛 형식은 실제로 거부됨' : `    ❌ FAIL (expected 400, got ${res.status})`);
}

// ======================================================
// C) 인증 + multipart + 실제 오디오 → 200
// ======================================================
console.log('\n[C] 새 클라이언트 형식(multipart + Bearer) → 200 기대');
{
  const form = new FormData();
  form.append('audio', new Blob([readFileSync(AUDIO_PATH)], { type: 'audio/wav' }), 'test.wav');
  form.append('language', 'en');
  const res = await fetch(`${BASE}/api/stt`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  const body = await res.text();
  console.log(`    status=${res.status}`);
  console.log(`    body=${body.slice(0, 400)}`);
  if (res.status === 200) {
    try {
      const j = JSON.parse(body);
      console.log(`    text="${j.text}"`);
      console.log(j.text ? '    ✅ PASS (200 + 텍스트 변환 성공)' : '    ⚠️  200이지만 text 없음');
    } catch {
      console.log('    ⚠️  200이지만 JSON 파싱 실패');
    }
  } else {
    console.log(`    ❌ FAIL (expected 200, got ${res.status})`);
  }
}

console.log('\n[verify-stt-fix] 완료\n');
