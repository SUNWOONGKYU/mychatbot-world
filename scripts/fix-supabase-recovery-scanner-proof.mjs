// S7SC2 — 이메일 스캐너 프리페치로 인한 otp_expired 방어
// 1) recovery 이메일 템플릿: {{ .ConfirmationURL }} → {{ .TokenHash }} 기반 /auth/confirm 링크
// 2) uri_allow_list 에 /auth/confirm 추가
import { readFileSync } from 'node:fs';
for (const f of ['.env', '.env.local']) {
  try {
    const txt = readFileSync(f, 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
    }
  } catch {}
}
const PAT = process.env.SUPABASE_PAT;
const PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
if (!PAT || !PROJECT_URL) { console.error('missing SUPABASE_PAT or SUPABASE_URL'); process.exit(1); }
const projectRef = new URL(PROJECT_URL).hostname.split('.')[0];
const API = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
const headers = { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' };

const cur = await (await fetch(API, { headers })).json();

const NEW_RECOVERY = `<h2>비밀번호 재설정</h2>

<p>안녕하세요,</p>

<p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.</p>

<p style="margin: 24px 0;">
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password?flow=recovery" style="background-color: #4F46E5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">비밀번호 재설정</a>
</p>

<p style="color: #e74c3c; font-size: 12px;">이 링크는 1시간 후 만료됩니다.</p>

<hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

<p style="color: #888; font-size: 12px;">
  비밀번호 재설정을 요청하지 않으셨다면 본 이메일을 무시해주세요.<br>
  CoCoBot 팀 드림
</p>
`;

const patch = {
  mailer_templates_recovery_content: NEW_RECOVERY,
};

// uri_allow_list: /auth/confirm 추가 (기존 유지)
const existing = (cur.uri_allow_list || '').split(',').map(s => s.trim()).filter(Boolean);
const additions = [
  'https://mychatbot.world/auth/confirm',
  'http://localhost:3000/auth/confirm',
];
const merged = [...new Set([...existing, ...additions])].join(',');
if (merged !== cur.uri_allow_list) patch.uri_allow_list = merged;

console.log('현재 uri_allow_list:', cur.uri_allow_list);
console.log('변경 후 uri_allow_list:', merged);
console.log('\n템플릿 교체 요약:');
console.log('  {{ .ConfirmationURL }} →  /auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password?flow=recovery');

if (process.argv[2] !== '--apply') {
  console.log('\n(dry-run) 적용: node scripts/fix-supabase-recovery-scanner-proof.mjs --apply');
  process.exit(0);
}

const res = await fetch(API, { method: 'PATCH', headers, body: JSON.stringify(patch) });
if (!res.ok) {
  console.error('PATCH failed:', res.status, await res.text());
  process.exit(1);
}
console.log('\n✅ 적용 완료');
