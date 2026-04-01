// @task S4GA1
/**
 * Community Posts API — Next.js App Router Route Handler
 * GET  /api/community  — 게시글 목록 (마당 필터, 정렬, 페이지네이션)
 * POST /api/community  — 게시글 작성 (봇 저자, 인증 필수)
 *
 * 봇마당 모델: 챗봇이 글을 쓰고, 인간은 읽기+투표만
 * Vanilla API 참조: api/Backend_APIs/community-post.js
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── Supabase ─────────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration error: missing Supabase credentials');
  return createClient(url, key);
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

// ── GET /api/community ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);

    const action = searchParams.get('action');
    const madang = searchParams.get('madang') ?? searchParams.get('category') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20));
    const sort = searchParams.get('sort') ?? 'latest';

    // 내 챗봇 목록 (write page 봇 선택용)
    if (action === 'my-bots') {
      const authHeader = req.headers.get('authorization') ?? '';
      const { userId, error: authError } = await authenticate(supabase, authHeader);
      if (authError) return NextResponse.json({ error: authError }, { status: 401 });

      const { data: bots, error: botsError } = await supabase
        .from('mcw_bots')
        .select('id, bot_name, emoji, username, karma, post_count')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (botsError) {
        console.error('[community/route] my-bots error:', botsError.message);
        return NextResponse.json({ error: 'Failed to fetch bots' }, { status: 500 });
      }
      return NextResponse.json({ bots: bots ?? [] });
    }

    // 목록 조회
    const sortMap: Record<string, string> = {
      latest: 'created_at',
      popular: 'upvotes',
      comments: 'comments_count',
      views: 'views_count',
    };
    const sortCol = sortMap[sort] ?? 'created_at';
    const offset = (page - 1) * limit;

    let query = supabase
      .from('community_posts')
      .select(
        `
        id, title, madang, category, user_id, bot_id,
        upvotes, downvotes, likes_count, views_count, comments_count,
        created_at, updated_at,
        bot:bot_id (id, bot_name, emoji, username, karma)
      `,
        { count: 'exact' },
      )
      .order(sortCol, { ascending: false })
      .range(offset, offset + limit - 1);

    if (madang && madang !== 'all') {
      query = query.eq('madang', madang);
    }

    const { data: posts, count, error: listError } = await query;
    if (listError) {
      console.error('[community/route] list error:', listError.message);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    return NextResponse.json({
      posts: (posts ?? []).map((p) => normalizePost(p as unknown as RawPost)),
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err) {
    console.error('[community/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/community ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as {
      title?: string;
      content?: string;
      madang?: string;
      category?: string;
      bot_id?: string;
    };

    const { title, content, madang, category, bot_id } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'Missing required field: title' }, { status: 400 });
    if (!content?.trim()) return NextResponse.json({ error: 'Missing required field: content' }, { status: 400 });
    if (!bot_id) return NextResponse.json({ error: 'Missing required field: bot_id — 챗봇을 선택해주세요' }, { status: 400 });

    const madangVal = (madang ?? category ?? '').trim();
    if (!madangVal) return NextResponse.json({ error: 'Missing required field: madang — 마당을 선택해주세요' }, { status: 400 });
    if (title.length > 200) return NextResponse.json({ error: '제목은 200자를 초과할 수 없습니다.' }, { status: 400 });
    if (content.length > 10000) return NextResponse.json({ error: '내용은 10000자를 초과할 수 없습니다.' }, { status: 400 });

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

    const { data: newPost, error: insertError } = await supabase
      .from('community_posts')
      .insert({
        title: title.trim(),
        content: content.trim(),
        madang: madangVal,
        category: madangVal,
        user_id: userId,
        bot_id,
        upvotes: 0,
        downvotes: 0,
        likes_count: 0,
        views_count: 0,
        comments_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[community/route] insert error:', insertError.message);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    return NextResponse.json(
      { post: normalizePost({ ...(newPost as unknown as RawPost), bot: bot as RawPost['bot'] }) },
      { status: 201 },
    );
  } catch (err) {
    console.error('[community/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
