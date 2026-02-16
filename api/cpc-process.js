/**
 * CPC Command Auto-Processor
 * POST /api/cpc-process
 *
 * 1. CPC API로 명령 ACK
 * 2. OpenRouter AI로 명령 처리
 * 3. CPC API로 명령 DONE + result 저장
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { commandId, platoonId, text } = req.body || {};

  if (!commandId || !platoonId || !text) {
    return res.status(400).json({ error: 'commandId, platoonId, text are required' });
  }

  const CPC_API = 'https://claude-platoons-control.vercel.app';

  try {
    // Step 1: ACK
    await fetch(`${CPC_API}/api/commands/${commandId}/ack`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });

    // Step 2: 소대 정보 조회 → AI 시스템 프롬프트 구성
    const platoons = await fetch(`${CPC_API}/api/platoons`).then(r => r.json());
    const platoon = platoons.find(p => p.id === platoonId);

    const systemMsg = `당신은 CPC(Claude Platoons Control) "${platoon?.name || platoonId}" 소대의 AI 소대장입니다.
소대 임무: ${platoon?.purpose || '프로젝트 지원'}

규칙:
- 명령을 분석하고 실행 가능한 답변을 제공하세요
- 한국어로 답변하세요
- 간결하고 실용적인 답변을 하세요
- 소대장으로서 전문적이고 명확한 어조를 유지하세요`;

    const messages = [
      { role: 'system', content: systemMsg },
      { role: 'user', content: text }
    ];

    // Step 3: OpenRouter AI 처리 (api/chat.js와 동일한 MODEL_STACK)
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    let aiReply = null;

    if (!OPENROUTER_API_KEY) {
      aiReply = `[CPC] API 키 미설정 — 명령 "${text}" 수신 확인됨`;
    } else {
      const MODEL_STACK = [
        'google/gemini-2.5-flash',
        'openai/gpt-4o',
        'anthropic/claude-sonnet-4.5',
        'deepseek/deepseek-chat',
      ];

      for (const model of MODEL_STACK) {
        try {
          const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: 0.7,
              max_tokens: 500
            })
          });

          if (!resp.ok) {
            console.warn(`[CPC Process] ${model} failed: ${resp.status}`);
            continue;
          }

          const data = await resp.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            aiReply = reply;
            console.log(`[CPC Process] ${model} OK for command ${commandId}`);
            break;
          }
        } catch (e) {
          console.warn(`[CPC Process] ${model} error:`, e.message);
        }
      }

      if (!aiReply) {
        aiReply = `[CPC] 명령 "${text}" 수신 — AI 처리 실패, 수동 확인 필요`;
      }
    }

    // Step 4: DONE + result
    await fetch(`${CPC_API}/api/commands/${commandId}/done`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: aiReply })
    });

    return res.status(200).json({ ok: true, result: aiReply });
  } catch (error) {
    console.error('[CPC Process] error:', error);
    return res.status(500).json({ error: 'CPC process failed', detail: error.message });
  }
}
