import { MODEL_STACK } from './_shared.js';

const CPC_API = 'https://claude-platoons-control.vercel.app';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { platoonId } = req.body || {};

  // 1. 소대 상태 조회
  let platoon = null, recentCmds = [];
  try {
    const platoons = await fetch(`${CPC_API}/api/platoons`).then(r => r.json());
    platoon = platoonId ? platoons.find(p => p.id === platoonId) : null;
  } catch(e) { console.warn('[AgentTick] platoon fetch:', e.message); }

  if (platoonId) {
    try {
      recentCmds = await fetch(`${CPC_API}/api/platoons/${encodeURIComponent(platoonId)}/commands`).then(r => r.json()) || [];
    } catch(e) {}
  }

  // 2. 상황 컨텍스트
  const pending = recentCmds.filter(c => c.status === 'PENDING').length;
  const done = recentCmds.filter(c => c.status === 'DONE').length;
  const platoonStatus = platoon ? platoon.status : '알 수 없음';
  const platoonName = platoon ? (platoon.name || platoonId) : (platoonId || '소대 미선택');

  const systemPrompt = `당신은 CPC 자율 점검 에이전트입니다.
30분마다 소대 상태를 점검하고 2문장 이내 한국어 존댓말로 간결하게 보고합니다.
마크다운(**, ## 등) 사용 금지. 순수 텍스트만.`;

  const userMsg = `소대: ${platoonName}, 상태: ${platoonStatus}, 대기 명령: ${pending}건, 완료: ${done}건. 상황 보고하세요.`;

  // 3. AI 보고 생성
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  let report = null;

  if (OPENROUTER_API_KEY) {
    for (const model of MODEL_STACK) {
      try {
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMsg }
          ], temperature: 0.3, max_tokens: 80 })
        });
        if (!resp.ok) { console.warn(`[AgentTick] ${model} ${resp.status}`); continue; }
        const data = await resp.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) { report = reply.trim(); break; }
      } catch(e) { console.warn(`[AgentTick] ${model}:`, e.message); }
    }
  }

  if (!report) {
    report = `${platoonName} 소대 상태: ${platoonStatus}. 대기 명령 ${pending}건 확인됩니다.`;
  }

  return res.status(200).json({ report, timestamp: new Date().toISOString() });
}
