// 현재 Supabase recovery 이메일 템플릿 원문 확인
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
if (!PAT || !PROJECT_URL) { console.error('missing env'); process.exit(1); }
const projectRef = new URL(PROJECT_URL).hostname.split('.')[0];
const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  headers: { Authorization: `Bearer ${PAT}` },
});
const cfg = await res.json();
console.log('=== mailer_templates_recovery_content ===');
console.log(cfg.mailer_templates_recovery_content || '(default)');
console.log('\n=== site_url ===');
console.log(cfg.site_url);
console.log('\n=== uri_allow_list ===');
console.log(cfg.uri_allow_list);
console.log('\n=== external_email_enabled ===');
console.log(cfg.external_email_enabled);
console.log('\n=== mailer_otp_exp ===');
console.log(cfg.mailer_otp_exp);
console.log('\n=== mailer_secure_email_change_enabled ===');
console.log(cfg.mailer_secure_email_change_enabled);
