// Supabase Email Template / Sender Name 일괄 교체
// Management API 사용 (SUPABASE_PAT 필요)
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

const PAT = process.env.SUPABASE_PAT;
const PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
if (!PAT || !PROJECT_URL) { console.error('missing SUPABASE_PAT or SUPABASE_URL'); process.exit(1); }

// URL에서 project ref 추출
const projectRef = new URL(PROJECT_URL).hostname.split('.')[0];
console.log('project ref:', projectRef);

const API = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
const headers = { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' };

// 현재 설정 조회
const getRes = await fetch(API, { headers });
if (!getRes.ok) {
  console.error('GET failed:', getRes.status, await getRes.text());
  process.exit(1);
}
const current = await getRes.json();

// 관련 필드만 추출해서 표시
const relevant = {
  site_url: current.site_url,
  mailer_subjects_confirmation: current.mailer_subjects_confirmation,
  mailer_subjects_recovery: current.mailer_subjects_recovery,
  mailer_subjects_invite: current.mailer_subjects_invite,
  mailer_subjects_magic_link: current.mailer_subjects_magic_link,
  smtp_sender_name: current.smtp_sender_name,
  smtp_admin_email: current.smtp_admin_email,
  has_confirmation_template: !!current.mailer_templates_confirmation_content,
  has_recovery_template: !!current.mailer_templates_recovery_content,
  has_magic_link_template: !!current.mailer_templates_magic_link_content,
  has_invite_template: !!current.mailer_templates_invite_content,
};
console.log('현재 설정:', JSON.stringify(relevant, null, 2));

// 교체 함수 — My Chatbot World → CoCoBot
const OLD = /My\s*Chatbot\s*World|마이\s*챗봇\s*월드/gi;
const NEW = 'CoCoBot';
function swap(s) {
  if (typeof s !== 'string') return s;
  return s.replace(OLD, NEW);
}

// 업데이트 페이로드
const patch = {};
const fields = [
  'smtp_sender_name',
  'mailer_subjects_confirmation',
  'mailer_subjects_recovery',
  'mailer_subjects_invite',
  'mailer_subjects_magic_link',
  'mailer_subjects_email_change',
  'mailer_subjects_reauthentication',
  'mailer_templates_confirmation_content',
  'mailer_templates_recovery_content',
  'mailer_templates_invite_content',
  'mailer_templates_magic_link_content',
  'mailer_templates_email_change_content',
  'mailer_templates_reauthentication_content',
];

const changes = [];
for (const k of fields) {
  if (current[k] && typeof current[k] === 'string') {
    const replaced = swap(current[k]);
    if (replaced !== current[k]) {
      patch[k] = replaced;
      changes.push({ field: k, before: current[k].slice(0, 120), after: replaced.slice(0, 120) });
    }
  }
}

if (Object.keys(patch).length === 0) {
  console.log('교체할 내용 없음.');
  process.exit(0);
}

console.log('\n교체 예정:');
console.log(JSON.stringify(changes, null, 2));

if (process.argv[2] !== '--apply') {
  console.log('\n(dry-run) 실제 적용하려면: node scripts/update-supabase-email-templates.mjs --apply');
  process.exit(0);
}

const patchRes = await fetch(API, { method: 'PATCH', headers, body: JSON.stringify(patch) });
if (!patchRes.ok) {
  console.error('PATCH failed:', patchRes.status, await patchRes.text());
  process.exit(1);
}
console.log('\n✅ 적용 완료');
