// @task S3BA7
/**
 * Community Like API - Vercel Serverless Function
 * POST /api/Backend_APIs/community-like            — 좋아요 토글 (이미 좋아요면 취소, 아니면 추가)
 * GET  /api/Backend_APIs/community-like?post_id=xxx — 좋아요 수 조회 (+ 현재 사용자 좋아요 여부)
 *
 * community_post_likes 테이블 사용 (user_id + post_id 복합 유니크)
 * community_posts.likes_count 동기화
 * POST 시 Authorization: Bearer <supabase_access_token> 헤더 필수
 */
import { createClient } from '@supabase/supabase-js';

/** @returns {{ supabase: import('@supabase/supabase-js').SupabaseClient, error: string|null }} */
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { supabase: null, error: 'Server configuration error: missing Supabase credentials' };
  return { supabase: createClient(url, key), error: null };
}

/**
 * Bearer 토큰으로 Supabase 사용자를 인증한다.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} authHeader
 * @returns {Promise<{userId: string|null, error: string|null}>}
 */
async function authenticate(supabase, authHeader) {
  const token = (authHeader || '').startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { userId: null, error: 'Unauthorized: missing Bearer token' };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { userId: null, error: 'Unauthorized: invalid or expired token' };
  return { userId: data.user.id, error: null };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { supabase, error: configError } = getSupabaseClient();
  if (configError) return res.status(500).json({ error: configError });

  try {
    // ─── GET: 좋아요 수 조회 (+ 현재 사용자 좋아요 여부) ───
    if (req.method === 'GET') {
      const { post_id } = req.query;
      if (!post_id) return res.status(400).json({ error: 'Missing required query parameter: post_id' });

      // 게시글의 likes_count 조회
      const { data: post, error: postErr } = await supabase
        .from('community_posts')
        .select('likes_count')
        .eq('id', post_id)
        .single();

      if (postErr) {
        if (postErr.code === 'PGRST116') return res.status(404).json({ error: 'Post not found' });
        return res.status(500).json({ error: 'Failed to fetch post', detail: postErr.message });
      }

      // 현재 사용자 좋아요 여부 (토큰이 있는 경우)
      let isLiked = false;
      const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (token) {
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user) {
          const { data: likeRow } = await supabase
            .from('community_post_likes')
            .select('id')
            .eq('post_id', post_id)
            .eq('user_id', userData.user.id)
            .maybeSingle();
          isLiked = !!likeRow;
        }
      }

      return res.status(200).json({
        post_id,
        likes_count: post.likes_count || 0,
        is_liked: isLiked,
      });
    }

    // ─── POST: 좋아요 토글 (인증 필수) ───
    if (req.method === 'POST') {
      const { userId, error: authError } = await authenticate(supabase, req.headers['authorization'] || req.headers['Authorization'] || '');
      if (authError) return res.status(401).json({ error: authError });

      const { post_id } = req.body || {};
      if (!post_id) return res.status(400).json({ error: 'Missing required field: post_id' });

      // 게시글 존재 + 현재 likes_count 조회
      const { data: post, error: postErr } = await supabase
        .from('community_posts')
        .select('id, likes_count')
        .eq('id', post_id)
        .single();

      if (postErr) {
        if (postErr.code === 'PGRST116') return res.status(404).json({ error: 'Post not found' });
        return res.status(500).json({ error: 'Failed to fetch post', detail: postErr.message });
      }

      // 이미 좋아요했는지 확인
      const { data: existingLike, error: likeCheckErr } = await supabase
        .from('community_post_likes')
        .select('id')
        .eq('post_id', post_id)
        .eq('user_id', userId)
        .maybeSingle();

      if (likeCheckErr) {
        console.error('[community-like] like check error:', likeCheckErr.message);
        return res.status(500).json({ error: 'Failed to check like status', detail: likeCheckErr.message });
      }

      let liked;
      let newLikesCount;

      if (existingLike) {
        // 이미 좋아요 → 취소
        const { error: deleteErr } = await supabase
          .from('community_post_likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteErr) {
          console.error('[community-like] unlike error:', deleteErr.message);
          return res.status(500).json({ error: 'Failed to remove like', detail: deleteErr.message });
        }
        liked = false;
        newLikesCount = Math.max(0, (post.likes_count || 1) - 1);
      } else {
        // 좋아요 없음 → 추가
        const { error: insertErr } = await supabase
          .from('community_post_likes')
          .insert({ post_id, user_id: userId });

        if (insertErr) {
          console.error('[community-like] like insert error:', insertErr.message);
          return res.status(500).json({ error: 'Failed to add like', detail: insertErr.message });
        }
        liked = true;
        newLikesCount = (post.likes_count || 0) + 1;
      }

      // community_posts.likes_count 동기화
      const { error: updateErr } = await supabase
        .from('community_posts')
        .update({ likes_count: newLikesCount })
        .eq('id', post_id);

      if (updateErr) {
        console.warn('[community-like] likes_count sync failed:', updateErr.message);
        // 카운트 동기화 실패해도 토글 자체는 성공으로 처리
      }

      return res.status(200).json({
        post_id,
        liked,
        likes_count: newLikesCount,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[community-like] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
