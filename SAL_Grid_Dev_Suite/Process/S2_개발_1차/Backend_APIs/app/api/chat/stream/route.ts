/**
 * @task S2BA2
 * @description POST /api/chat/stream — SSE 스트리밍 대화 API
 *
 * 요청: { botId, message, emotionLevel, conversationId? }
 * 응답: text/event-stream (Server-Sent Events)
 *
 * SSE 이벤트 타입:
 *   event: model_selected  data: { modelId, modelName, emotionTier, conversationId }
 *   event: content         data: { text: "..." }
 *   event: done            data: { messageId }
 *   event: error           data: { error: "..." }
 *
 * 처리 순서:
 * 1. Supabase Auth 세션 확인
 * 2. personas 테이블에서 페르소나 로딩 (캐싱 적용)
 * 3. emotionLevel 기반 AI 모델 선택 (S2BI1 ai-router)
 * 4. conversationId 없으면 새 conversation 레코드 생성
 * 5. user 메시지 DB 저장
 * 6. OpenRouter streaming API 호출
 * 7. SSE 청크 클라이언트에 전송
 * 8. 스트리밍 완료 후 전체 응답을 messages 테이블에 저장
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { selectModel } from '@/lib/ai-router';
import { chatCompletionStream, formatSSE } from '@/lib/openrouter-client';
import { loadPersona } from '@/lib/persona-loader';
import type { OpenRouterMessage } from '@/types/ai';

// ============================
// 타입 정의
// ============================

/**
 * POST /api/chat/stream 요청 바디
 */
interface StreamChatRequestBody {
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
// 유틸리티 함수
// ============================

/**
 * SSE 에러 이벤트 생성 (Uint8Array)
 */
function sseError(message: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(formatSSE('error', JSON.stringify({ error: message })));
}

/**
 * Authorization 헤더 또는 쿠키에서 사용자 ID 추출
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

/**
 * 대화 히스토리 로드 (최근 N개)
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

  return (data as { role: string; content: string }[])
    .reverse()
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
}

/**
 * 새 conversation 레코드 생성
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
// Route Handler
// ============================

/**
 * POST /api/chat/stream
 * SSE 스트리밍 대화 API — 페르소나 로딩, 모델 선택, 청크 전송, 완료 후 저장
 */
export async function POST(req: NextRequest): Promise<Response> {
  const encoder = new TextEncoder();

  // SSE 공통 응답 헤더
  const sseHeaders: HeadersInit = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Nginx 버퍼링 비활성화
  };

  // ──────────────────────────────────────────
  // 요청 파싱 + 유효성 검사
  // ──────────────────────────────────────────
  let body: StreamChatRequestBody;
  try {
    body = (await req.json()) as StreamChatRequestBody;
  } catch {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(sseError('Invalid JSON body'));
        controller.close();
      },
    });
    return new Response(stream, { headers: sseHeaders, status: 400 });
  }

  const {
    botId,
    message,
    emotionLevel,
    conversationId: inputConversationId,
    costTier = 'standard',
  } = body;

  if (!botId || !message || typeof emotionLevel !== 'number') {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          sseError('botId, message, emotionLevel are required')
        );
        controller.close();
      },
    });
    return new Response(stream, { headers: sseHeaders, status: 400 });
  }

  if (emotionLevel < 1 || emotionLevel > 100) {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          sseError('emotionLevel must be between 1 and 100')
        );
        controller.close();
      },
    });
    return new Response(stream, { headers: sseHeaders, status: 400 });
  }

  // ──────────────────────────────────────────
  // 메인 스트리밍 로직
  // ──────────────────────────────────────────
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      /**
       * 컨트롤러에 SSE 이벤트 쓰기 헬퍼
       */
      const write = (event: string, data: string) => {
        controller.enqueue(encoder.encode(formatSSE(event, data)));
      };

      try {
        // 1. 인증 확인
        const userId = await getUserId(req);
        if (!userId) {
          write('error', JSON.stringify({ error: 'Unauthorized' }));
          controller.close();
          return;
        }

        // 2. 페르소나 로딩
        const personaCtx = await loadPersona(botId);

        // 3. AI 모델 선택
        const routerResult = selectModel({
          emotionSlider: emotionLevel,
          costTier,
        });
        const { selectedModel, emotionTier } = routerResult;

        // 4. conversationId 확인 / 신규 생성
        let conversationId = inputConversationId ?? '';
        if (!conversationId) {
          conversationId = await createConversation(userId, botId);
        }

        // 5. 대화 히스토리 로드
        const history = await loadConversationHistory(conversationId);

        // 6. 메시지 배열 조합
        const messages: OpenRouterMessage[] = [
          { role: 'system', content: personaCtx.systemPrompt },
          ...history,
          { role: 'user', content: message },
        ];

        // 7. user 메시지 DB 저장
        await saveMessage(conversationId, 'user', message);

        // 8. model_selected 이벤트 전송
        write(
          'model_selected',
          JSON.stringify({
            modelId: selectedModel.id,
            modelName: selectedModel.name,
            emotionTier,
            conversationId,
          })
        );

        // 9. OpenRouter 스트리밍 API 호출
        const contentStream = await chatCompletionStream(
          selectedModel.id,
          messages
        );
        const reader = contentStream.getReader();

        // 10. 청크를 클라이언트에 전송하며 전체 응답 누적
        let fullReply = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          fullReply += value;
          write('content', JSON.stringify({ text: value }));
        }

        // 11. 스트리밍 완료 후 전체 응답 DB 저장
        const messageId = await saveMessage(
          conversationId,
          'assistant',
          fullReply
        );

        // 12. done 이벤트 전송
        write('done', JSON.stringify({ messageId }));
        controller.close();
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : 'Internal server error';
        console.error('[POST /api/chat/stream] Error:', errMsg);
        write('error', JSON.stringify({ error: errMsg }));
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders, status: 200 });
}
