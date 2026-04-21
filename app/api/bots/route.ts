/**
 * @task S2FE3
 * @description 코코봇 목록 조회/삭제 API
 *
 * Endpoints:
 * - GET    /api/bots             로그인 사용자의 코코봇 목록 조회
 * - DELETE /api/bots?id={botId}  코코봇 삭제
 *
 * 테이블: mcw_bots (user_id, name, description, deploy_url, qr_svg, ...)
 * 인증: Bearer 토큰 필수
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ── 타입 정의 ─────────────────────────────────────────────────

/** 코코봇 항목 */
interface BotItem {
  id: string;
  owner_id: string;
  username: string;
  bot_name: string;
  bot_desc: string | null;
  emoji: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

// ── GET /api/bots ─────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0');

  const { data: bots, error, count } = await supabase
    .from('mcw_bots')
    .select('*, personas:mcw_personas(id, name, role, user_title, greeting, tone, personality)', { count: 'exact' })
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ success: false, error: error.message, data: null }, { status: 500 });
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

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const botId = searchParams.get('id');

  if (!botId) {
    return NextResponse.json({ success: false, error: 'id 파라미터가 필요합니다.', data: null }, { status: 400 });
  }

  const { error } = await supabase
    .from('mcw_bots')
    .delete()
    .eq('id', botId)
    .eq('owner_id', user.id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message, data: null }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: null });
}
