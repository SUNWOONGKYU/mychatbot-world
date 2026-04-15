// @task S4GA1
/**
 * Community Bookmark API — Next.js App Router Route Handler
 * GET  /api/community/bookmark?post_id=xxx  — 북마크 여부 확인 (인증 필수)
 * POST /api/community/bookmark              — 북마크 토글 (추가/삭제, 인증 필수)
 *
 * community_bookmarks 테이블 사용
 * Vanilla API 참조: api/Backend_APIs/community-bookmark.js
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

// ── GET /api/community/bookmark?post_id=xxx ───────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const post_id = new URL(req.url).searchParams.get('post_id');
    if (!post_id) return NextResponse.json({ error: 'Missing required query parameter: post_id' }, { status: 400 });

    const { data, error } = await supabase
      .from('community_bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', post_id)
      .maybeSingle();

    if (error) {
      console.error('[community/bookmark/route] get error:', error.message);
      return NextResponse.json({ error: 'Failed to check bookmark' }, { status: 500 });
    }

    return NextResponse.json({
      bookmarked: !!data,
      bookmark_id: (data as { id: string } | null)?.id ?? null,
    });
  } catch (err) {
    console.error('[community/bookmark/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/community/bookmark ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as { post_id?: string };
    const { post_id } = body;
    if (!post_id) return NextResponse.json({ error: 'Missing required field: post_id' }, { status: 400 });

    // 기존 북마크 확인
    const { data: existing, error: checkError } = await supabase
      .from('community_bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', post_id)
      .maybeSingle();

    if (checkError) {
      console.error('[community/bookmark/route] check error:', checkError.message);
      return NextResponse.json({ error: 'Failed to check bookmark' }, { status: 500 });
    }

    if (existing) {
      // 북마크 삭제
      const { error: deleteError } = await supabase
        .from('community_bookmarks')
        .delete()
        .eq('id', (existing as { id: string }).id);

      if (deleteError) {
        console.error('[community/bookmark/route] delete error:', deleteError.message);
        return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
      }

      return NextResponse.json({ bookmarked: false, action: 'removed' });
    } else {
      // 북마크 추가
      const { data: newBookmark, error: insertError } = await supabase
        .from('community_bookmarks')
        .insert({ user_id: userId, post_id })
        .select('id')
        .single();

      if (insertError) {
        console.error('[community/bookmark/route] insert error:', insertError.message);
        return NextResponse.json({ error: 'Failed to add bookmark' }, { status: 500 });
      }

      return NextResponse.json(
        {
          bookmarked: true,
          action: 'added',
          bookmark_id: (newBookmark as { id: string }).id,
        },
        { status: 201 },
      );
    }
  } catch (err) {
    console.error('[community/bookmark/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
