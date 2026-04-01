/**
 * @task S2FE7
 * @description FAQ CRUD API
 *
 * Endpoints:
 * - GET    /api/faq?botId={id}  챗봇 FAQ 목록 조회
 * - POST   /api/faq             새 FAQ 항목 추가
 *
 * 인증: Supabase Auth 세션 필수
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ────────────────────────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────────────────────────

/** DB에서 조회되는 FAQ 레코드 */
export interface FaqRecord {
  id: string;
  chatbot_id: string;
  question: string;
  answer: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

/** POST 요청 바디 */
interface CreateFaqBody {
  chatbot_id: string;
  question: string;
  answer: string;
  order_index?: number;
}

// ────────────────────────────────────────────────────────────────
// GET /api/faq?botId={id}
// ────────────────────────────────────────────────────────────────

/**
 * 챗봇 FAQ 목록 조회
 * @param request - botId 쿼리 파라미터 필수
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
  }

  const botId = request.nextUrl.searchParams.get('botId');
  if (!botId) {
    return NextResponse.json(
      { success: false, error: 'botId 파라미터가 필요합니다.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('chatbot_id', botId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('[GET /api/faq] DB 오류:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data ?? [] });
}

// ────────────────────────────────────────────────────────────────
// POST /api/faq
// ────────────────────────────────────────────────────────────────

/**
 * 새 FAQ 항목 추가
 * @param request - { chatbot_id, question, answer, order_index? }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
  }

  let body: CreateFaqBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: '요청 바디를 파싱할 수 없습니다.' },
      { status: 400 }
    );
  }

  const { chatbot_id, question, answer, order_index = 0 } = body;

  if (!chatbot_id?.trim() || !question?.trim() || !answer?.trim()) {
    return NextResponse.json(
      { success: false, error: 'chatbot_id, question, answer는 필수 항목입니다.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('faqs')
    .insert({ chatbot_id, question: question.trim(), answer: answer.trim(), order_index })
    .select()
    .single();

  if (error) {
    console.error('[POST /api/faq] DB 오류:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
