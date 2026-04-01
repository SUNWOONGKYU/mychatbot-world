/**
 * @task S2BI1 - 멀티 AI 라우팅 (OpenRouter) 고도화
 * @description AI 채팅 API Route Handler
 * - POST /api/ai/chat
 * - 감성슬라이더 + 비용슬라이더 → ai-router로 모델 자동 선택
 * - OpenRouter 경유 Chat Completion (스트리밍/비스트리밍 모두 지원)
 * - 스트리밍: text/event-stream (SSE), 비스트리밍: application/json
 */

import { NextRequest, NextResponse } from 'next/server';

import { selectModel } from '@/lib/ai-router';
import {
  chatCompletion,
  chatCompletionStream,
  toSSEStream,
} from '@/lib/openrouter-client';

import type {
  AIChatRequestBody,
  AIChatResponse,
} from '@/types/ai';

// ============================
// 상수
// ============================

/** 기본 감성 슬라이더 값 (균형형) */
const DEFAULT_EMOTION_SLIDER = 50;

/** 기본 비용 티어 */
const DEFAULT_COST_TIER = 'standard' as const;

/** 기본 스트리밍 여부 */
const DEFAULT_STREAM = true;

/** 기본 최대 토큰 */
const DEFAULT_MAX_TOKENS = 2048;

// ============================
// POST Handler
// ============================

/**
 * POST /api/ai/chat
 *
 * 요청 바디 (AIChatRequestBody):
 * ```json
 * {
 *   "messages": [{ "role": "user", "content": "안녕!" }],
 *   "emotionSlider": 75,
 *   "costTier": "standard",
 *   "preferredProvider": "anthropic",
 *   "stream": true,
 *   "maxTokens": 2048,
 *   "temperature": 0.7
 * }
 * ```
 *
 * 스트리밍 응답 (stream: true):
 * - Content-Type: text/event-stream
 * - 이벤트: model_selected → content (N회) → done
 *
 * 비스트리밍 응답 (stream: false):
 * - Content-Type: application/json
 * - 바디: AIChatResponse
 */
export async function POST(request: NextRequest): Promise<Response> {
  // ── 1. 요청 파싱 ────────────────────────────────────────────────
  let body: AIChatRequestBody;

  try {
    body = (await request.json()) as AIChatRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const {
    messages,
    emotionSlider = DEFAULT_EMOTION_SLIDER,
    costTier = DEFAULT_COST_TIER,
    preferredProvider,
    stream = DEFAULT_STREAM,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature,
  } = body;

  // ── 2. 필수 파라미터 검증 ────────────────────────────────────────
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'messages array is required and must not be empty' },
      { status: 400 }
    );
  }

  if (
    typeof emotionSlider !== 'number' ||
    emotionSlider < 1 ||
    emotionSlider > 100
  ) {
    return NextResponse.json(
      { error: 'emotionSlider must be a number between 1 and 100' },
      { status: 400 }
    );
  }

  if (!['economy', 'standard', 'premium'].includes(costTier)) {
    return NextResponse.json(
      { error: 'costTier must be one of: economy, standard, premium' },
      { status: 400 }
    );
  }

  // ── 3. 모델 선택 ─────────────────────────────────────────────────
  let routerResult;
  try {
    routerResult = selectModel({ emotionSlider, costTier, preferredProvider });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Model selection failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { selectedModel } = routerResult;

  // ── 4. 스트리밍 응답 ─────────────────────────────────────────────
  if (stream) {
    let contentStream: ReadableStream<string>;

    try {
      contentStream = await chatCompletionStream(
        selectedModel.id,
        messages,
        { max_tokens: maxTokens, temperature }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stream initialization failed';
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const sseStream = toSSEStream(contentStream, {
      id: selectedModel.id,
      name: selectedModel.name,
    });

    return new Response(sseStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        // 모델 정보를 응답 헤더에도 포함 (클라이언트가 즉시 확인 가능)
        'X-AI-Model-Id': selectedModel.id,
        'X-AI-Model-Name': selectedModel.name,
        'X-AI-Emotion-Tier': routerResult.emotionTier,
      },
    });
  }

  // ── 5. 비스트리밍 응답 ───────────────────────────────────────────
  let openRouterResponse;
  try {
    openRouterResponse = await chatCompletion(
      selectedModel.id,
      messages,
      { max_tokens: maxTokens, temperature }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chat completion failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const content = openRouterResponse.choices[0]?.message?.content ?? '';

  const responseData: AIChatResponse = {
    content,
    modelId: selectedModel.id,
    modelName: selectedModel.name,
    emotionTier: routerResult.emotionTier,
    usage: openRouterResponse.usage
      ? {
          promptTokens: openRouterResponse.usage.prompt_tokens,
          completionTokens: openRouterResponse.usage.completion_tokens,
          totalTokens: openRouterResponse.usage.total_tokens,
        }
      : undefined,
  };

  return NextResponse.json(responseData, {
    status: 200,
    headers: {
      'X-AI-Model-Id': selectedModel.id,
      'X-AI-Emotion-Tier': routerResult.emotionTier,
    },
  });
}

// ============================
// OPTIONS Handler (CORS)
// ============================

/**
 * OPTIONS /api/ai/chat
 * CORS preflight 대응
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
