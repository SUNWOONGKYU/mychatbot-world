/**
 * @task S2BI1 - 멀티 AI 라우팅 (OpenRouter) 고도화
 * @description OpenRouter API 클라이언트
 * - Chat Completion (비스트리밍)
 * - Chat Completion (스트리밍 / ReadableStream)
 * - 환경변수: OPENROUTER_API_KEY (필수)
 */

import type {
  AIModelId,
  OpenRouterChatRequest,
  OpenRouterChatResponse,
  OpenRouterMessage,
  OpenRouterStreamChunk,
} from '@/types/ai';

// ============================
// 상수
// ============================

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const APP_SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'MyChatbot';

// 네트워크 타임아웃 — OpenRouter 상류 스톨 시 무한 대기 방지
const OPENROUTER_TIMEOUT_MS = 60_000;        // 비스트리밍 (TTFB + 완료)
const OPENROUTER_STREAM_TIMEOUT_MS = 120_000; // 스트리밍 (전체 응답까지)

// ============================
// 내부 헬퍼
// ============================

/**
 * OPENROUTER_API_KEY 환경변수 읽기
 * @throws Error - 키가 없을 때
 */
function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      'OPENROUTER_API_KEY environment variable is not set. ' +
        'Add it to your .env.local file.'
    );
  }
  return key;
}

/**
 * OpenRouter 공통 헤더 생성
 */
function buildHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    // OpenRouter 권장 헤더 (랭킹/신원 식별용)
    'HTTP-Referer': APP_SITE_URL,
    'X-Title': APP_NAME,
  };
}

/**
 * OpenRouter 에러 응답 파싱
 */
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body?.error?.message ?? `HTTP ${response.status}: ${response.statusText}`;
  } catch {
    return `HTTP ${response.status}: ${response.statusText}`;
  }
}

// ============================
// 채팅 완성 (비스트리밍)
// ============================

/**
 * OpenRouter Chat Completion (비스트리밍)
 *
 * @param model - 사용할 AI 모델 ID
 * @param messages - 대화 메시지 배열
 * @param options - 추가 옵션 (max_tokens, temperature 등)
 * @returns OpenRouterChatResponse
 *
 * @throws Error - API 키 미설정 / 네트워크 오류 / API 에러
 *
 * @example
 * ```ts
 * const response = await chatCompletion(
 *   'anthropic/claude-sonnet-4-5',
 *   [{ role: 'user', content: '안녕하세요!' }]
 * );
 * console.log(response.choices[0].message.content);
 * ```
 */
export async function chatCompletion(
  model: AIModelId,
  messages: OpenRouterMessage[],
  options?: Partial<Pick<OpenRouterChatRequest, 'max_tokens' | 'temperature' | 'top_p'>>
): Promise<OpenRouterChatResponse> {
  const apiKey = getApiKey();

  const requestBody: OpenRouterChatRequest = {
    model,
    messages,
    stream: false,
    ...options,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: buildHeaders(apiKey),
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if ((err as Error).name === 'AbortError') {
      throw new Error(`OpenRouter API timeout after ${OPENROUTER_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorMsg = await parseErrorResponse(response);
    throw new Error(`OpenRouter API error: ${errorMsg}`);
  }

  const data = (await response.json()) as OpenRouterChatResponse;
  return data;
}

// ============================
// 채팅 완성 (스트리밍)
// ============================

/**
 * OpenRouter Chat Completion (스트리밍)
 * Server-Sent Events (SSE) 형식으로 토큰을 ReadableStream으로 반환
 *
 * @param model - 사용할 AI 모델 ID
 * @param messages - 대화 메시지 배열
 * @param options - 추가 옵션
 * @returns ReadableStream<string> — 각 chunk는 content 문자열
 *
 * @throws Error - API 키 미설정 / 네트워크 오류 / API 에러
 *
 * @example
 * ```ts
 * const stream = await chatCompletionStream(
 *   'anthropic/claude-sonnet-4-5',
 *   [{ role: 'user', content: '짧은 시를 써줘' }]
 * );
 *
 * // Next.js Route Handler에서 직접 반환 가능
 * return new Response(stream, {
 *   headers: { 'Content-Type': 'text/event-stream' }
 * });
 * ```
 */
export async function chatCompletionStream(
  model: AIModelId,
  messages: OpenRouterMessage[],
  options?: Partial<Pick<OpenRouterChatRequest, 'max_tokens' | 'temperature' | 'top_p'>>
): Promise<ReadableStream<string>> {
  const apiKey = getApiKey();

  const requestBody: OpenRouterChatRequest = {
    model,
    messages,
    stream: true,
    ...options,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_STREAM_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: buildHeaders(apiKey),
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if ((err as Error).name === 'AbortError') {
      throw new Error(`OpenRouter stream timeout after ${OPENROUTER_STREAM_TIMEOUT_MS}ms`);
    }
    throw err;
  }

  if (!response.ok) {
    clearTimeout(timeoutId);
    const errorMsg = await parseErrorResponse(response);
    throw new Error(`OpenRouter API error: ${errorMsg}`);
  }

  if (!response.body) {
    clearTimeout(timeoutId);
    throw new Error('OpenRouter API returned empty response body');
  }

  const upstreamReader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  return new ReadableStream<string>({
    async pull(controller) {
      while (true) {
        const { done, value } = await upstreamReader.read();

        if (done) {
          clearTimeout(timeoutId);
          controller.close();
          return;
        }

        const rawText = decoder.decode(value, { stream: true });

        // SSE 라인 파싱: "data: {...}" 형식
        const lines = rawText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        for (const line of lines) {
          // 스트림 종료 신호
          if (line === 'data: [DONE]') {
            clearTimeout(timeoutId);
            controller.close();
            return;
          }

          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6); // "data: " 제거

          try {
            const chunk = JSON.parse(jsonStr) as OpenRouterStreamChunk;
            const delta = chunk.choices?.[0]?.delta;
            const content = delta?.content;

            if (content) {
              controller.enqueue(content);
            }

            // finish_reason이 있으면 스트림 종료
            if (chunk.choices?.[0]?.finish_reason) {
              clearTimeout(timeoutId);
              controller.close();
              return;
            }
          } catch {
            // JSON 파싱 실패 시 무시하고 계속 진행
            continue;
          }
        }
      }
    },
    cancel() {
      clearTimeout(timeoutId);
      upstreamReader.cancel();
    },
  });
}

// ============================
// SSE 포맷 유틸리티
// ============================

/**
 * 텍스트를 SSE (Server-Sent Events) 형식으로 인코딩
 * Next.js Route Handler의 Response에 직접 사용 가능
 *
 * @param event - 이벤트 타입 (예: 'content', 'done', 'error')
 * @param data - 전송할 데이터 (문자열)
 * @returns SSE 형식 문자열
 */
export function formatSSE(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

/**
 * ReadableStream<string>을 SSE 형식의 ReadableStream<Uint8Array>로 변환
 * Next.js Route Handler에서 스트리밍 응답 전송 시 사용
 *
 * @param contentStream - 콘텐츠 청크 스트림
 * @param modelInfo - 응답 헤더에 포함할 모델 정보
 * @returns SSE 인코딩된 ReadableStream<Uint8Array>
 */
export function toSSEStream(
  contentStream: ReadableStream<string>,
  modelInfo: { id: AIModelId; name: string }
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const reader = contentStream.getReader();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      // 모델 선택 이벤트 전송
      controller.enqueue(
        encoder.encode(
          formatSSE(
            'model_selected',
            JSON.stringify({ modelId: modelInfo.id, modelName: modelInfo.name })
          )
        )
      );
    },
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        controller.enqueue(encoder.encode(formatSSE('done', '[DONE]')));
        controller.close();
        return;
      }

      controller.enqueue(
        encoder.encode(formatSSE('content', JSON.stringify({ text: value })))
      );
    },
    cancel() {
      reader.cancel();
    },
  });
}
