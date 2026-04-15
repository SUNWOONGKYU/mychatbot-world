/**
 * @task S5BA3
 * @description OpenRouter 완성(completion) 래퍼 — chat/route.ts에서 분리
 * 멀티모델 재시도, 컨텍스트 오버플로 압축 포함
 */

import type { AIModelId, OpenRouterMessage } from '@/types/ai';

const FALLBACK_MODEL_STACK: AIModelId[] = [
  'anthropic/claude-haiku-4-5',
  'anthropic/claude-sonnet-4-5',
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
];

async function isContextOverflow(resp: Response): Promise<boolean> {
  if (!resp || resp.ok || resp.status !== 400) return false;
  try {
    const body = (await resp.clone().json()) as {
      error?: { message?: string; code?: string };
      message?: string;
    };
    const msg = (
      body?.error?.message ??
      body?.error?.code ??
      body?.message ??
      ''
    ).toLowerCase();
    return (
      msg.includes('context') ||
      msg.includes('token') ||
      msg.includes('too long') ||
      msg.includes('maximum') ||
      msg.includes('exceed') ||
      msg.includes('context_length')
    );
  } catch {
    return false;
  }
}

async function compactHistory(
  history: OpenRouterMessage[],
  apiKey: string
): Promise<string> {
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: '이전 대화를 3문장으로 요약하세요. 핵심 맥락만 남기세요.' },
          ...history,
          { role: 'user', content: '위 대화를 요약해주세요.' },
        ],
        max_tokens: 150,
      }),
    });
    const data = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? '';
  } catch (e) {
    console.warn('[completion] compactHistory failed:', (e as Error).message);
    return '';
  }
}

function fetchWithTimeout(url: string, init: RequestInit, ms = 30000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(id));
}

/**
 * OpenRouter API 호출 — 컨텍스트 오버플로 자동 압축 + 폴백
 */
export async function chatCompletionWithFallback(
  primaryModelId: AIModelId,
  messages: OpenRouterMessage[],
  history: OpenRouterMessage[],
  systemPrompt: string
): Promise<{ reply: string; usedModel: string }> {
  const apiKey = (process.env.OPENROUTER_API_KEY ?? '').split(',')[0].trim();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const modelsToTry: AIModelId[] = [
    primaryModelId,
    ...FALLBACK_MODEL_STACK.filter((m) => m !== primaryModelId),
  ];

  let currentMessages = messages;
  let contextCompacted = false;

  const callHeaders = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    'X-Title': process.env.NEXT_PUBLIC_APP_NAME ?? 'MyChatbot',
  };

  for (const model of modelsToTry) {
    try {
      let resp: Response;
      try {
        resp = await fetchWithTimeout(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers: callHeaders,
            body: JSON.stringify({ model, messages: currentMessages, temperature: 0.8, max_tokens: 500, stream: false }),
          }
        );
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          console.warn(`[completion] ${model} timeout`);
          throw new Error('AI 응답 시간이 초과되었습니다.');
        }
        throw e;
      }

      // 컨텍스트 오버플로 → 압축 후 동일 모델 재시도
      if (!resp.ok && !contextCompacted && (await isContextOverflow(resp))) {
        const summary = await compactHistory(history, apiKey);
        if (summary) {
          const userMsg = currentMessages[currentMessages.length - 1];
          currentMessages = [
            { role: 'system', content: systemPrompt },
            { role: 'system', content: `[이전 대화 요약] ${summary}` },
            ...history.slice(-3),
            userMsg,
          ];
          contextCompacted = true;
          try {
            resp = await fetchWithTimeout(
              'https://openrouter.ai/api/v1/chat/completions',
              {
                method: 'POST',
                headers: callHeaders,
                body: JSON.stringify({ model, messages: currentMessages, temperature: 0.8, max_tokens: 500, stream: false }),
              }
            );
          } catch (e) {
            if (e instanceof Error && e.name === 'AbortError') throw new Error('AI 응답 시간이 초과되었습니다.');
            throw e;
          }
        }
        if (!resp.ok) continue;
      }

      if (!resp.ok) {
        console.warn(`[completion] ${model} failed: ${resp.status}`);
        continue;
      }

      const data = (await resp.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        model?: string;
      };
      const reply = data.choices?.[0]?.message?.content;
      if (reply) return { reply, usedModel: data.model ?? model };
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('초과')) throw e;
      console.warn(`[completion] ${model} error:`, msg);
    }
  }

  throw new Error('모든 AI 모델 호출 실패');
}
