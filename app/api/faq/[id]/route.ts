/**
 * @task S2FE7
 * @description FAQ 개별 항목 수정/삭제 API
 *
 * Endpoints:
 * - PATCH  /api/faq/{id}  FAQ 항목 수정 (question, answer, order_index)
 * - DELETE /api/faq/{id}  FAQ 항목 삭제
 *
 * 인증: Supabase Auth 세션 필수
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

/**
 * FAQ 항목 수정
 * @param request - { question?, answer?, order_index? }
 * @param context - URL 파라미터 { id }
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
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

  const updates: UpdateFaqBody = {};
  if (body.question !== undefined) updates.question = body.question.trim();
  if (body.answer !== undefined) updates.answer = body.answer.trim();
  if (body.order_index !== undefined) updates.order_index = body.order_index;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: '수정할 항목이 없습니다.' },
      { status: 400 }
    );
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

/**
 * FAQ 항목 삭제
 * @param _request - 사용하지 않음
 * @param context - URL 파라미터 { id }
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
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
