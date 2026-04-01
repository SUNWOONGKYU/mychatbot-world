/**
 * @task S2BA2
 * @description POST /api/chat — 비스트리밍 대화 API
 *
 * 요청: { botId, message, emotionLevel, conversationId? }
 * 응답: { reply, conversationId, messageId, modelId, modelName, emotionTier }
 *
 * 처리 순서:
 * 1. Supabase Auth 세션 확인
 * 2. personas 테이블에서 페르소나 로딩 (캐싱 적용)
 * 3. emotionLevel 기반 AI 모델 선택 (S2BI1 ai-router)
 * 4. conversationId 없으면 새 conversation 레코드 생성
 * 5. OpenRouter API 호출 (비스트리밍)
 * 6. messages 테이블에 user/assistant 메시지 저장
 * 7. JSON 응답 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { selectModel } from '@/lib/ai-router';
import { chatCompletion } from '@/lib/openrouter-client';
import { loadPersona } from '@/lib/persona-loader';
import type { OpenRouterMessage } from '@/types/ai';

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
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
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

    // 4. 페르소나 로딩 (캐시 적용)
    const personaCtx = await loadPersona(botId);

    // 5. AI 모델 선택 (emotionLevel 기반)
    const routerResult = selectModel({ emotionSlider: emotionLevel, costTier });
    const { selectedModel, emotionTier } = routerResult;

    // 6. conversationId 확인 / 신규 생성
    let conversationId = inputConversationId ?? '';
    if (!conversationId) {
      conversationId = await createConversation(userId, botId);
    }

    // 7. 대화 히스토리 로드
    const history = await loadConversationHistory(conversationId);

    // 8. 메시지 배열 조합 (system + history + current user message)
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: personaCtx.systemPrompt },
      ...history,
      { role: 'user', content: message },
    ];

    // 9. user 메시지 DB 저장
    await saveMessage(conversationId, 'user', message);

    // 10. OpenRouter API 호출 (비스트리밍)
    const aiResponse = await chatCompletion(selectedModel.id, messages);
    const reply =
      aiResponse.choices[0]?.message?.content ?? '(응답 없음)';

    // 11. assistant 메시지 DB 저장
    const messageId = await saveMessage(conversationId, 'assistant', reply);

    // 12. JSON 응답 반환
    const responseBody: ChatResponseBody = {
      reply,
      conversationId,
      messageId,
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      emotionTier,
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/chat] Error:', message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
