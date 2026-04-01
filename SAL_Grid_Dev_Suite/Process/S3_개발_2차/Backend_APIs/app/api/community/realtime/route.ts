/**
 * @task S3BA4
 * @description Supabase Realtime 채널 설정 + 알림 발송 API
 * POST: 이벤트(new_comment, new_like, new_reply)를 특정 게시글 채널에 브로드캐스트
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

/** 지원 이벤트 타입 */
type RealtimeEvent = 'new_comment' | 'new_like' | 'new_reply';

const VALID_EVENTS: readonly RealtimeEvent[] = [
  'new_comment',
  'new_like',
  'new_reply',
];

/**
 * POST: 실시간 알림 브로드캐스트
 * Body: { post_id, event, payload }
 *   - post_id: 채널 식별자 (channel name: community-{post_id})
 *   - event: RealtimeEvent
 *   - payload: 이벤트 데이터 (자유 형식)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = createClient();

  // 인증 확인 (인증된 사용자만 브로드캐스트 가능)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { post_id?: string; event?: string; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { post_id, event, payload } = body;

  if (!post_id || !event) {
    return NextResponse.json(
      { error: 'post_id and event are required' },
      { status: 400 }
    );
  }

  if (!VALID_EVENTS.includes(event as RealtimeEvent)) {
    return NextResponse.json(
      {
        error: `Invalid event. Must be one of: ${VALID_EVENTS.join(', ')}`,
      },
      { status: 400 }
    );
  }

  // Supabase Realtime broadcast
  const channel = supabase.channel(`community-${post_id}`);

  const sendResult = await channel.send({
    type: 'broadcast',
    event: event as RealtimeEvent,
    payload: {
      ...payload,
      sender_id: user.id,
      timestamp: new Date().toISOString(),
    },
  });

  // 채널 정리
  await supabase.removeChannel(channel);

  if (sendResult === 'error') {
    return NextResponse.json(
      { error: 'Failed to send realtime notification' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    channel: `community-${post_id}`,
    event,
  });
}

/**
 * GET: 채널 정보 조회 (현재 게시글의 채널명 반환)
 * Query: ?post_id=xxx
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('post_id');

  if (!postId) {
    return NextResponse.json(
      { error: 'post_id query param is required' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    channel: `community-${postId}`,
    events: VALID_EVENTS,
    description: 'Subscribe via Supabase Realtime client using this channel name',
  });
}
