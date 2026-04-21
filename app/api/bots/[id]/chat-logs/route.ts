/**
 * @task S10BA1
 * @description GET/DELETE /api/bots/[id]/chat-logs — 봇 소유자용 대화 이력 조회·삭제
 * GET: pagination(limit/offset), conversations 테이블 기반
 * DELETE: ?conversationId= 지정 시 단건 삭제, 없으면 봇 전체 삭제
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

async function assertBotOwner(botId: string, userId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('mcw_bots')
    .select('id')
    .eq('id', botId)
    .eq('owner_id', userId)
    .maybeSingle();
  return !!data;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: botId } = await params;
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  if (!(await assertBotOwner(botId, user.id))) {
    return NextResponse.json({ error: '코코봇을 찾을 수 없습니다.' }, { status: 404 });
  }

  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);

  const supabase = getSupabase();
  const { data, error, count } = await supabase
    .from('conversations')
    .select('id, user_id, created_at', { count: 'exact' })
    .eq('bot_id', botId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error?.code === '42P01') {
    return NextResponse.json({ conversations: [], total: 0, limit, offset });
  }
  if (error) {
    console.error('[chat-logs][GET]', error.message);
    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }
  return NextResponse.json({
    conversations: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: botId } = await params;
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  if (!(await assertBotOwner(botId, user.id))) {
    return NextResponse.json({ error: '코코봇을 찾을 수 없습니다.' }, { status: 404 });
  }

  const url = new URL(req.url);
  const conversationId = url.searchParams.get('conversationId');
  const supabase = getSupabase();

  let query = supabase.from('conversations').delete().eq('bot_id', botId);
  if (conversationId) {
    query = query.eq('id', conversationId);
  }
  const { data, error } = await query.select('id');

  if (error) {
    console.error('[chat-logs][DELETE]', error.message);
    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }
  return NextResponse.json({ success: true, deleted: data?.length ?? 0 });
}
