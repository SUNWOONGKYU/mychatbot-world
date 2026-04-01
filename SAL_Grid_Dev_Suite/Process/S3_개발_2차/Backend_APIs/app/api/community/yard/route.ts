/**
 * @task S3BA4
 * @description 마당(광장) API — 실시간 자유 토론 공간 (채팅형)
 * - Supabase Realtime Presence: 접속자 수 추적
 * - 마당 메시지: 24시간 후 자동 만료 (expires_at 컬럼)
 * - 채널명: 'community-yard'
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

/** 마당 메시지 만료 시간 (밀리초) */
const YARD_MESSAGE_TTL_MS = 24 * 60 * 60 * 1_000; // 24시간

/** 한 페이지 메시지 수 */
const MESSAGES_PER_PAGE = 50;

/**
 * GET: 마당 메시지 목록 (최근 N개, 만료 메시지 제외)
 * Query: ?cursor=ISO_timestamp (커서 기반 페이지네이션)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');

  const now = new Date().toISOString();

  let query = supabase
    .from('yard_messages')
    .select('*, author:user_id(id, name, avatar_url)')
    .gt('expires_at', now) // 만료되지 않은 메시지만
    .order('created_at', { ascending: false })
    .limit(MESSAGES_PER_PAGE);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch yard messages', details: error.message },
      { status: 500 }
    );
  }

  const messages = (data ?? []).reverse(); // 오래된 것 먼저
  const nextCursor =
    messages.length === MESSAGES_PER_PAGE
      ? (messages[0] as Record<string, unknown>).created_at
      : null;

  return NextResponse.json({ messages, nextCursor });
}

/**
 * POST: 마당 메시지 작성
 * Body: { content }
 * - 작성 즉시 Realtime broadcast
 * - expires_at = now + 24h
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { content } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  // 메시지 길이 제한 (2000자)
  if (content.length > 2_000) {
    return NextResponse.json(
      { error: 'Message too long (max 2000 chars)' },
      { status: 422 }
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + YARD_MESSAGE_TTL_MS).toISOString();

  const { data: newMessage, error: insertError } = await supabase
    .from('yard_messages')
    .insert({
      user_id: user.id,
      content: content.trim(),
      expires_at: expiresAt,
    })
    .select('*, author:user_id(id, name, avatar_url)')
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to send message', details: insertError.message },
      { status: 500 }
    );
  }

  // Realtime broadcast to yard channel
  await supabase.channel('community-yard').send({
    type: 'broadcast',
    event: 'new_message',
    payload: {
      message: newMessage,
    },
  });

  return NextResponse.json({ message: newMessage }, { status: 201 });
}

/**
 * DELETE: 마당 메시지 삭제 (본인만)
 * Query: ?message_id=xxx
 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('message_id');

  if (!messageId) {
    return NextResponse.json(
      { error: 'message_id query param is required' },
      { status: 400 }
    );
  }

  // 본인 메시지 확인
  const { data: existing, error: fetchError } = await supabase
    .from('yard_messages')
    .select('id, user_id')
    .eq('id', messageId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  if ((existing as Record<string, unknown>).user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: deleteError } = await supabase
    .from('yard_messages')
    .delete()
    .eq('id', messageId);

  if (deleteError) {
    return NextResponse.json(
      { error: 'Failed to delete message', details: deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
