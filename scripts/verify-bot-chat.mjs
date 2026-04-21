// /bot/[botId] 실측 — 실제 클라이언트 payload
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const parseEnv = p => Object.fromEntries(
  readFileSync(p,'utf-8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
    .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')];})
);
const env = { ...parseEnv('.env'), ...parseEnv('.env.local') };
const BASE = 'https://mychatbot.world';
const BOT_SLUG = process.argv[2] || 'choe-syepeu';

// 공개 봇 조회
const r0 = await fetch(`${BASE}/api/bots/public/${encodeURIComponent(BOT_SLUG)}`);
const j0 = await r0.json();
const bot = j0.data.bot;
const personas = j0.data.personas || [];
console.log('bot.id:', bot.id, '| bot_name:', bot.bot_name);
console.log('personas:', personas.length, '— first:', personas[0]?.name);

const persona = personas[0] || {};

// 실제 클라이언트가 보내는 payload 재현
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
  conversationId: undefined,
};

console.log('\n[A] /api/chat/stream (SSE 1차) — 게스트');
{
  const r = await fetch(`${BASE}/api/chat/stream`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(payload),
  });
  console.log('status:', r.status, '| content-type:', r.headers.get('content-type'));
  const txt = await r.text();
  console.log('body (first 600):', txt.slice(0, 600));
}

console.log('\n[B] /api/chat (JSON 폴백) — 게스트');
{
  const r = await fetch(`${BASE}/api/chat`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(payload),
  });
  console.log('status:', r.status);
  const txt = await r.text();
  console.log('body (first 600):', txt.slice(0, 600));
}
