/**
 * Chat Stream API - SSE (Server-Sent Events) Endpoint
 * POST /api/chat-stream
 *
 * Streams AI responses in real-time using OpenRouter's stream:true option.
 * Falls through model stack + key rotation with cooldown.
 *
 * Shared logic lives in api/_shared.js to avoid duplication with chat.js.
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

  const { message, botConfig, history = [], userId = 'anon' } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  // DM security policy check (must match chat.js behavior)
  const dmCheck = checkDmPolicy(botConfig, userId);
  if (dmCheck.blocked) {
    return res.status(200).json({ reply: dmCheck.reply, model: 'system' });
  }

  const apiKeys = getAvailableKeys();
  if (apiKeys.length === 0) {
    return res.status(200).json({ error: 'No API keys configured' });
  }

  const systemMsg = buildSystemMessage(botConfig);

  let messages = [
    { role: 'system', content: systemMsg },
    ...history.slice(-10),
    { role: 'user', content: message }
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
          if (!contextCompacted && await isContextOverflow(resp)) {
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
