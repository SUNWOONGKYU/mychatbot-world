// /api/bots GET 요약 — mypage 파싱 후 핵심 필드만
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const parseEnv = p => Object.fromEntries(
  readFileSync(p,'utf-8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
    .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')];})
);
const env = { ...parseEnv('.env'), ...parseEnv('.env.local') };
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false}});
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth:{persistSession:false}});
const { data: link } = await admin.auth.admin.generateLink({ type:'magiclink', email:'wksun999@gmail.com' });
const { data: verified } = await anon.auth.verifyOtp({ type:'magiclink', token_hash: link.properties.hashed_token });
const token = verified.session.access_token;

const res = await fetch('https://mychatbot.world/api/bots', { headers: { Authorization: `Bearer ${token}` } });
const json = await res.json();
console.log('status:', res.status);
console.log('success:', json.success);
const bots = json.data?.bots ?? [];
console.log(`\n총 ${bots.length}개 봇\n`);
// mypage 매핑 로직 재현
const mapped = bots.map(b => ({
  id: b.id,
  name: b.bot_name ?? b.name ?? '(이름 없음)',
  desc: b.bot_desc ?? b.description ?? null,
  emoji: b.avatar_emoji ?? null,
  category: b.emoji ?? b.category ?? null,
  deploy_url: b.deploy_url ?? (b.username ? `mychatbot.world/bot/${b.username}` : null),
  personas: b.personas ?? [],
}));
for (const b of mapped) {
  console.log(`• ${b.name.padEnd(12)} | cat=${b.category} | personas=${b.personas.length} | ${b.deploy_url}`);
  for (const p of b.personas) {
    console.log(`    persona: ${p.name} (role: ${(p.role||'').slice(0,30)}...)`);
  }
}
