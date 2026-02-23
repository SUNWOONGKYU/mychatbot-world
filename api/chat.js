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
 *
 * Shared logic lives in api/_shared.js to avoid duplication with chat-stream.js.
 */
import {
  getAvailableKeys, markKeyFailed, buildSystemMessage,
  isContextOverflow, compactHistory, checkDmPolicy, MODEL_STACK
} from './_shared.js';

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

    // DM security policy check
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

    const systemMsg = buildSystemMessage(botConfig);

    let messages = [
      { role: 'system', content: systemMsg },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    let contextCompacted = false;

    // Double loop: API keys × model stack
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
            // Context overflow → compact history and retry
            if (!contextCompacted && await isContextOverflow(resp)) {
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
                continue;
              }
            }

            console.warn(`[Chat API] ${model} failed: ${resp.status}`);
            if (resp.status === 401 || resp.status === 429) {
              markKeyFailed(apiKey);
              break; // Skip remaining models for this key
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
