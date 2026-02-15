/**
 * Create Bot API - Vercel Serverless Function
 * POST /api/create-bot
 * AI가 인터뷰 텍스트를 분석하여 인사말 + FAQ 자동 생성
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
    const { botName, botDesc, inputText, persona } = req.body;

    if (!botName || !inputText) {
      return res.status(400).json({ error: 'botName, inputText are required' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      return res.status(200).json({
        success: true,
        greeting: null,
        faqs: null,
        model: 'fallback'
      });
    }

    const personaName = persona?.name || botName;
    const personaRole = persona?.role || '';
    const iqEq = persona?.iqEq ?? 50;

    const toneHint = iqEq >= 75 ? '전문적이고 격식 있는 어조'
      : iqEq >= 50 ? '친절하면서도 전문적인 어조'
      : iqEq >= 25 ? '따뜻하고 친근한 어조'
      : '편안하고 감성적인 어조';

    const prompt = `당신은 AI 챗봇 생성 전문가입니다.
아래 사용자의 인터뷰 내용을 분석하여, 이 사람을 대신하는 챗봇의 인사말과 자주 묻는 질문(FAQ)을 생성해주세요.

[챗봇 정보]
- 챗봇 이름: ${botName}
- 소개: ${botDesc || '없음'}
- 페르소나 이름: ${personaName}
- 역할: ${personaRole || '일반 상담'}
- 어조: ${toneHint}

[인터뷰 내용]
"${inputText}"

다음 JSON 형식으로 정확히 반환해주세요. JSON 외 다른 텍스트는 포함하지 마세요:
{
  "greeting": "인사말 (1~2문장, ${toneHint}로 작성)",
  "faqs": [
    {"q": "고객이 물어볼 질문1", "a": "인터뷰 내용 기반 답변1"},
    {"q": "고객이 물어볼 질문2", "a": "인터뷰 내용 기반 답변2"},
    {"q": "고객이 물어볼 질문3", "a": "인터뷰 내용 기반 답변3"},
    {"q": "고객이 물어볼 질문4", "a": "인터뷰 내용 기반 답변4"},
    {"q": "고객이 물어볼 질문5", "a": "인터뷰 내용 기반 답변5"}
  ]
}

규칙:
- 인사말은 챗봇이 방문자에게 처음 하는 말입니다
- FAQ 질문은 인터뷰 내용에서 추출한 고객이 실제로 물어볼 만한 질문이어야 합니다
- FAQ 답변은 인터뷰 내용에 기반하여 구체적으로 작성하세요
- 인터뷰에 없는 내용을 지어내지 마세요
- 한국어로 작성하세요`;

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
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
          })
        });

        if (!resp.ok) {
          console.warn(`[Create API] ${model} failed: ${resp.status}`);
          continue;
        }

        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content || '';

        let aiResult = null;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) aiResult = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.warn(`[Create API] ${model} JSON parse error`);
          continue;
        }

        if (aiResult?.greeting && aiResult?.faqs) {
          return res.status(200).json({
            success: true,
            greeting: aiResult.greeting,
            faqs: aiResult.faqs,
            model: data.model || model
          });
        }
      } catch (e) {
        console.warn(`[Create API] ${model} error:`, e.message);
      }
    }

    res.status(200).json({
      success: true,
      greeting: null,
      faqs: null,
      model: 'fallback'
    });
  } catch (error) {
    console.error('Create bot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
