// @task S4GA1
/**
 * Community Vote (Like) API — Next.js App Router Route Handler
 * GET  /api/community/like?target_type=post&target_id=xxx  — 투표 현황 조회
 * POST /api/community/like  — 업보트/다운보트 (같은 투표 재클릭=취소, 반대=전환)
 *
 * community_votes 테이블 사용 (user_id + target_type + target_id 복합 유니크)
 * community_posts.upvotes/downvotes, community_comments.upvotes/downvotes 동기화
 * Vanilla API 참조: api/Backend_APIs/community-like.js
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

function targetTable(targetType: string): string | null {
  if (targetType === 'post') return 'community_posts';
  if (targetType === 'comment') return 'community_comments';
  return null;
}

async function syncVoteCounts(
  supabase: ReturnType<typeof createClient>,
  targetType: string,
  targetId: string,
): Promise<void> {
  const table = targetTable(targetType);
  if (!table) return;

  const { data: votes } = await supabase
    .from('community_votes')
    .select('vote_type')
    .eq('target_type', targetType)
    .eq('target_id', targetId);

  const upvotes = (votes ?? []).filter((v: { vote_type: string }) => v.vote_type === 'up').length;
  const downvotes = (votes ?? []).filter((v: { vote_type: string }) => v.vote_type === 'down').length;

  const { error: updateErr } = await supabase.from(table).update({ upvotes, downvotes }).eq('id', targetId);
  if (updateErr) {
    console.warn(`[community/like/route] vote count sync failed for ${targetType}/${targetId}:`, updateErr.message);
  }
}

// ── GET /api/community/like ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);

    // 하위호환: target_type 없이 post_id만 보내는 경우
    const tType = searchParams.get('target_type') ?? 'post';
    const tId = searchParams.get('target_id') ?? searchParams.get('post_id');

    if (!tId) return NextResponse.json({ error: 'Missing required query parameter: target_id (or post_id)' }, { status: 400 });
    if (!['post', 'comment'].includes(tType)) {
      return NextResponse.json({ error: 'target_type must be "post" or "comment"' }, { status: 400 });
    }

    const table = targetTable(tType)!;
    const { data: target, error: targetErr } = await supabase
      .from(table)
      .select('upvotes, downvotes')
      .eq('id', tId)
      .single();

    if (targetErr) {
      if (targetErr.code === 'PGRST116') return NextResponse.json({ error: `${tType} not found` }, { status: 404 });
      return NextResponse.json({ error: `Failed to fetch ${tType}` }, { status: 500 });
    }

    const upvotes = (target as { upvotes: number | null }).upvotes ?? 0;
    const downvotes = (target as { downvotes: number | null }).downvotes ?? 0;

    // 현재 사용자 투표 여부 (옵션)
    let userVote: string | null = null;
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (token) {
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user) {
        const { data: voteRow } = await supabase
          .from('community_votes')
          .select('vote_type')
          .eq('target_type', tType)
          .eq('target_id', tId)
          .eq('user_id', userData.user.id)
          .maybeSingle();
        userVote = (voteRow as { vote_type: string } | null)?.vote_type ?? null;
      }
    }

    return NextResponse.json({
      target_type: tType,
      target_id: tId,
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      user_vote: userVote,
      // 하위호환
      likes_count: upvotes,
      is_liked: userVote === 'up',
    });
  } catch (err) {
    console.error('[community/like/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/community/like ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as {
      target_type?: string;
      target_id?: string;
      post_id?: string;
      vote_type?: string;
    };

    // 하위호환: post_id만 보내는 경우 → target_type='post', vote_type='up'
    const tType = body.target_type ?? 'post';
    const tId = body.target_id ?? body.post_id;
    const voteType = body.vote_type ?? 'up';

    if (!tId) return NextResponse.json({ error: 'Missing required field: target_id (or post_id)' }, { status: 400 });
    if (!['post', 'comment'].includes(tType)) {
      return NextResponse.json({ error: 'target_type must be "post" or "comment"' }, { status: 400 });
    }
    if (!['up', 'down'].includes(voteType)) {
      return NextResponse.json({ error: 'vote_type must be "up" or "down"' }, { status: 400 });
    }

    // 대상 존재 확인
    const table = targetTable(tType)!;
    const { error: targetErr } = await supabase.from(table).select('id').eq('id', tId).single();
    if (targetErr) {
      if (targetErr.code === 'PGRST116') return NextResponse.json({ error: `${tType} not found` }, { status: 404 });
      return NextResponse.json({ error: `Failed to fetch ${tType}` }, { status: 500 });
    }

    // 기존 투표 확인
    const { data: existingVote } = await supabase
      .from('community_votes')
      .select('id, vote_type')
      .eq('target_type', tType)
      .eq('target_id', tId)
      .eq('user_id', userId)
      .maybeSingle();

    let resultVote: string | null = null;

    if (existingVote) {
      const ev = existingVote as { id: string; vote_type: string };
      if (ev.vote_type === voteType) {
        // 같은 투표 재클릭 → 취소
        await supabase.from('community_votes').delete().eq('id', ev.id);
        resultVote = null;
      } else {
        // 반대 투표 → 전환
        await supabase.from('community_votes').update({ vote_type: voteType }).eq('id', ev.id);
        resultVote = voteType;
      }
    } else {
      // 새 투표
      const { error: insertErr } = await supabase
        .from('community_votes')
        .insert({ user_id: userId, target_type: tType, target_id: tId, vote_type: voteType });

      if (insertErr) {
        console.error('[community/like/route] vote insert error:', insertErr.message);
        return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 });
      }
      resultVote = voteType;
    }

    // 투표 수 동기화
    await syncVoteCounts(supabase, tType, tId);

    // 최신 카운트
    const { data: updated } = await supabase.from(table).select('upvotes, downvotes').eq('id', tId).single();
    const upvotes = (updated as { upvotes: number | null } | null)?.upvotes ?? 0;
    const downvotes = (updated as { downvotes: number | null } | null)?.downvotes ?? 0;

    return NextResponse.json({
      target_type: tType,
      target_id: tId,
      user_vote: resultVote,
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      // 하위호환
      liked: resultVote === 'up',
      likes_count: upvotes,
    });
  } catch (err) {
    console.error('[community/like/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
