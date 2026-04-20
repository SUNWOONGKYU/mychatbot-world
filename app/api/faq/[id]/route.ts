/**
 * @task S2FE7
 * @description FAQ 개별 항목 수정/삭제 API
 *
 * Endpoints:
 * - PATCH  /api/faq/{id}  FAQ 항목 수정 (question, answer, order_index)
 * - DELETE /api/faq/{id}  FAQ 항목 삭제
 *
 * 인증: Bearer 토큰 필수
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { generateQueryEmbedding } from '@/lib/chat/rag';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** PATCH 요청 바디 */
interface UpdateFaqBody {
  question?: string;
  answer?: string;
  order_index?: number;
}

// ────────────────────────────────────────────────────────────────
// PATCH /api/faq/{id}
// ────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await context.params;

  let body: UpdateFaqBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: '요청 바디를 파싱할 수 없습니다.' },
      { status: 400 }
    );
  }

  const updates: UpdateFaqBody & { embedding?: number[] | null } = {};
  if (body.question !== undefined) updates.question = body.question.trim();
  if (body.answer !== undefined) updates.answer = body.answer.trim();
  if (body.order_index !== undefined) updates.order_index = body.order_index;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: '수정할 항목이 없습니다.' },
      { status: 400 }
    );
  }

  // question/answer 변경 시 임베딩 재생성 (S5BA8)
  // 캐스케이드 검색 정확도 유지를 위해 의미 변경 시 벡터도 갱신
  if (updates.question !== undefined || updates.answer !== undefined) {
    const { data: existing } = await supabase
      .from('faqs')
      .select('question, answer')
      .eq('id', id)
      .single();
    const finalQ = updates.question ?? (existing as any)?.question ?? '';
    const finalA = updates.answer ?? (existing as any)?.answer ?? '';
    if (finalQ && finalA) {
      updates.embedding = await generateQueryEmbedding(`${finalQ}\n${finalA}`);
    }
  }

  const { data, error } = await supabase
    .from('faqs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[PATCH /api/faq/:id] DB 오류:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

// ────────────────────────────────────────────────────────────────
// DELETE /api/faq/{id}
// ────────────────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await context.params;

  const { error } = await supabase.from('faqs').delete().eq('id', id);

  if (error) {
    console.error('[DELETE /api/faq/:id] DB 오류:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
