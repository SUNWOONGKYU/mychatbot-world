/**
 * @task S5M6
 * @description GET /api/bots/[id]/chat-log — 챗봇 대화 이력 조회
 * Bearer 토큰 인증, conversations 테이블 조회
 * 42P01 시 빈 배열 반환
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { safeError } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return null;
  const { data: { user } } = await getSupabase().auth.getUser(token);
  return user ?? null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: botId } = await params;
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const supabase = getSupabase();

  // 봇 소유권 확인
  const { data: bot } = await supabase
    .from('mcw_bots')
    .select('id')
    .eq('id', botId)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!bot) {
    return NextResponse.json({ error: '챗봇을 찾을 수 없습니다.' }, { status: 404 });
  }

  // 대화 목록 조회
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, user_id, created_at')
    .eq('bot_id', botId)
    .order('created_at', { ascending: false })
    .limit(20);

  // 42P01: 테이블 없음 → 빈 배열 반환
  if (error?.code === '42P01') {
    return NextResponse.json({ conversations: [], total: 0 });
  }
  if (error) {
    console.error('[bots/chat-log] error:', error.message);
    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }

  return NextResponse.json({ conversations: conversations ?? [], total: conversations?.length ?? 0 });
}
