/**
 * @task S2BA2
 * Chat API - Vercel Serverless Function
 * POST /api/chat
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

  try {
    const { message, botConfig, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      // Fallback without API key
      return res.status(200).json({
        reply: `"${message}"에 대해 답변 드리겠습니다. (API키가 설정되지 않아 기본 응답입니다)`,
        model: 'fallback'
      });
    }

    const personaName = botConfig?.personaName || '';
    const personaCategory = botConfig?.personaCategory || '';
    const isCpcLiaison = personaName === 'Claude 연락병';

    let roleRules;
    if (isCpcLiaison) {
      // 연락병 모드: 사용자 = 지휘관, 군사 용어 사용
      roleRules = `- 사용자를 "지휘관님"이라고 부르세요
- CPC 소대장은 "소대장"이라고만 부르세요 (님 붙이지 마세요)
- 명령 접수 시 "CPC 연락병에게 전달했습니다"라고 보고하세요`;
    } else if (personaCategory === 'avatar') {
      // 아바타 모드: 고객/손님 대상, 군사 용어 절대 금지
      roleRules = `- 사용자는 고객/방문자입니다. 정중하고 친절하게 대하세요
- "지휘관", "소대장", "연락병" 등 군사 용어를 절대 사용하지 마세요`;
    } else {
      // 도우미 모드: 봇 소유자 대상, 군사 용어 금지
      roleRules = `- 사용자는 봇 소유자입니다. 편안하고 도움이 되게 대하세요
- "지휘관", "소대장", "연락병" 등 군사 용어를 절대 사용하지 마세요`;
    }

    const systemMsg = `당신은 "${botConfig?.botName || 'AI 챗봇'}"의 "${personaName || 'AI 어시스턴트'}" 페르소나입니다.
성격: ${botConfig?.personality || '친절하고 전문적'}
어조: ${botConfig?.tone || '편안하고 자연스러운 어조'}

다음 예시 FAQ를 참고하여 답변하세요:
${(botConfig?.faqs || []).map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n')}

규칙:
- 항상 캐릭터를 유지하세요
- 한국어로 답변하세요
- 간결하고 도움이 되는 답변을 하세요
- 이모지를 적절히 사용하세요
${roleRules}`;

    const messages = [
      { role: 'system', content: systemMsg },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    // 통합 모델 스택 — 가성비 순서 (원소스 멀티유즈)
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
            temperature: 0.8,
            max_tokens: 500
          })
        });

        if (!resp.ok) {
          console.warn(`[Chat API] ${model} failed: ${resp.status}`);
          continue;
        }

        const data = await resp.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          return res.status(200).json({ reply, model: data.model || model });
        }
      } catch (e) {
        console.warn(`[Chat API] ${model} error:`, e.message);
      }
    }

    res.status(200).json({ reply: '죄송합니다. 잠시 후 다시 시도해주세요.', model: 'fallback' });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
