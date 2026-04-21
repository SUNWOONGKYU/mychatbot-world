// Bearer 없이 /api/chat/stream 호출 시 서버 응답 확인
const BASE = 'https://mychatbot.world';
const r0 = await fetch(`${BASE}/api/bots/public/seonhoegyesa`);
const j0 = await r0.json();
const bot = j0.data.bot;
const persona = j0.data.personas?.[0] || {};

const payload = {
  message: '대화를 할 수 있나',
  botId: bot.id,
  botConfig: { botName: bot.bot_name, personality: persona.role || '', personaName: persona.name, personaId: persona.id, ownerId: bot.owner_id },
  history: [], emotionLevel: 50,
};

console.log('\n[A] /api/chat/stream NO Bearer');
{
  const r = await fetch(`${BASE}/api/chat/stream`, {
    method:'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload),
  });
  console.log('  status:', r.status);
  const t = await r.text();
  console.log('  body(300):', t.slice(0, 300));
}

console.log('\n[B] /api/chat NO Bearer');
{
  const r = await fetch(`${BASE}/api/chat`, {
    method:'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload),
  });
  console.log('  status:', r.status);
  const t = await r.text();
  console.log('  body(300):', t.slice(0, 300));
}
