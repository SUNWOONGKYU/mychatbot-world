// Admin 유틸: 이메일로 사용자 조회/삭제 (E2E 테스트 준비용)
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

// .env 병합 로드
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
const srk = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !srk) { console.error('missing env'); process.exit(1); }

const admin = createClient(url, srk, { auth: { autoRefreshToken: false, persistSession: false } });

const EMAIL = process.argv[2] || 'wksun99@gmail.com';
const action = process.argv[3] || 'check'; // check | delete

// listUsers로 찾기 (이메일 검색 API는 없음, 페이지네이션)
async function findByEmail(email) {
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < perPage) return null;
    page++;
    if (page > 10) return null;
  }
}

const user = await findByEmail(EMAIL);
if (!user) {
  console.log(JSON.stringify({ exists: false, email: EMAIL }));
  process.exit(0);
}

console.log(JSON.stringify({
  exists: true,
  id: user.id,
  email: user.email,
  email_confirmed_at: user.email_confirmed_at,
  created_at: user.created_at,
  last_sign_in_at: user.last_sign_in_at,
  identities: user.identities?.map(i => i.provider),
}, null, 2));

if (action === 'delete') {
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) { console.error('delete failed:', error.message); process.exit(1); }
  console.log(JSON.stringify({ deleted: true, id: user.id }));
}
