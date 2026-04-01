/**
 * @task S2FE3
 * @description 챗봇 목록 조회/삭제 API
 *
 * Endpoints:
 * - GET    /api/bots             로그인 사용자의 챗봇 목록 조회
 * - DELETE /api/bots?id={botId}  챗봇 삭제
 *
 * 테이블: mcw_bots (user_id, name, description, deploy_url, qr_svg, ...)
 * 인증: Supabase Auth 세션 필수
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── 타입 정의 ─────────────────────────────────────────────────

/** 챗봇 항목 */
interface BotItem {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  deploy_url: string | null;
  qr_svg: string | null;
  created_at: string;
  updated_at: string;
}

// ── GET /api/bots ─────────────────────────────────────────────

/**
 * 로그인 사용자의 챗봇 목록 조회
 * @param request - Next.js Request
 * @returns 챗봇 목록 { success, data: { bots, count } }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // 인증 확인
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다.', data: null },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0');

  const { data: bots, error, count } = await supabase
    .from('mcw_bots')
    .select('*', { count: 'exact' })
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message, data: null },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      bots: bots as BotItem[],
      count: count ?? 0,
    },
  });
}

// ── DELETE /api/bots?id={botId} ───────────────────────────────

/**
 * 챗봇 삭제
 * @param request - Next.js Request (쿼리: id 필수)
 * @returns 삭제 결과 { success }
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다.', data: null },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const botId = searchParams.get('id');

  if (!botId) {
    return NextResponse.json(
      { success: false, error: 'id 파라미터가 필요합니다.', data: null },
      { status: 400 },
    );
  }

  // 소유권 확인 후 삭제
  const { error } = await supabase
    .from('mcw_bots')
    .delete()
    .eq('id', botId)
    .eq('user_id', session.user.id);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message, data: null },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, data: null });
}
