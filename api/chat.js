/**
 * @task S2BA2
 * Chat API - Vercel Serverless Function
 * POST /api/chat
 */
module.exports = async (req, res) => {
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

    const systemMsg = `당신은 "${botConfig?.botName || 'AI 챗봇'}"입니다.
성격: ${botConfig?.personality || '친절하고 전문적'}
어조: ${botConfig?.tone || '존댓말, 친절한 어조'}

다음 예시 FAQ를 참고하여 답변하세요:
${(botConfig?.faqs || []).map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n')}

규칙:
- 항상 캐릭터를 유지하세요
- 한국어로 답변하세요
- 간결하고 도움이 되는 답변을 하세요
- 이모지를 적절히 사용하세요`;

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
};
