/**
 * @task S2BA1
 * Create Bot API - Vercel Serverless Function
 * POST /api/create-bot
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
        const { botName, botDesc, templateId, inputText, username } = req.body;

        if (!botName || !templateId || !inputText) {
            return res.status(400).json({ error: 'botName, templateId, inputText are required' });
        }

        // AI Analysis via OpenRouter
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        let aiResult = null;

        if (OPENROUTER_API_KEY) {
            const prompt = `
당신은 ${templateId} 분야 전문 AI 챗봇 생성 도우미입니다.
아래 사용자의 음성/텍스트 입력을 분석하여 챗봇 프로필을 JSON으로 생성해주세요.

사용자 입력: "${inputText}"

다음 형식의 JSON을 반환해주세요:
{
  "personality": "챗봇의 성격 설명",
  "tone": "대화 어조 설명",
  "greeting": "인사말",
  "faqs": [
    {"q": "질문1", "a": "답변1"},
    {"q": "질문2", "a": "답변2"},
    {"q": "질문3", "a": "답변3"}
  ]
}`;

            const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                })
            });

            const data = await resp.json();
            const content = data.choices?.[0]?.message?.content || '';

            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) aiResult = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error('AI parse error:', e);
            }
        }

        const result = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            botName,
            botDesc: botDesc || '',
            username: username || botName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            templateId,
            personality: aiResult?.personality || '친절하고 전문적인 AI 비서',
            tone: aiResult?.tone || '존댓말, 친절한 어조',
            greeting: aiResult?.greeting || `안녕하세요! ${botName}입니다. 무엇을 도와드릴까요?`,
            faqs: aiResult?.faqs || [],
            createdAt: new Date().toISOString()
        };

        res.status(200).json({ success: true, bot: result });
    } catch (error) {
        console.error('Create bot error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
