// 인증 포함 /api/chat 실측 — 배포 후 검증
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const parseEnv = p => Object.fromEntries(
  readFileSync(p,'utf-8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
    .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')];})
);
const env = { ...parseEnv('.env'), ...parseEnv('.env.local') };
const BASE = 'https://mychatbot.world';
const BOT_SLUG = 'choe-syepeu';

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false}});
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth:{persistSession:false}});
const { data: link } = await admin.auth.admin.generateLink({ type:'magiclink', email:'wksun999@gmail.com' });
const { data: verified } = await anon.auth.verifyOtp({ type:'magiclink', token_hash: link.properties.hashed_token });
const token = verified.session.access_token;

const r0 = await fetch(`${BASE}/api/bots/public/${encodeURIComponent(BOT_SLUG)}`);
const j0 = await r0.json();
const bot = j0.data.bot;
const persona = j0.data.personas[0] || {};

const payload = {
  message: '정말 맛있어요?',
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

console.log('\n[A] /api/chat (Bearer) — 봇 응답 실측');
{
  const r = await fetch(`${BASE}/api/chat`, {
    method:'POST',
    headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  console.log('status:', r.status);
  const txt = await r.text();
  const j = JSON.parse(txt);
  console.log('reply:', JSON.stringify(j.reply || j.error));
}

console.log('\n[B] /api/chat/stream (Bearer + SSE) — 실측');
{
  const r = await fetch(`${BASE}/api/chat/stream`, {
    method:'POST',
    headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  console.log('status:', r.status);
  const txt = await r.text();
  // SSE 이벤트 중 text 추출
  let collected = '';
  for (const line of txt.split('\n')) {
    if (line.startsWith('data: ')) {
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') continue;
      try {
        const p = JSON.parse(raw);
        if (p.text) collected += p.text;
      } catch { /* skip */ }
    }
  }
  console.log('streamed text length:', collected.length);
  console.log('streamed text:', JSON.stringify(collected.slice(0, 200)));
}
