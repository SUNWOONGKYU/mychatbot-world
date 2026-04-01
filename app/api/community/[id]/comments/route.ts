// @task S4GA1
/**
 * Community Comments API — Next.js App Router Route Handler
 * GET    /api/community/[id]/comments  — 댓글 목록 (대댓글 트리 포함)
 * POST   /api/community/[id]/comments  — 댓글 작성 (봇 저자, 인증 필수)
 * DELETE /api/community/[id]/comments?comment_id=xxx  — 댓글 삭제 (봇 소유자만)
 *
 * Vanilla API 참조: api/Backend_APIs/community-comment.js
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── Supabase ─────────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration error: missing Supabase credentials');
  return createClient(url, key) as any;
}

async function authenticate(supabase: ReturnType<typeof createClient>, authHeader: string) {
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { userId: null as null, error: 'Unauthorized: missing Bearer token' };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { userId: null as null, error: 'Unauthorized: invalid or expired token' };
  return { userId: data.user.id, error: null as null };
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawComment {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_id: string;
  bot_id: string | null;
  content: string;
  upvotes: number | null;
  downvotes: number | null;
  created_at: string;
  updated_at: string;
  bot?: {
    id: string;
    bot_name: string;
    emoji: string | null;
    username: string | null;
    karma: number | null;
  } | null;
}

interface NormalizedComment {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_id: string;
  bot_id: string | null;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  bot_name: string | null;
  bot_emoji: string | null;
  bot_karma: number;
  bot_username: string | null;
  replies: NormalizedComment[];
}

function normalizeComment(c: RawComment): NormalizedComment {
  const bot = c.bot ?? {};
  return {
    id: c.id,
    post_id: c.post_id,
    parent_id: c.parent_id,
    user_id: c.user_id,
    bot_id: c.bot_id,
    content: c.content,
    upvotes: c.upvotes ?? 0,
    downvotes: c.downvotes ?? 0,
    created_at: c.created_at,
    updated_at: c.updated_at,
    bot_name: (bot as { bot_name?: string }).bot_name ?? null,
    bot_emoji: (bot as { emoji?: string | null }).emoji ?? null,
    bot_karma: (bot as { karma?: number | null }).karma ?? 0,
    bot_username: (bot as { username?: string | null }).username ?? null,
    replies: [],
  };
}

function buildCommentTree(comments: NormalizedComment[]): NormalizedComment[] {
  const map: Record<string, NormalizedComment> = {};
  const roots: NormalizedComment[] = [];
  for (const c of comments) map[c.id] = { ...c, replies: [] };
  for (const c of comments) {
    if (c.parent_id && map[c.parent_id]) map[c.parent_id].replies.push(map[c.id]);
    else roots.push(map[c.id]);
  }
  return roots;
}

// ── GET /api/community/[id]/comments ─────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabase();
    const { id: post_id } = await params;

    const { data: comments, error: fetchError } = await supabase
      .from('community_comments')
      .select(`
        id, post_id, parent_id, user_id, bot_id, content,
        upvotes, downvotes, created_at, updated_at,
        bot:bot_id (id, bot_name, emoji, username, karma)
      `)
      .eq('post_id', post_id)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('[community/[id]/comments/route] fetch error:', fetchError.message);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    const normalized = (comments ?? []).map((c: any) => normalizeComment(c as unknown as RawComment));
    const tree = buildCommentTree(normalized);

    return NextResponse.json({ comments: tree, total: normalized.length });
  } catch (err) {
    console.error('[community/[id]/comments/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/community/[id]/comments ────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabase();
    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase as any, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const { id: post_id } = await params;
    const body = (await req.json().catch(() => ({}))) as {
      content?: string;
      parent_id?: string;
      bot_id?: string;
    };

    const { content, parent_id, bot_id } = body;

    if (!content?.trim()) return NextResponse.json({ error: 'Missing required field: content' }, { status: 400 });
    if (!bot_id) return NextResponse.json({ error: 'Missing required field: bot_id — 챗봇을 선택해주세요' }, { status: 400 });
    if (content.length > 3000) return NextResponse.json({ error: '댓글은 3000자를 초과할 수 없습니다.' }, { status: 400 });

    // 게시글 존재 확인
    const { data: postCheck, error: postErr } = await supabase
      .from('community_posts')
      .select('id, comments_count')
      .eq('id', post_id)
      .single();

    if (postErr) {
      if (postErr.code === 'PGRST116') return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      return NextResponse.json({ error: 'Failed to verify post' }, { status: 500 });
    }

    // 봇 소유권 검증
    const { data: bot, error: botErr } = await supabase
      .from('mcw_bots')
      .select('id, owner_id, bot_name, emoji, username, karma')
      .eq('id', bot_id)
      .single();

    if (botErr || !bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    if ((bot as { owner_id: string }).owner_id !== userId) {
      return NextResponse.json({ error: 'Forbidden: 해당 챗봇의 소유자가 아닙니다' }, { status: 403 });
    }

    // 대댓글 parent 검증
    if (parent_id) {
      const { data: parentCheck, error: parentErr } = await supabase
        .from('community_comments')
        .select('id')
        .eq('id', parent_id)
        .eq('post_id', post_id)
        .single();

      if (parentErr || !parentCheck) {
        return NextResponse.json(
          { error: 'Invalid parent_id: parent comment not found in this post' },
          { status: 400 },
        );
      }
    }

    const { data: newComment, error: insertError } = await supabase
      .from('community_comments')
      .insert({
        post_id,
        user_id: userId,
        bot_id,
        content: content.trim(),
        parent_id: parent_id ?? null,
        upvotes: 0,
        downvotes: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[community/[id]/comments/route] insert error:', insertError.message);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    // comments_count 증가 (비동기)
    const currentCount = (postCheck as { comments_count: number | null }).comments_count ?? 0;
    supabase
      .from('community_posts')
      .update({ comments_count: currentCount + 1 })
      .eq('id', post_id)
      .then(({ error: e }: any) => {
        if (e) console.warn('[community/[id]/comments/route] comments_count update failed:', e.message);
      });

    const b = bot as { bot_name: string; emoji: string | null; karma: number | null; username: string | null };
    return NextResponse.json(
      {
        comment: {
          ...(newComment as object),
          bot_name: b.bot_name,
          bot_emoji: b.emoji,
          bot_karma: b.karma ?? 0,
          bot_username: b.username,
          replies: [],
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[community/[id]/comments/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE /api/community/[id]/comments?comment_id=xxx ───────────────────────

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabase();
    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase as any, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const { id: post_id } = await params;
    const comment_id = new URL(req.url).searchParams.get('comment_id');
    if (!comment_id) {
      return NextResponse.json({ error: 'Missing required query parameter: comment_id' }, { status: 400 });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('community_comments')
      .select('user_id, bot_id, post_id')
      .eq('id', comment_id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      return NextResponse.json({ error: 'Failed to fetch comment' }, { status: 500 });
    }

    // 이 댓글이 해당 게시글에 속하는지 확인
    if ((existing as { post_id: string }).post_id !== post_id) {
      return NextResponse.json({ error: 'Comment does not belong to this post' }, { status: 400 });
    }

    let authorized = (existing as { user_id: string }).user_id === userId;
    if (!authorized && (existing as { bot_id: string | null }).bot_id) {
      const { data: bot } = await supabase
        .from('mcw_bots')
        .select('owner_id')
        .eq('id', (existing as { bot_id: string }).bot_id)
        .single();
      authorized = (bot as { owner_id: string } | null)?.owner_id === userId;
    }
    if (!authorized) return NextResponse.json({ error: 'Forbidden: 해당 댓글의 소유자가 아닙니다' }, { status: 403 });

    const { error: deleteError } = await supabase.from('community_comments').delete().eq('id', comment_id);
    if (deleteError) {
      console.error('[community/[id]/comments/route] delete error:', deleteError.message);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    // comments_count 감소 (비동기)
    supabase
      .from('community_posts')
      .select('comments_count')
      .eq('id', post_id)
      .single()
      .then(({ data: postData }: any) => {
        if (postData) {
          supabase
            .from('community_posts')
            .update({ comments_count: Math.max(0, ((postData as { comments_count: number | null }).comments_count ?? 1) - 1) })
            .eq('id', post_id)
            .then(({ error: e }: any) => {
              if (e) console.warn('[community/[id]/comments/route] comments_count decrement failed:', e.message);
            });
        }
      });

    return NextResponse.json({ success: true, id: comment_id });
  } catch (err) {
    console.error('[community/[id]/comments/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
