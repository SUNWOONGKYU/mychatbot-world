// seonhoegyesa 봇 대화 실측 — 원인 진단용
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const parseEnv = p => Object.fromEntries(
  readFileSync(p,'utf-8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
    .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')];})
);
const env = { ...parseEnv('.env'), ...parseEnv('.env.local') };
const BASE = 'https://mychatbot.world';
const BOT_SLUG = 'seonhoegyesa';

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false}});
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth:{persistSession:false}});

console.log('\n[0] DB에서 봇 조회 (slug=seonhoegyesa)');
const { data: botRow, error: botErr } = await admin.from('mcw_bots').select('*').eq('slug', BOT_SLUG).maybeSingle();
console.log('  error:', botErr?.message || 'none');
console.log('  exists:', !!botRow);
if (botRow) {
  console.log('  id:', botRow.id);
  console.log('  bot_name:', botRow.bot_name);
  console.log('  is_public:', botRow.is_public);
  console.log('  owner_id:', botRow.owner_id);
}

console.log('\n[1] /api/bots/public/seonhoegyesa');
const r0 = await fetch(`${BASE}/api/bots/public/${encodeURIComponent(BOT_SLUG)}`);
console.log('  status:', r0.status);
const j0 = await r0.json().catch(() => ({}));
if (!r0.ok) {
  console.log('  error:', JSON.stringify(j0).slice(0, 300));
  process.exit(1);
}
const bot = j0.data.bot;
const persona = j0.data.personas?.[0] || {};
console.log('  bot.id:', bot?.id);
console.log('  persona:', persona?.name || '(none)');

const { data: link } = await admin.auth.admin.generateLink({ type:'magiclink', email:'wksun999@gmail.com' });
const { data: verified } = await anon.auth.verifyOtp({ type:'magiclink', token_hash: link.properties.hashed_token });
const token = verified.session.access_token;

const payload = {
  message: '대화를 할 수 있나',
  botId: bot.id,
  botConfig: {
    botName: bot.bot_name,
    personality: persona.role || bot.bot_desc || '',
    tone: bot.tone || '',
    faqs: persona.faqs || bot.faqs || [],
    personaName: persona.name,
    personaCategory: persona.category,
    userTitle: persona.user_title || '',
    personaId: persona.id,
    ownerId: bot.owner_id,
  },
  history: [],
  emotionLevel: 50,
};

console.log('\n[A] /api/chat/stream (Bearer + SSE)');
{
  const r = await fetch(`${BASE}/api/chat/stream`, {
    method:'POST',
    headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  console.log('  status:', r.status);
  const txt = await r.text();
  console.log('  body length:', txt.length);
  console.log('  first 300 chars:', txt.slice(0, 300));
  let collected = '';
  let sseError = '';
  for (const line of txt.split('\n')) {
    if (line.startsWith('event: error')) sseError = '(error event seen)';
    if (line.startsWith('data: ')) {
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') continue;
      try {
        const p = JSON.parse(raw);
        if (p.text) collected += p.text;
        if (p.error) sseError = p.error;
      } catch { /* skip */ }
    }
  }
  console.log('  streamed text length:', collected.length);
  console.log('  streamed text:', JSON.stringify(collected.slice(0, 300)));
  if (sseError) console.log('  SSE error:', sseError);
}

console.log('\n[B] /api/chat (Bearer, 폴백)');
{
  const r = await fetch(`${BASE}/api/chat`, {
    method:'POST',
    headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  console.log('  status:', r.status);
  const txt = await r.text();
  try {
    const j = JSON.parse(txt);
    console.log('  reply:', JSON.stringify((j.reply || j.error || '').slice(0, 300)));
  } catch {
    console.log('  raw:', txt.slice(0, 300));
  }
}
