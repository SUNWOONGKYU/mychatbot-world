/**
 * Shared utilities for Chat API endpoints
 * Used by: api/chat.js, api/chat-stream.js
 *
 * Extracted to eliminate code duplication (DRY principle).
 */

// ─── API Key Rotation + Cooldown ───
// Note: On Vercel serverless, KEY_COOLDOWNS resets on cold start.
// Warm instances (majority of requests) benefit from cooldown.
// Cross-invocation persistence would require external storage (Vercel KV, Redis).
const KEY_COOLDOWNS = {};
const COOLDOWN_MS = 30000;

export function getAvailableKeys() {
  const keys = (process.env.OPENROUTER_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  const now = Date.now();
  return keys.sort((a, b) => {
    const aCool = KEY_COOLDOWNS[a] && (now - KEY_COOLDOWNS[a] < COOLDOWN_MS) ? 1 : 0;
    const bCool = KEY_COOLDOWNS[b] && (now - KEY_COOLDOWNS[b] < COOLDOWN_MS) ? 1 : 0;
    return aCool - bCool;
  });
}

export function markKeyFailed(key) {
  KEY_COOLDOWNS[key] = Date.now();
}

// ─── Context Overflow Detection + Compaction ───
export function isContextOverflow(error, statusCode) {
  if (statusCode === 400) return true;
  const msg = (error?.message || '').toLowerCase();
  return msg.includes('context') || msg.includes('token') || msg.includes('too long');
}

export async function compactHistory(history, apiKey) {
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
export const SILENT_REPLY_TOKEN = '__SILENT__';

export function buildSkillSection(skills, maxTokens = 300) {
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

// ─── DM Security Policy ───
export function checkDmPolicy(botConfig, userId) {
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

// ─── System Message Builder ───
export function buildSystemMessage(botConfig) {
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

  const skillSection = buildSkillSection(botConfig?.skills || []);

  return `당신은 "${botConfig?.botName || 'AI 챗봇'}"의 "${personaName || 'AI 어시스턴트'}" 페르소나입니다.
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
}

// ─── Model Stack ───
export const MODEL_STACK = [
  'google/gemini-2.5-flash',
  'openai/gpt-4o',
  'anthropic/claude-sonnet-4.5',
  'deepseek/deepseek-chat',
];
