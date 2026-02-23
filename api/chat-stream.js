/**
 * Chat Stream API - SSE (Server-Sent Events) Endpoint
 * POST /api/chat-stream
 *
 * Streams AI responses in real-time using OpenRouter's stream:true option.
 * Falls through model stack + key rotation with cooldown.
 */

// Shared key cooldown state (Vercel serverless = per-instance)
const KEY_COOLDOWNS = {};
const COOLDOWN_MS = 30000;

function getAvailableKeys() {
  const keys = (process.env.OPENROUTER_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  const now = Date.now();
  return keys.sort((a, b) => {
    const aCool = KEY_COOLDOWNS[a] && (now - KEY_COOLDOWNS[a] < COOLDOWN_MS) ? 1 : 0;
    const bCool = KEY_COOLDOWNS[b] && (now - KEY_COOLDOWNS[b] < COOLDOWN_MS) ? 1 : 0;
    return aCool - bCool;
  });
}

function markKeyFailed(key) {
  KEY_COOLDOWNS[key] = Date.now();
}

// Skill system prompt builder (shared with chat.js logic)
function buildSkillSection(skills, maxTokens = 300) {
  if (!skills || skills.length === 0) return '';
  const charLimit = maxTokens * 2.5;
  let section = '\n[활성 스킬]\n';
  let charCount = section.length;
  for (const s of skills) {
    const prompt = s.systemPrompt || '';
    if (!prompt) continue;
    const line = `- ${s.name}: ${prompt}\n`;
    if (charCount + line.length > charLimit) break;
    section += line;
    charCount += line.length;
  }
  return section;
}

// Context overflow detection
function isContextOverflow(statusCode) {
  return statusCode === 400;
}

async function compactHistory(history, apiKey) {
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: '이전 대화를 3문장으로 요약하세요. 핵심 맥락만 남기세요.' },
          ...history,
          { role: 'user', content: '위 대화를 요약해주세요.' }
        ],
        max_tokens: 150
      })
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  } catch { return ''; }
}

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

  const { message, botConfig, history = [] } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  const apiKeys = getAvailableKeys();
  if (apiKeys.length === 0) {
    return res.status(200).json({ error: 'No API keys configured' });
  }

  // Build system message (same logic as chat.js)
  const personaName = botConfig?.personaName || '';
  const personaCategory = botConfig?.personaCategory || '';
  const userTitle = botConfig?.userTitle || '';
  const isCpcLiaison = personaName === 'Claude 연락병';

  let roleRules;
  if (isCpcLiaison) {
    roleRules = `- 사용자를 "${userTitle || '지휘관님'}"이라고 부르세요
- CPC 소대장은 "소대장"이라고만 부르세요 (님 붙이지 마세요)
- 명령 접수 시 "CPC 연락병에게 전달했습니다"라고 보고하세요
- CPC로 전달하는 메시지에는 직접 답변하지 마세요. "__SILENT__"만 반환하세요.`;
  } else if (personaCategory === 'avatar') {
    roleRules = `- 사용자를 "${userTitle || '고객님'}"이라고 부르세요
- "지휘관", "소대장", "연락병" 등 군사 용어를 절대 사용하지 마세요`;
  } else {
    roleRules = `- 사용자를 "${userTitle || '님'}"이라고 부르세요
- "지휘관", "소대장", "연락병" 등 군사 용어를 절대 사용하지 마세요`;
  }

  const skillSection = buildSkillSection(botConfig?.skills || []);

  const systemMsg = `당신은 "${botConfig?.botName || 'AI 챗봇'}"의 "${personaName || 'AI 어시스턴트'}" 페르소나입니다.
성격: ${botConfig?.personality || '친절하고 전문적'}
어조: ${botConfig?.tone || '편안하고 자연스러운 어조'}

다음 예시 FAQ를 참고하여 답변하세요:
${(botConfig?.faqs || []).map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n')}
${skillSection}
규칙:
- 항상 캐릭터를 유지하세요
- 한국어로 답변하세요
- 간결하고 도움이 되는 답변을 하세요
- 이모지를 적절히 사용하세요
${roleRules}`;

  let messages = [
    { role: 'system', content: systemMsg },
    ...history.slice(-10),
    { role: 'user', content: message }
  ];

  const MODEL_STACK = [
    'google/gemini-2.5-flash',
    'openai/gpt-4o',
    'anthropic/claude-sonnet-4.5',
    'deepseek/deepseek-chat',
  ];

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  let contextCompacted = false;

  for (const apiKey of apiKeys) {
    for (const model of MODEL_STACK) {
      try {
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.8,
            max_tokens: 500,
            stream: true
          })
        });

        if (!resp.ok) {
          if (!contextCompacted && isContextOverflow(resp.status)) {
            const summary = await compactHistory(history.slice(-10), apiKey);
            if (summary) {
              messages = [
                { role: 'system', content: systemMsg },
                { role: 'system', content: `[이전 대화 요약] ${summary}` },
                ...history.slice(-3),
                { role: 'user', content: message }
              ];
              contextCompacted = true;
              continue;
            }
          }
          if (resp.status === 401 || resp.status === 429) {
            markKeyFailed(apiKey);
            break;
          }
          continue;
        }

        // Stream the response
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let hasContent = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') continue;

            try {
              const parsed = JSON.parse(raw);
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent) {
                hasContent = true;
                res.write(`data: ${JSON.stringify({ text: deltaContent })}\n\n`);
              }
            } catch { /* skip malformed JSON */ }
          }
        }

        if (hasContent) {
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }
        // Empty stream — try next model
        continue;

      } catch (e) {
        console.warn(`[Chat Stream] ${model} error:`, e.message);
        if (e.message?.includes('ECONNREFUSED') || e.message?.includes('timeout')) {
          markKeyFailed(apiKey);
          break;
        }
      }
    }
  }

  // All models failed — send error as SSE
  res.write(`data: ${JSON.stringify({ text: '죄송합니다. 잠시 후 다시 시도해주세요.' })}\n\n`);
  res.write('data: [DONE]\n\n');
  res.end();
}
