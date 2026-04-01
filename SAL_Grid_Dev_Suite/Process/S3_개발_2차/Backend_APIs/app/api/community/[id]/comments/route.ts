/**
 * @task S3BA4
 * @description 게시글 댓글 API — 대댓글(parent_id) 스레딩, 최대 2 depth
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

type RouteContext = { params: { id: string } };

/**
 * GET: 댓글 목록 (스레딩 포함, 최대 2 depth)
 * 루트 댓글 → 자식 댓글(replies) 구조로 반환
 */
export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const postId = params.id;
  const supabase = createClient();

  // 1. 루트 댓글 + 작성자 정보 조회
  const { data: rootComments, error: rootError } = await supabase
    .from('comments')
    .select('*, author:user_id(id, name, avatar_url)')
    .eq('post_id', postId)
    .is('parent_id', null)
    .order('created_at', { ascending: true });

  if (rootError) {
    return NextResponse.json(
      { error: 'Failed to fetch comments', details: rootError.message },
      { status: 500 }
    );
  }

  // 2. 대댓글 조회 (depth 2: parent가 루트 댓글인 것만)
  const rootIds = (rootComments ?? []).map((c) => c.id as string);

  let replies: Record<string, unknown>[] = [];
  if (rootIds.length > 0) {
    const { data: replyData, error: replyError } = await supabase
      .from('comments')
      .select('*, author:user_id(id, name, avatar_url)')
      .in('parent_id', rootIds)
      .order('created_at', { ascending: true });

    if (replyError) {
      return NextResponse.json(
        { error: 'Failed to fetch replies', details: replyError.message },
        { status: 500 }
      );
    }
    replies = (replyData ?? []) as Record<string, unknown>[];
  }

  // 3. 루트 댓글에 replies 배열 첨부
  const repliesMap = replies.reduce<Record<string, Record<string, unknown>[]>>(
    (acc, reply) => {
      const pid = reply['parent_id'] as string;
      if (!acc[pid]) acc[pid] = [];
      acc[pid].push(reply);
      return acc;
    },
    {}
  );

  const threaded = (rootComments ?? []).map((comment) => ({
    ...comment,
    replies: repliesMap[comment.id as string] ?? [],
  }));

  return NextResponse.json({ comments: threaded });
}

/**
 * POST: 댓글 작성 (루트 또는 대댓글)
 * Body: { content, parent_id? }
 *   - parent_id 없으면 루트 댓글
 *   - parent_id 있으면 대댓글 (depth 2까지만 허용)
 */
export async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const postId = params.id;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { content?: string; parent_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { content, parent_id } = body;

  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  // depth 2 제한: parent_id가 있는 경우 해당 댓글의 parent_id가 null이어야 함
  if (parent_id) {
    const { data: parentComment, error: parentError } = await supabase
      .from('comments')
      .select('id, parent_id')
      .eq('id', parent_id)
      .eq('post_id', postId)
      .single();

    if (parentError || !parentComment) {
      return NextResponse.json(
        { error: 'Parent comment not found' },
        { status: 404 }
      );
    }

    // 이미 대댓글인 경우 더 이상 depth 허용 안 함
    if (parentComment.parent_id !== null) {
      return NextResponse.json(
        { error: 'Maximum comment depth (2) exceeded' },
        { status: 422 }
      );
    }
  }

  // 댓글 삽입
  const { data: newComment, error: insertError } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
      parent_id: parent_id ?? null,
      likes: 0,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to create comment', details: insertError.message },
      { status: 500 }
    );
  }

  // comment_count 증분 (정합성 유지)
  const { error: updateError } = await supabase.rpc('increment_comment_count', {
    post_id: postId,
  });

  if (updateError) {
    // 카운트 실패는 치명적이지 않으므로 warn만
    console.warn('[S3BA4] increment_comment_count failed:', updateError.message);
  }

  // Realtime broadcast: 게시글 구독자에게 새 댓글 알림
  await supabase.channel(`community-${postId}`).send({
    type: 'broadcast',
    event: 'new_comment',
    payload: {
      comment_id: (newComment as Record<string, unknown>).id,
      post_id: postId,
      user_id: user.id,
      parent_id: parent_id ?? null,
    },
  });

  return NextResponse.json({ comment: newComment }, { status: 201 });
}

/**
 * DELETE: 댓글 삭제 (본인 또는 관리자만)
 * Query: ?comment_id=xxx
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const postId = params.id;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get('comment_id');

  if (!commentId) {
    return NextResponse.json(
      { error: 'comment_id query param is required' },
      { status: 400 }
    );
  }

  // 본인 댓글인지 확인
  const { data: existing, error: fetchError } = await supabase
    .from('comments')
    .select('id, user_id')
    .eq('id', commentId)
    .eq('post_id', postId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  if ((existing as Record<string, unknown>).user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: deleteError } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (deleteError) {
    return NextResponse.json(
      { error: 'Failed to delete comment', details: deleteError.message },
      { status: 500 }
    );
  }

  // comment_count 감소
  await supabase.rpc('decrement_comment_count', { post_id: postId });

  return NextResponse.json({ success: true });
}
