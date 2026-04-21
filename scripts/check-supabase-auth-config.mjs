// Supabase 프로젝트의 auth 설정 진단 (Google provider, redirect URLs 등)
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
const projectRef = new URL(PROJECT_URL).hostname.split('.')[0];

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  headers: { 'Authorization': `Bearer ${PAT}` }
});
const cfg = await res.json();

const relevant = {
  site_url: cfg.site_url,
  uri_allow_list: cfg.uri_allow_list,
  external_google_enabled: cfg.external_google_enabled,
  external_google_client_id_set: !!cfg.external_google_client_id,
  external_google_secret_set: !!cfg.external_google_secret,
  external_google_redirect_uri: cfg.external_google_redirect_uri,
  external_kakao_enabled: cfg.external_kakao_enabled,
  external_email_enabled: cfg.external_email_enabled,
  jwt_exp: cfg.jwt_exp,
  mfa_enabled: cfg.mfa_enabled,
};
console.log(JSON.stringify(relevant, null, 2));
