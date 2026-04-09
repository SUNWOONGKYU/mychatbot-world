/**
 * Shared utilities for Chat API endpoints
 * Used by: api/chat.js, api/chat-stream.js
 *
 * Extracted to eliminate code duplication (DRY principle).
 * @module _shared
 */

// TODO: xsai SDK 통합 — chat.js/chat-stream.js에서 getOptimalModel() 연동 시 사용 예정
// import { generateText } from '@xsai/generate-text'; // 패키지 deprecated, 연동 시 대체 SDK 사용

// ─── API Key Rotation + Cooldown ───
// Note: On Vercel serverless, KEY_COOLDOWNS resets on cold start.
// Warm instances (majority of requests) benefit from cooldown.
// Cross-invocation persistence would require external storage (Vercel KV, Redis).
const KEY_COOLDOWNS = {};
const COOLDOWN_MS = 30000;

/**
 * Returns API keys sorted by availability (cooled-down keys last).
 * Reads from OPENROUTER_API_KEY env var (comma-separated).
 * @returns {string[]} Sorted API keys with available keys first
 */
export function getAvailableKeys() {
  const keys = (process.env.OPENROUTER_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  const now = Date.now();
  return keys.sort((a, b) => {
    const aCool = KEY_COOLDOWNS[a] && (now - KEY_COOLDOWNS[a] < COOLDOWN_MS) ? 1 : 0;
    const bCool = KEY_COOLDOWNS[b] && (now - KEY_COOLDOWNS[b] < COOLDOWN_MS) ? 1 : 0;
    return aCool - bCool;
  });
}

/**
 * Marks an API key as failed, triggering a 30-second cooldown.
 * @param {string} key - The API key to mark as failed
 */
export function markKeyFailed(key) {
  KEY_COOLDOWNS[key] = Date.now();
}

// ─── Context Overflow Detection + Compaction ───

/**
 * Detects context/token overflow from a 400 response by parsing the error body.
 * Only returns true for actual context/token limit errors, not other 400s.
 * @param {Response} resp - Fetch response to check
 * @returns {Promise<boolean>} True if the error is a context overflow
 */
export async function isContextOverflow(resp) {
  if (!resp || resp.ok) return false;
  if (resp.status !== 400) return false;
  try {
    const body = await resp.clone().json();
    const msg = (body?.error?.message || body?.error?.code || body?.message || '').toLowerCase();
    return msg.includes('context') || msg.includes('token') || msg.includes('too long')
      || msg.includes('maximum') || msg.includes('exceed') || msg.includes('context_length');
  } catch {
    return false;
  }
}

/**
 * Compacts conversation history into a 3-sentence summary using AI.
 * Used when context overflow is detected to reduce token count.
 * @param {Array<{role: string, content: string}>} history - Conversation messages
 * @param {string} apiKey - OpenRouter API key
 * @returns {Promise<string>} Summary text, or empty string on failure
 */
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
  } catch (e) {
    console.warn('[compactHistory] failed:', e.message);
    return '';
  }
}

// ─── Skill System Prompt Builder (token budget) ───

/**
 * Builds a token-budgeted skill section for the system prompt.
 * Concatenates skill systemPrompts until the character limit is reached.
 * @param {Array<{name: string, systemPrompt: string}>} skills - Active skills
 * @param {number} [maxTokens=300] - Approximate token budget (1 token ≈ 2.5 chars)
 * @returns {string} Formatted skill section or empty string
 */
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

/**
 * Builds a token-budgeted FAQ section for the system prompt.
 * Includes Q&A pairs until the character limit is reached.
 * @param {Array<{q: string, a: string}>} faqs - FAQ pairs
 * @param {number} [maxTokens=500] - Approximate token budget
 * @returns {string} Formatted FAQ section or empty string
 */
export function buildFaqSection(faqs, maxTokens = 500) {
  if (!faqs || faqs.length === 0) return '';
  const charLimit = maxTokens * 2.5;
  let section = '';
  let charCount = 0;
  for (const f of faqs) {
    const line = `Q: ${f.q}\nA: ${f.a}\n`;
    if (charCount + line.length > charLimit) break;
    section += line;
    charCount += line.length;
  }
  return section;
}

// ─── DM Security Policy ───

/**
 * Checks DM access policy for a bot.
 * Supports 3 modes: 'public' (default), 'allowlist', 'pairing'.
 * @param {Object} botConfig - Bot configuration with dmPolicy, allowedUsers, pairingCode
 * @param {string} userId - User identifier (email or 'anon')
 * @returns {{blocked: boolean, reply?: string}} Access decision
 */
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

/**
 * Builds the full system message for AI chat, including persona, FAQs, skills, and rules.
 * Applies persona-specific role rules (CPC direct connect, avatar, default).
 * @param {Object} botConfig - Full bot configuration
 * @param {string} [botConfig.botName] - Bot display name
 * @param {string} [botConfig.personaName] - Active persona name
 * @param {string} [botConfig.personaCategory] - Persona category ('avatar', etc.)
 * @param {string} [botConfig.personality] - Personality description
 * @param {string} [botConfig.tone] - Tone description
 * @param {string} [botConfig.userTitle] - How to address the user
 * @param {Array} [botConfig.faqs] - FAQ pairs
 * @param {Array} [botConfig.skills] - Active skills with systemPrompt
 * @returns {string} Complete system message for AI model
 */
export function buildSystemMessage(botConfig) {
  const personaName = botConfig?.personaName || '';
  const personaCategory = botConfig?.personaCategory || '';
  const userTitle = botConfig?.userTitle || '';
  // v22.3: CPC 직접 연결 페르소나 (Claude Code / Trader) — AI 중간 처리 없이 소대장에게 직접 전달
  const isCpcDirect = personaName === 'Claude Code' || personaName === 'Trader';

  let roleRules;
  if (isCpcDirect) {
    roleRules = `- 사용자를 "${userTitle || '지휘관님'}"이라고 부르세요
- CPC 소대장은 "소대장"이라고만 부르세요 (님 붙이지 마세요)
- 이 페르소나는 CPC 소대장과 직접 연결됩니다. 메시지는 소대장에게 자동으로 전달됩니다.
- 소대장이 처리 중임을 간단히 안내하세요.`;
  } else if (personaCategory === 'avatar') {
    roleRules = `- 사용자를 "${userTitle || '고객님'}"이라고 부르세요
- "지휘관", "소대장", "연락병" 등 군사 용어를 절대 사용하지 마세요`;
  } else {
    roleRules = `- 사용자를 "${userTitle || '님'}"이라고 부르세요
- "지휘관", "소대장", "연락병" 등 군사 용어를 절대 사용하지 마세요`;
  }

  const skillSection = buildSkillSection(botConfig?.skills || []);
  const faqSection = buildFaqSection(botConfig?.faqs || []);

  // CPC 소대 현황 (CPC 직접 연결 페르소나에게만)
  let cpcSection = '';
  if (isCpcDirect && botConfig?.cpcPlatoons?.length) {
    const lines = botConfig.cpcPlatoons.map(p => {
      return `  - ${p.name}: 상태=${p.status}`;
    });
    cpcSection = `\n[소대 현황]\n${lines.join('\n')}\n`;
  }

  return `당신은 "${botConfig?.botName || 'AI 챗봇'}"의 "${personaName || 'AI 어시스턴트'}" 페르소나입니다.
성격: ${botConfig?.personality || '친절하고 전문적'}
어조: ${botConfig?.tone || '편안하고 자연스러운 어조'}

다음 예시 FAQ를 참고하여 답변하세요:
${faqSection}
${skillSection}${cpcSection}
규칙:
- 항상 캐릭터를 유지하세요
- 한국어로 답변하세요
- 간결하고 도움이 되는 답변을 하세요
- 이모지를 적절히 사용하세요
${roleRules}`;
}

/**
 * AI model priority stack for chat completions.
 * Order: cost-effective first, quality fallbacks after.
 * @type {string[]}
 */
export const MODEL_STACK = [
  'google/gemini-2.5-flash',
  'openai/gpt-4o',
  'anthropic/claude-sonnet-4-6',
  'deepseek/deepseek-chat',
];

/**
 * Selects the optimal model based on emotion intensity and free-model preference.
 * Free models are prioritized when preferFree is true.
 * Stronger emotions (angry, sad) escalate to higher-quality paid models.
 * @param {string} [emotion='neutral'] - Detected user emotion
 * @param {boolean} [preferFree=true] - Whether to prefer free models first
 * @returns {string} Model identifier from MODEL_STACK
 */
export function getOptimalModel(emotion = 'neutral', preferFree = true) {
  // emotion에 따른 모델 선택 로직
  // 'angry', 'sad' 등 감정이 강할수록 품질 높은 모델
  // preferFree가 true이면 무료 모델 우선
  const freeModels = MODEL_STACK.filter(m => m.includes(':free'));
  const paidModels = MODEL_STACK.filter(m => !m.includes(':free'));

  if (preferFree && freeModels.length > 0) {
    return freeModels[0]; // 무료 먼저
  }

  // 감정 강도에 따른 모델 선택
  const emotionWeights = { angry: 3, sad: 2, happy: 1, neutral: 0 };
  const weight = emotionWeights[emotion] || 0;
  return weight >= 2 ? paidModels[1] || paidModels[0] : paidModels[0] || freeModels[0];
}

// ─── Obsidian RAG Context Injection ───

/**
 * Fetches relevant Obsidian knowledge chunks via pgvector similarity search.
 * Returns empty array if Supabase not configured or no results.
 * @param {string} query - User message to search against
 * @param {string} userId - Owner of the knowledge base
 * @param {string} personaId - Persona scope for knowledge base
 * @param {number} [topK=3] - Number of chunks to retrieve
 * @returns {Promise<Array<{content: string, doc_id: string}>>}
 */
export async function fetchRagChunks(query, userId, personaId, topK = 3) {
  // obsidian.js의 createEmbedding/searchObsidian과 동일 로직 (서버리스 함수 간 직접 import 불가)
  // TODO(S4): CORS Access-Control-Allow-Origin을 프로덕션 도메인으로 제한 (현재 '*')
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').split(',')[0].trim();
  const EMBEDDING_MODEL = 'openai/text-embedding-3-small';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENROUTER_API_KEY || !userId) {
    return [];
  }

  try {
    // 1. 쿼리 임베딩 생성 (모델명: EMBEDDING_MODEL과 obsidian.js 동기화 필수)
    const embResp = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: query.slice(0, 8000)  // obsidian.js createEmbedding()과 동일 제한
      })
    });

    if (!embResp.ok) return [];
    const embData = await embResp.json();
    const embedding = embData.data?.[0]?.embedding;
    if (!embedding) return [];

    // 2. pgvector 코사인 유사도 검색
    const searchBody = {
      query_embedding: embedding,
      match_user_id: userId,
      match_count: topK
    };
    // personaId가 있으면 페르소나 범위 검색, 없으면 사용자 전체 KB 검색
    if (personaId) searchBody.match_persona_id = personaId;

    const searchResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_obsidian_chunks`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchBody)
    });

    if (!searchResp.ok) return [];
    const chunks = await searchResp.json();
    return Array.isArray(chunks) ? chunks : [];
  } catch {
    return [];
  }
}

/**
 * Builds a RAG context section from Obsidian knowledge chunks.
 * Returns empty string if no chunks available.
 * @param {Array<{content: string}>} chunks - Retrieved knowledge chunks
 * @param {number} [maxChars=800] - Max character budget for context
 * @returns {string} Formatted RAG section for system message
 */
export function buildRagSection(chunks, maxChars = 800) {
  if (!chunks || chunks.length === 0) return '';

  let section = '\n[관련 지식베이스]\n';
  let charCount = section.length;

  for (const chunk of chunks) {
    const text = (chunk.content || '').trim();
    if (!text) continue;
    const entry = text.slice(0, 400) + (text.length > 400 ? '...' : '') + '\n---\n';
    if (charCount + entry.length > maxChars) break;
    section += entry;
    charCount += entry.length;
  }

  return section === '\n[관련 지식베이스]\n' ? '' : section;
}
