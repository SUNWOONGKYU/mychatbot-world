// @task S4GA1
/**
 * Community Post Detail API — Next.js App Router Route Handler
 * GET    /api/community/[id]  — 게시글 상세 (views_count 증가)
 * PATCH  /api/community/[id]  — 게시글 수정 (봇 소유자만)
 * DELETE /api/community/[id]  — 게시글 삭제 (봇 소유자만)
 *
 * Vanilla API 참조: api/Backend_APIs/community-post.js
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

interface RawPost {
  id: string;
  title: string;
  content?: string;
  madang: string;
  category: string;
  user_id: string;
  bot_id: string | null;
  upvotes: number | null;
  downvotes: number | null;
  likes_count: number | null;
  views_count: number | null;
  comments_count: number | null;
  created_at: string;
  updated_at: string;
  bot?: {
    id: string;
    bot_name: string;
    emoji: string | null;
    username: string | null;
    karma: number | null;
    owner_id?: string;
  } | null;
}

function normalizePost(post: RawPost) {
  const bot = post.bot ?? {};
  return {
    ...post,
    bot: undefined,
    bot_id: (bot as { id?: string }).id ?? post.bot_id,
    bot_name: (bot as { bot_name?: string }).bot_name ?? null,
    bot_emoji: (bot as { emoji?: string | null }).emoji ?? null,
    bot_karma: (bot as { karma?: number | null }).karma ?? 0,
    bot_username: (bot as { username?: string | null }).username ?? null,
    upvotes: post.upvotes ?? post.likes_count ?? 0,
    downvotes: post.downvotes ?? 0,
  };
}

// ── GET /api/community/[id] ───────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabase();
    const { id } = await params;

    const { data: post, error: fetchError } = await supabase
      .from('community_posts')
      .select('*, bot:bot_id (id, bot_name, emoji, username, karma, owner_id)')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      console.error('[community/[id]/route] fetch error:', fetchError.message);
      return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
    }

    // 조회수 증가 (비동기, 실패 무시)
    const currentViews = (post as RawPost).views_count ?? 0;
    supabase
      .from('community_posts')
      .update({ views_count: currentViews + 1 })
      .eq('id', id)
      .then(({  error: e }: any) => {
        if (e) console.warn('[community/[id]/route] views_count update failed:', e.message);
      });

    return NextResponse.json({
      post: normalizePost({ ...(post as unknown as RawPost), views_count: currentViews + 1 }),
    });
  } catch (err) {
    console.error('[community/[id]/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH /api/community/[id] ─────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabase();
    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase as any, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as {
      title?: string;
      content?: string;
      madang?: string;
      category?: string;
    };

    const { data: existing, error: fetchErr } = await supabase
      .from('community_posts')
      .select('user_id, bot_id')
      .eq('id', id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
    }

    // 권한 확인 (게시글 작성자 or 봇 소유자)
    let authorized = (existing as { user_id: string }).user_id === userId;
    if (!authorized && (existing as { bot_id: string | null }).bot_id) {
      const { data: bot } = await supabase
        .from('mcw_bots')
        .select('owner_id')
        .eq('id', (existing as { bot_id: string }).bot_id)
        .single();
      authorized = (bot as { owner_id: string } | null)?.owner_id === userId;
    }
    if (!authorized) return NextResponse.json({ error: 'Forbidden: 해당 게시글의 소유자가 아닙니다' }, { status: 403 });

    const updates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (body.title?.trim()) updates.title = body.title.trim();
    if (body.content?.trim()) updates.content = body.content.trim();
    const madangVal = (body.madang ?? body.category ?? '').trim();
    if (madangVal) { updates.madang = madangVal; updates.category = madangVal; }

    const { data: updatedPost, error: updateError } = await supabase
      .from('community_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[community/[id]/route] update error:', updateError.message);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    return NextResponse.json({ post: normalizePost(updatedPost as unknown as RawPost) });
  } catch (err) {
    console.error('[community/[id]/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE /api/community/[id] ────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabase();
    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase as any, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const { id } = await params;

    const { data: existing, error: fetchErr } = await supabase
      .from('community_posts')
      .select('user_id, bot_id')
      .eq('id', id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
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
    if (!authorized) return NextResponse.json({ error: 'Forbidden: 해당 게시글의 소유자가 아닙니다' }, { status: 403 });

    const { error: deleteError } = await supabase.from('community_posts').delete().eq('id', id);
    if (deleteError) {
      console.error('[community/[id]/route] delete error:', deleteError.message);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('[community/[id]/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
