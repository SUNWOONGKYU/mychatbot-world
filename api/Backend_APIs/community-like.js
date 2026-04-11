// @task S3BA7
/**
 * Community Vote API - Vercel Serverless Function
 * 업보트/다운보트 — 게시글 + 댓글 모두 지원
 *
 * POST /api/Backend_APIs/community-like
 *   body: { target_type: 'post'|'comment', target_id: UUID, vote_type: 'up'|'down' }
 *   → 같은 투표 재클릭 = 취소, 반대 투표 = 전환
 *
 * GET  /api/Backend_APIs/community-like?target_type=post&target_id=xxx
 *   → { upvotes, downvotes, score, user_vote: 'up'|'down'|null }
 *
 * community_votes 테이블 사용 (user_id + target_type + target_id 복합 유니크)
 * community_posts.upvotes/downvotes, community_comments.upvotes/downvotes 동기화
 */
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { supabase: null, error: 'Server configuration error: missing Supabase credentials' };
  return { supabase: createClient(url, key), error: null };
}

async function authenticate(supabase, authHeader) {
  const token = (authHeader || '').startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { userId: null, error: 'Unauthorized: missing Bearer token' };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { userId: null, error: 'Unauthorized: invalid or expired token' };
  return { userId: data.user.id, error: null };
}

/** 대상 테이블 이름 반환 */
function targetTable(targetType) {
  if (targetType === 'post') return 'community_posts';
  if (targetType === 'comment') return 'community_comments';
  return null;
}

/** 대상의 upvotes/downvotes를 community_votes에서 집계하여 동기화 */
async function syncVoteCounts(supabase, targetType, targetId) {
  const table = targetTable(targetType);
  if (!table) return;

  const { data: votes } = await supabase
    .from('community_votes')
    .select('vote_type')
    .eq('target_type', targetType)
    .eq('target_id', targetId);

  const upvotes = (votes || []).filter(v => v.vote_type === 'up').length;
  const downvotes = (votes || []).filter(v => v.vote_type === 'down').length;

  const { error: updateErr } = await supabase
    .from(table)
    .update({ upvotes, downvotes })
    .eq('id', targetId);

  if (updateErr) {
    console.warn(`[community-like] vote count sync failed for ${targetType}/${targetId}:`, updateErr.message);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', (req.headers.origin && ['https://mychatbot.world', 'http://localhost:3000', 'http://localhost:5173'].includes(req.headers.origin)) ? req.headers.origin : 'https://mychatbot.world');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { supabase, error: configError } = getSupabaseClient();
  if (configError) return res.status(500).json({ error: configError });

  try {
    // ─── GET: 투표 현황 조회 ───
    if (req.method === 'GET') {
      const { target_type, target_id } = req.query;

      // 하위호환: target_type 없이 post_id만 보내는 경우
      const tType = target_type || 'post';
      const tId = target_id || req.query.post_id;

      if (!tId) return res.status(400).json({ error: 'Missing required query parameter: target_id (or post_id)' });
      if (!['post', 'comment'].includes(tType)) return res.status(400).json({ error: 'target_type must be "post" or "comment"' });

      // 대상의 upvotes/downvotes 가져오기
      const table = targetTable(tType);
      const { data: target, error: targetErr } = await supabase
        .from(table)
        .select('upvotes, downvotes')
        .eq('id', tId)
        .single();

      if (targetErr) {
        if (targetErr.code === 'PGRST116') return res.status(404).json({ error: `${tType} not found` });
        return res.status(500).json({ error: `Failed to fetch ${tType}` });
      }

      const upvotes = target.upvotes || 0;
      const downvotes = target.downvotes || 0;

      // 현재 사용자 투표 여부
      let userVote = null;
      const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
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
          userVote = voteRow?.vote_type || null;
        }
      }

      return res.status(200).json({
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
    }

    // ─── POST: 투표 (업보트/다운보트) ───
    if (req.method === 'POST') {
      const { userId, error: authError } = await authenticate(supabase, req.headers['authorization'] || req.headers['Authorization'] || '');
      if (authError) return res.status(401).json({ error: authError });

      const body = req.body || {};
      // 하위호환: post_id만 보내는 경우 → target_type='post', vote_type='up'
      const tType = body.target_type || 'post';
      const tId = body.target_id || body.post_id;
      const voteType = body.vote_type || 'up';

      if (!tId) return res.status(400).json({ error: 'Missing required field: target_id (or post_id)' });
      if (!['post', 'comment'].includes(tType)) return res.status(400).json({ error: 'target_type must be "post" or "comment"' });
      if (!['up', 'down'].includes(voteType)) return res.status(400).json({ error: 'vote_type must be "up" or "down"' });

      // 대상 존재 확인
      const table = targetTable(tType);
      const { error: targetErr } = await supabase
        .from(table)
        .select('id')
        .eq('id', tId)
        .single();

      if (targetErr) {
        if (targetErr.code === 'PGRST116') return res.status(404).json({ error: `${tType} not found` });
        return res.status(500).json({ error: `Failed to fetch ${tType}` });
      }

      // 기존 투표 확인
      const { data: existingVote } = await supabase
        .from('community_votes')
        .select('id, vote_type')
        .eq('target_type', tType)
        .eq('target_id', tId)
        .eq('user_id', userId)
        .maybeSingle();

      let resultVote = null;

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // 같은 투표 재클릭 → 취소
          await supabase.from('community_votes').delete().eq('id', existingVote.id);
          resultVote = null;
        } else {
          // 반대 투표 → 전환
          await supabase.from('community_votes').update({ vote_type: voteType }).eq('id', existingVote.id);
          resultVote = voteType;
        }
      } else {
        // 새 투표
        const { error: insertErr } = await supabase
          .from('community_votes')
          .insert({ user_id: userId, target_type: tType, target_id: tId, vote_type: voteType });

        if (insertErr) {
          console.error('[community-like] vote insert error:', insertErr.message);
          return res.status(500).json({ error: 'Failed to cast vote' });
        }
        resultVote = voteType;
      }

      // 투표 수 동기화
      await syncVoteCounts(supabase, tType, tId);

      // 최신 카운트
      const { data: updated } = await supabase
        .from(table)
        .select('upvotes, downvotes')
        .eq('id', tId)
        .single();

      const upvotes = updated?.upvotes || 0;
      const downvotes = updated?.downvotes || 0;

      return res.status(200).json({
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
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[community-like] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
