/**
 * @task S2BA2
 * Chat API - Vercel Serverless Function
 * POST /api/chat
 *
 * Features:
 *  - Multi-key rotation + cooldown
 *  - Skill system prompt injection + token budget
 *  - Context overflow auto-compaction
 *  - Silent Reply token (__SILENT__)
 *  - DM security policy (public / allowlist / pairing)
 */

// ─── API Key Rotation + Cooldown ───
const KEY_COOLDOWNS = {};   // { key: failedAt timestamp }
const COOLDOWN_MS = 30000;  // 30초

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

// ─── Context Overflow Detection + Compaction ───
function isContextOverflow(error, statusCode) {
  if (statusCode === 400) return true;
  const msg = (error?.message || '').toLowerCase();
  return msg.includes('context') || msg.includes('token') || msg.includes('too long');
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
  } catch {
    return '';
  }
}

// ─── Skill System Prompt Builder (token budget) ───
const SILENT_REPLY_TOKEN = '__SILENT__';

function buildSkillSection(skills, maxTokens = 300) {
  if (!skills || skills.length === 0) return '';
  // 대략 1토큰 ≈ 2~3자 기준, maxTokens × 2.5자 제한
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

// ─── DM Security Policy ───
function checkDmPolicy(botConfig, userId) {
  const dmPolicy = botConfig?.dmPolicy || 'public';

  if (dmPolicy === 'allowlist') {
    const allowed = botConfig?.allowedUsers || [];
    if (!allowed.includes(userId)) {
      return { blocked: true, reply: '이 봇은 허용된 사용자만 이용할 수 있습니다.' };
    }
  }

  if (dmPolicy === 'pairing') {
    const pairingCode = botConfig?.pairingCode || '';
    const userCode = botConfig?.userPairingCode || '';
    if (!pairingCode || pairingCode !== userCode) {
      return { blocked: true, reply: '접근하려면 페어링 코드를 입력하세요.' };
    }
  }

  return { blocked: false };
}

// ─── Main Handler ───
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
    const { message, botConfig, history = [], userId = 'anon' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    // DM 보안 정책 체크
    const dmCheck = checkDmPolicy(botConfig, userId);
    if (dmCheck.blocked) {
      return res.status(200).json({ reply: dmCheck.reply, model: 'system' });
    }

    const apiKeys = getAvailableKeys();
    if (apiKeys.length === 0) {
      return res.status(200).json({
        reply: `"${message}"에 대해 답변 드리겠습니다. (API키가 설정되지 않아 기본 응답입니다)`,
        model: 'fallback'
      });
    }

    const personaName = botConfig?.personaName || '';
    const personaCategory = botConfig?.personaCategory || '';
    const userTitle = botConfig?.userTitle || '';
    const isCpcLiaison = personaName === 'Claude 연락병';

    let roleRules;
    if (isCpcLiaison) {
      roleRules = `- 사용자를 "${userTitle || '지휘관님'}"이라고 부르세요
- CPC 소대장은 "소대장"이라고만 부르세요 (님 붙이지 마세요)
- 명령 접수 시 "CPC 연락병에게 전달했습니다"라고 보고하세요
- CPC로 전달하는 메시지에는 직접 답변하지 마세요. "${SILENT_REPLY_TOKEN}"만 반환하세요.`;
    } else if (personaCategory === 'avatar') {
      roleRules = `- 사용자를 "${userTitle || '고객님'}"이라고 부르세요
- "지휘관", "소대장", "연락병" 등 군사 용어를 절대 사용하지 마세요`;
    } else {
      roleRules = `- 사용자를 "${userTitle || '님'}"이라고 부르세요
- "지휘관", "소대장", "연락병" 등 군사 용어를 절대 사용하지 마세요`;
    }

    // 스킬 시스템 프롬프트 주입
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

    // 통합 모델 스택 — 가성비 순서 (원소스 멀티유즈)
    const MODEL_STACK = [
      'google/gemini-2.5-flash',
      'openai/gpt-4o',
      'anthropic/claude-sonnet-4.5',
      'deepseek/deepseek-chat',
    ];

    let contextCompacted = false;

    // 이중 루프: API 키 × 모델 스택
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
              max_tokens: 500
            })
          });

          if (!resp.ok) {
            // 컨텍스트 오버플로우 → 압축 후 재시도
            if (!contextCompacted && isContextOverflow(null, resp.status)) {
              console.warn(`[Chat API] Context overflow detected, compacting history...`);
              const summary = await compactHistory(history.slice(-10), apiKey);
              if (summary) {
                messages = [
                  { role: 'system', content: systemMsg },
                  { role: 'system', content: `[이전 대화 요약] ${summary}` },
                  ...history.slice(-3),
                  { role: 'user', content: message }
                ];
                contextCompacted = true;
                continue; // 같은 모델로 재시도
              }
            }

            console.warn(`[Chat API] ${model} failed: ${resp.status}`);
            if (resp.status === 401 || resp.status === 429) {
              markKeyFailed(apiKey);
              break; // 이 키로는 다음 모델 시도 불필요
            }
            continue;
          }

          const data = await resp.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return res.status(200).json({ reply, model: data.model || model });
          }
        } catch (e) {
          console.warn(`[Chat API] ${model} error:`, e.message);
          if (e.message?.includes('ECONNREFUSED') || e.message?.includes('timeout')) {
            markKeyFailed(apiKey);
            break;
          }
        }
      }
    }

    res.status(200).json({ reply: '죄송합니다. 잠시 후 다시 시도해주세요.', model: 'fallback' });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
