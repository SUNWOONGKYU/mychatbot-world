/**
 * @task S2BA2
 * @description POST /api/chat — 비스트리밍 대화 API
 *
 * 요청: { botId, message, emotionLevel, conversationId? }
 * 응답: { reply, conversationId, messageId, modelId, modelName, emotionTier, ragSource }
 *
 * 처리 순서:
 * 1. Supabase Auth 세션 확인
 * 2. personas 테이블에서 페르소나 로딩 (캐싱 적용)
 * 3. emotionLevel 기반 AI 모델 선택 (S2BI1 ai-router)
 * 4. conversationId 없으면 새 conversation 레코드 생성
 * 5. Wiki-First RAG: 위키 검색 → 히트 시 위키 컨텍스트 사용, 미히트 시 kb_embeddings 폴백 (S5BI1)
 * 6. OpenRouter API 호출 (비스트리밍) + 컨텍스트 오버플로 자동 압축
 * 7. messages 테이블에 user/assistant 메시지 저장
 * 8. 비동기 wiki accumulate 호출 (복리 축적, S5BI1)
 * 9. JSON 응답 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { selectModel } from '@/lib/ai-router';
import { loadPersona } from '@/lib/persona-loader';
import type { AIModelId, OpenRouterMessage } from '@/types/ai';

// ============================
// 타입 정의
// ============================

/**
 * POST /api/chat 요청 바디
 */
interface ChatRequestBody {
  /** 봇 ID */
  botId: string;
  /** 사용자 메시지 */
  message: string;
  /** 감성 슬라이더 값 (1~100) */
  emotionLevel: number;
  /** 기존 대화 ID (없으면 새로 생성) */
  conversationId?: string;
  /** 비용 티어 (기본: 'standard') */
  costTier?: 'economy' | 'standard' | 'premium';
}

/**
 * POST /api/chat 응답 바디
 */
interface ChatResponseBody {
  /** AI 응답 텍스트 */
  reply: string;
  /** 대화 ID */
  conversationId: string;
  /** 저장된 assistant 메시지 ID */
  messageId: string;
  /** 사용된 모델 ID */
  modelId: string;
  /** 모델 표시 이름 */
  modelName: string;
  /** 감성 티어 */
  emotionTier: string;
  /** RAG 소스 (wiki | chunk | none) — S5BI1 */
  ragSource?: 'wiki' | 'chunk' | 'faq' | 'none';
}

// ============================
// Supabase 서버사이드 클라이언트
// ============================

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// ============================
// 대화 히스토리 로드 (최근 N개)
// ============================

/**
 * conversations 테이블에서 최근 메시지 히스토리 로드
 *
 * @param conversationId - 대화 ID
 * @param limit - 최대 메시지 수 (기본 20)
 * @returns OpenRouterMessage 배열 (오래된 순)
 */
async function loadConversationHistory(
  conversationId: string,
  limit = 20
): Promise<OpenRouterMessage[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  // 내림차순 조회 → 오름차순으로 반전
  return (data as { role: string; content: string }[])
    .reverse()
    .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
}

// ============================
// 대화/메시지 DB 저장
// ============================

/**
 * 새 conversation 레코드 생성
 *
 * @param userId - 사용자 ID
 * @param botId - 봇 ID
 * @returns 생성된 conversation ID
 */
async function createConversation(
  userId: string,
  botId: string
): Promise<string> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, bot_id: botId })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create conversation: ${error?.message}`);
  }

  return (data as { id: string }).id;
}

/**
 * messages 테이블에 메시지 저장
 *
 * @param conversationId - 대화 ID
 * @param role - 'user' | 'assistant'
 * @param content - 메시지 내용
 * @returns 저장된 메시지 ID
 */
async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<string> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role, content })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to save message: ${error?.message}`);
  }

  return (data as { id: string }).id;
}

// ============================
// 사용자 인증 확인
// ============================

/**
 * Authorization 헤더 또는 쿠키에서 사용자 ID 추출
 * 인증 실패 시 null 반환
 */
async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const supabase = getSupabaseServer();
    const authHeader = req.headers.get('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) return data.user.id;
    }

    // 쿠키 기반 세션 시도
    const accessToken = req.cookies.get('sb-access-token')?.value;
    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (!error && data.user) return data.user.id;
    }

    return null;
  } catch {
    return null;
  }
}

// ============================
// RAG: 쿼리 임베딩 생성
// ============================

/**
 * OpenRouter embeddings API를 통해 텍스트를 벡터로 변환
 * 실패 시 null 반환 (graceful fallback — RAG 없이 계속 진행)
 */
async function generateQueryEmbedding(text: string): Promise<number[] | null> {
  const apiKey = (process.env.OPENROUTER_API_KEY ?? '').split(',')[0].trim();
  if (!apiKey) return null;

  try {
    const resp = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: text.slice(0, 8000),
      }),
    });

    if (!resp.ok) return null;
    const data = (await resp.json()) as { data?: Array<{ embedding: number[] }> };
    return data.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

// ============================
// Wiki-First RAG (S5BI1)
// ============================

/**
 * Wiki-First 검색: match_wiki_pages RPC로 위키 우선 검색
 * 히트 시 wiki content 반환, 미히트 시 null
 */
async function searchWiki(
  botId: string,
  queryEmbedding: number[]
): Promise<{ content: string; titles: string[] } | null> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.rpc('match_wiki_pages', {
      p_bot_id: botId,
      query_embedding: queryEmbedding,
      match_threshold: 0.75,
      match_count: 3,
    });

    if (error || !data || data.length === 0) return null;

    const titles: string[] = data.map((r: any) => r.title as string);
    const content = data
      .map((r: any) => `[위키: ${r.title}]\n${r.content}`)
      .join('\n\n');

    // view_count 비동기 업데이트 — raw SQL increment via RPC (실패해도 무시)
    const ids: string[] = data.map((r: any) => r.id as string);
    void supabase.rpc('increment_wiki_view_count', { page_ids: ids }).then(() => {});

    return { content, titles };
  } catch {
    return null;
  }
}

/**
 * FAQ 검색 (3단계 캐스케이드): match_faqs RPC로 의미 유사도 검색
 * Wiki/KB 미히트 시에만 호출. 히트 시 Q/A 컨텍스트 반환
 */
async function searchFaqs(
  botId: string,
  queryEmbedding: number[]
): Promise<{ content: string; items: Array<{ question: string; answer: string }> } | null> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.rpc('match_faqs', {
      p_bot_id: botId,
      query_embedding: queryEmbedding,
      match_threshold: 0.78,
      match_count: 2,
    });

    if (error || !data || data.length === 0) return null;

    const items = (data as Array<{ question: string; answer: string }>).map((r) => ({
      question: r.question,
      answer: r.answer,
    }));
    const content = items
      .map((it, i) => `[FAQ ${i + 1}]\nQ: ${it.question}\nA: ${it.answer}`)
      .join('\n\n');

    return { content, items };
  } catch {
    return null;
  }
}

/**
 * 답변 후 위키 accumulate 비동기 호출 (복리 축적)
 * 실패해도 메인 응답에 영향 없음
 */
export function triggerWikiAccumulate(
  botId: string,
  question: string,
  answer: string,
  appUrl: string,
  conversationId: string
): void {
  const url = `${appUrl}/api/wiki/accumulate`;
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bot_id: botId, question, answer, conversation_id: conversationId }),
  }).catch((e) => {
    console.warn('[chat/route] wiki accumulate failed:', (e as Error).message);
  });
}

// ============================
// Context Overflow 감지 + 압축
// ============================

/**
 * 400 응답 바디를 파싱하여 컨텍스트/토큰 한도 초과 여부 판단
 * 다른 400 오류(잘못된 파라미터 등)와 구분
 */
async function isContextOverflow(resp: Response): Promise<boolean> {
  if (!resp || resp.ok) return false;
  if (resp.status !== 400) return false;
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

/**
 * 이전 대화를 3문장으로 요약하여 히스토리 압축
 * 실패 시 빈 문자열 반환
 */
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
          {
            role: 'system',
            content: '이전 대화를 3문장으로 요약하세요. 핵심 맥락만 남기세요.',
          },
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
    console.warn('[compactHistory] failed:', (e as Error).message);
    return '';
  }
}

// ============================
// 멀티모델 재시도 래퍼
// ============================

// 모델 폴백 순서 (ai-router의 선택 모델이 1순위, 나머지는 폴백)
const FALLBACK_MODEL_STACK: AIModelId[] = [
  'anthropic/claude-haiku-4-5',
  'anthropic/claude-sonnet-4-5',
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
];

/**
 * OpenRouter API를 호출하고, 컨텍스트 오버플로 시 히스토리를 압축 후 재시도.
 * 1차 모델 실패 시 FALLBACK_MODEL_STACK에서 순서대로 재시도.
 *
 * @returns 응답 텍스트
 * @throws Error - 모든 폴백 소진 시
 */
async function chatCompletionWithFallback(
  primaryModelId: AIModelId,
  messages: OpenRouterMessage[],
  history: OpenRouterMessage[],
  systemPrompt: string
): Promise<{ reply: string; usedModel: string }> {
  const apiKey = (process.env.OPENROUTER_API_KEY ?? '').split(',')[0].trim();
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  // 1순위: ai-router가 선택한 모델 → 폴백 스택
  const modelsToTry: AIModelId[] = [
    primaryModelId,
    ...FALLBACK_MODEL_STACK.filter((m: any) => m !== primaryModelId),
  ];

  let currentMessages = messages;
  let contextCompacted = false;

  for (const model of modelsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      let resp: Response;
      try {
        resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
            'X-Title': process.env.NEXT_PUBLIC_APP_NAME ?? 'MyChatbot',
          },
          body: JSON.stringify({
            model,
            messages: currentMessages,
            temperature: 0.8,
            max_tokens: 500,
            stream: false,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (e) {
        clearTimeout(timeoutId);
        if (e instanceof Error && e.name === 'AbortError') {
          console.warn(`[chat/route] ${model} timeout (30s)`);
          throw new Error('AI_TIMEOUT');
        }
        throw e;
      }

      // 컨텍스트 오버플로 → 히스토리 압축 후 동일 모델 재시도
      if (!resp.ok && !contextCompacted && (await isContextOverflow(resp))) {
        console.warn(`[chat/route] Context overflow on ${model}, compacting history...`);
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

          // 압축 후 동일 모델 재시도
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), 30000);
          let retryResp: Response;
          try {
            retryResp = await fetch(
              'https://openrouter.ai/api/v1/chat/completions',
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model,
                  messages: currentMessages,
                  temperature: 0.8,
                  max_tokens: 500,
                  stream: false,
                }),
                signal: retryController.signal,
              }
            );
            clearTimeout(retryTimeoutId);
          } catch (e) {
            clearTimeout(retryTimeoutId);
            if (e instanceof Error && e.name === 'AbortError') {
              console.warn(`[chat/route] ${model} retry timeout (30s)`);
              throw new Error('AI_TIMEOUT');
            }
            throw e;
          }
          if (retryResp.ok) {
            const retryData = (await retryResp.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
              model?: string;
            };
            const reply = retryData.choices?.[0]?.message?.content;
            if (reply) return { reply, usedModel: retryData.model ?? model };
          }
        }
        continue; // 압축 실패 → 다음 모델
      }

      if (!resp.ok) {
        console.warn(`[chat/route] ${model} failed: ${resp.status}`);
        continue;
      }

      const data = (await resp.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        model?: string;
      };
      const reply = data.choices?.[0]?.message?.content;
      if (reply) return { reply, usedModel: data.model ?? model };
    } catch (e) {
      console.warn(`[chat/route] ${model} error:`, (e as Error).message);
    }
  }

  throw new Error('모든 AI 모델 호출 실패');
}

// ============================
// Route Handler
// ============================

/**
 * POST /api/chat
 * 비스트리밍 대화 API — 페르소나 로딩, 모델 선택, 응답 저장
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. 요청 파싱
    let body: ChatRequestBody;
    try {
      body = (await req.json()) as ChatRequestBody;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const {
      botId,
      message,
      emotionLevel,
      conversationId: inputConversationId,
      costTier = 'standard',
    } = body;

    // 2. 필수 파라미터 검증
    if (!botId || typeof botId !== 'string') {
      return NextResponse.json({ error: 'botId is required' }, { status: 400 });
    }
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }
    if (
      typeof emotionLevel !== 'number' ||
      emotionLevel < 1 ||
      emotionLevel > 100
    ) {
      return NextResponse.json(
        { error: 'emotionLevel must be a number between 1 and 100' },
        { status: 400 }
      );
    }

    // 3. 인증 확인
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 4. AI 모델 선택 (emotionLevel 기반) — 페르소나 로딩 전에 수행하여 병렬화 가능
    const routerResult = selectModel({ emotionSlider: emotionLevel, costTier });
    const { selectedModel, emotionTier } = routerResult;

    // 5. conversationId 확인 / 신규 생성 + 임베딩 생성 (병렬)
    let conversationId = inputConversationId ?? '';
    const [resolvedConversationId, queryEmbedding] = await Promise.all([
      conversationId
        ? Promise.resolve(conversationId)
        : createConversation(userId, botId),
      // RAG용 임베딩 생성 (실패해도 graceful fallback)
      generateQueryEmbedding(message),
    ]);
    conversationId = resolvedConversationId;

    // 6. RAG 캐스케이드: wiki → kb → faq → AI 자유 답변
    let wikiCtx: { content: string; titles: string[] } | null = null;
    let faqCtx: { content: string; items: Array<{ question: string; answer: string }> } | null = null;
    let ragSource: 'wiki' | 'chunk' | 'faq' | 'none' = 'none';

    if (queryEmbedding) {
      wikiCtx = await searchWiki(botId, queryEmbedding);
      if (wikiCtx) {
        ragSource = 'wiki';
      }
    }

    // 7. 페르소나 로딩
    // 위키 히트: kb_embeddings 스킵 (queryEmbedding 미전달)
    // 위키 미히트: queryEmbedding 전달 → persona-loader가 match_kb_documents 청크 검색
    const personaCtx = await loadPersona(
      botId,
      wikiCtx ? undefined : (queryEmbedding ?? undefined)
    );
    if (!wikiCtx && personaCtx.kbHitCount > 0) ragSource = 'chunk';

    // 7.5. FAQ 캐스케이드 (S5BA8): 위키·KB 모두 미히트 시 FAQ 의미 검색
    if (!wikiCtx && personaCtx.kbHitCount === 0 && queryEmbedding) {
      faqCtx = await searchFaqs(botId, queryEmbedding);
      if (faqCtx) ragSource = 'faq';
    }

    // 8. 대화 히스토리 로드
    const history = await loadConversationHistory(conversationId);

    // 9. 메시지 배열 조합 (system + wiki/faq context (if any) + history + current user message)
    const systemMessages: OpenRouterMessage[] = [
      { role: 'system', content: personaCtx.systemPrompt },
    ];
    if (wikiCtx) {
      systemMessages.push({
        role: 'system',
        content: `[지식베이스 — 위키]\n다음 위키 정보를 참고하여 답변하세요:\n\n${wikiCtx.content}`,
      });
    } else if (faqCtx) {
      systemMessages.push({
        role: 'system',
        content: `[지식베이스 — FAQ]\n다음 FAQ를 참고하여 답변하세요:\n\n${faqCtx.content}`,
      });
    }

    const messages: OpenRouterMessage[] = [
      ...systemMessages,
      ...history,
      { role: 'user', content: message },
    ];

    // 10. user 메시지 DB 저장
    await saveMessage(conversationId, 'user', message);

    // 11. OpenRouter API 호출 (비스트리밍) + 컨텍스트 오버플로 자동 압축 + 폴백
    const { reply, usedModel } = await chatCompletionWithFallback(
      selectedModel.id,
      messages,
      history,
      personaCtx.systemPrompt
    );

    // 12. assistant 메시지 DB 저장
    const messageId = await saveMessage(conversationId, 'assistant', reply);

    // 13. Wiki accumulate 비동기 호출 (복리 축적, 실패해도 무시)
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    triggerWikiAccumulate(botId, message, reply, appUrl, conversationId);

    // 14. JSON 응답 반환
    const responseBody: ChatResponseBody = {
      reply,
      conversationId,
      messageId,
      modelId: usedModel,          // 실제 사용된 모델 (폴백 시 달라질 수 있음)
      modelName: selectedModel.name, // 라우터가 의도한 모델명 (표시용)
      emotionTier,
      ragSource,
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/chat] Error:', message);

    if (message === 'AI_TIMEOUT') {
      return NextResponse.json({ error: 'AI 응답 시간이 초과되었습니다.' }, { status: 504 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
