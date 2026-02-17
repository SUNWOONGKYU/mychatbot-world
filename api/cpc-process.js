/**
 * CPC Command Auto-Processor (Smart)
 * POST /api/cpc-process
 *
 * 1. CPC API로 명령 ACK
 * 2. OpenRouter AI로 명령 분석 & 처리
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

    // Step 2: 소대 정보 조회
    const platoons = await fetch(`${CPC_API}/api/platoons`).then(r => r.json());
    const platoon = platoons.find(p => p.id === platoonId);

    // Step 3: 똑똑한 시스템 프롬프트
    const systemMsg = `당신은 CPC(Claude Platoons Control) "${platoon?.name || platoonId}" 소대의 AI 참모입니다.

## 소대 정보
- 소대명: ${platoon?.name || platoonId}
- 임무: ${platoon?.purpose || '프로젝트 개발 지원'}
- 프로젝트: My Chatbot World (멀티페르소나 AI 챗봇 플랫폼)

## 프로젝트 컨텍스트
- Vercel 배포 (https://mychatbot-world.vercel.app)
- 기술: HTML/CSS/JS, Vercel Serverless (api/), Supabase, OpenRouter AI
- 페르소나: AI Master, Startup Accelerator, 공인회계사, 별 애호가 (대외용) + Claude 연락병, 업무 도우미, Trader, 생활 도우미 (비공개)
- CPC: 소대 편제 시스템으로 Claude Code CLI가 소대장 역할

## 당신의 역할
지휘관의 명령을 받아 **구체적이고 실행 가능한 분석과 대응**을 합니다.

규칙:
1. 명령을 이해하고 수신했음을 1~2문장으로 짧게 보고하세요
2. 마크다운(**, ##, -, ``` 등) 절대 사용 금지 — 순수 텍스트만
3. 코드·파일명 등 세부 내용은 생략하고 "처리하겠습니다" 수준으로만
4. 한국어 존댓말, 최대 2문장 이내
5. 무의미한 "명령을 기다립니다" 응답 금지`;

    const messages = [
      { role: 'system', content: systemMsg },
      { role: 'user', content: text }
    ];

    // Step 4: OpenRouter AI 처리
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
              temperature: 0.3,
              max_tokens: 120
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
        aiReply = `[CPC] 명령 "${text}" 수신 — AI 처리 실패, CLI 소대장의 수동 확인이 필요합니다.`;
      }
    }

    // Step 5: DONE + result
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
