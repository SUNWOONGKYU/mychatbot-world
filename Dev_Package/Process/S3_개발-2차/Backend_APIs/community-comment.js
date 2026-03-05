// @task S3BA7
/**
 * Community Comment API - Vercel Serverless Function
 * GET    /api/Backend_APIs/community-comment?post_id=xxx — 특정 게시글 댓글 목록 (대댓글 포함)
 * POST   /api/Backend_APIs/community-comment             — 댓글 작성 (parent_id로 대댓글 지원)
 * PATCH  /api/Backend_APIs/community-comment             — 댓글 수정 (작성자만)
 * DELETE /api/Backend_APIs/community-comment?id=xxx      — 댓글 삭제 (작성자만)
 *
 * community_comments 테이블 사용
 * 작성/수정/삭제 시 Authorization: Bearer <supabase_access_token> 헤더 필수
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

/**
 * 평탄한 댓글 배열을 계층형 트리 구조로 변환한다.
 * parent_id가 null인 댓글이 루트이고, 나머지는 replies 배열로 중첩된다.
 * @param {Array<Object>} comments
 * @returns {Array<Object>}
 */
function buildCommentTree(comments) {
  const map = {};
  const roots = [];

  for (const c of comments) {
    map[c.id] = { ...c, replies: [] };
  }

  for (const c of comments) {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  }

  return roots;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { supabase, error: configError } = getSupabaseClient();
  if (configError) return res.status(500).json({ error: configError });

  try {
    // ─── GET: 특정 게시글의 댓글 목록 (대댓글 포함) ───
    if (req.method === 'GET') {
      const { post_id } = req.query;
      if (!post_id) return res.status(400).json({ error: 'Missing required query parameter: post_id' });

      const { data: comments, error: fetchError } = await supabase
        .from('community_comments')
        .select('id, post_id, parent_id, user_id, content, created_at, updated_at')
        .eq('post_id', post_id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('[community-comment] fetch error:', fetchError.message);
        return res.status(500).json({ error: 'Failed to fetch comments', detail: fetchError.message });
      }

      const tree = buildCommentTree(comments || []);
      return res.status(200).json({ comments: tree, total: (comments || []).length });
    }

    // ─── POST: 댓글 작성 (인증 필수) ───
    if (req.method === 'POST') {
      const { userId, error: authError } = await authenticate(supabase, req.headers['authorization'] || req.headers['Authorization'] || '');
      if (authError) return res.status(401).json({ error: authError });

      const { post_id, content, parent_id } = req.body || {};
      if (!post_id) return res.status(400).json({ error: 'Missing required field: post_id' });
      if (!content || !content.trim()) return res.status(400).json({ error: 'Missing required field: content' });

      // 게시글 존재 여부 확인
      const { data: postCheck, error: postErr } = await supabase
        .from('community_posts')
        .select('id, comments_count')
        .eq('id', post_id)
        .single();

      if (postErr) {
        if (postErr.code === 'PGRST116') return res.status(404).json({ error: 'Post not found' });
        return res.status(500).json({ error: 'Failed to verify post', detail: postErr.message });
      }

      // parent_id 유효성 검사 (대댓글인 경우)
      if (parent_id) {
        const { data: parentCheck, error: parentErr } = await supabase
          .from('community_comments')
          .select('id')
          .eq('id', parent_id)
          .eq('post_id', post_id)
          .single();

        if (parentErr || !parentCheck) {
          return res.status(400).json({ error: 'Invalid parent_id: parent comment not found in this post' });
        }
      }

      const { data: newComment, error: insertError } = await supabase
        .from('community_comments')
        .insert({
          post_id,
          user_id: userId,
          content: content.trim(),
          parent_id: parent_id || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[community-comment] insert error:', insertError.message);
        return res.status(500).json({ error: 'Failed to create comment', detail: insertError.message });
      }

      // 게시글 comments_count 증가 (비동기, 실패 무시)
      supabase
        .from('community_posts')
        .update({ comments_count: (postCheck.comments_count || 0) + 1 })
        .eq('id', post_id)
        .then(({ error: cntErr }) => {
          if (cntErr) console.warn('[community-comment] comments_count update failed:', cntErr.message);
        });

      return res.status(201).json({ comment: newComment });
    }

    // ─── PATCH: 댓글 수정 (작성자만) ───
    if (req.method === 'PATCH') {
      const { userId, error: authError } = await authenticate(supabase, req.headers['authorization'] || req.headers['Authorization'] || '');
      if (authError) return res.status(401).json({ error: authError });

      const { id, content } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing required field: id' });
      if (!content || !content.trim()) return res.status(400).json({ error: 'Missing required field: content' });

      // 작성자 확인
      const { data: existing, error: fetchErr } = await supabase
        .from('community_comments')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchErr) {
        if (fetchErr.code === 'PGRST116') return res.status(404).json({ error: 'Comment not found' });
        return res.status(500).json({ error: 'Failed to fetch comment', detail: fetchErr.message });
      }
      if (existing.user_id !== userId) return res.status(403).json({ error: 'Forbidden: you are not the author of this comment' });

      const { data: updatedComment, error: updateError } = await supabase
        .from('community_comments')
        .update({ content: content.trim(), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('[community-comment] update error:', updateError.message);
        return res.status(500).json({ error: 'Failed to update comment', detail: updateError.message });
      }

      return res.status(200).json({ comment: updatedComment });
    }

    // ─── DELETE: 댓글 삭제 (작성자만) ───
    if (req.method === 'DELETE') {
      const { userId, error: authError } = await authenticate(supabase, req.headers['authorization'] || req.headers['Authorization'] || '');
      if (authError) return res.status(401).json({ error: authError });

      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing required query parameter: id' });

      // 작성자 확인
      const { data: existing, error: fetchErr } = await supabase
        .from('community_comments')
        .select('user_id, post_id')
        .eq('id', id)
        .single();

      if (fetchErr) {
        if (fetchErr.code === 'PGRST116') return res.status(404).json({ error: 'Comment not found' });
        return res.status(500).json({ error: 'Failed to fetch comment', detail: fetchErr.message });
      }
      if (existing.user_id !== userId) return res.status(403).json({ error: 'Forbidden: you are not the author of this comment' });

      const { error: deleteError } = await supabase
        .from('community_comments')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('[community-comment] delete error:', deleteError.message);
        return res.status(500).json({ error: 'Failed to delete comment', detail: deleteError.message });
      }

      // 게시글 comments_count 감소 (비동기, 실패 무시)
      supabase
        .from('community_posts')
        .select('comments_count')
        .eq('id', existing.post_id)
        .single()
        .then(({ data: postData }) => {
          if (postData) {
            supabase
              .from('community_posts')
              .update({ comments_count: Math.max(0, (postData.comments_count || 1) - 1) })
              .eq('id', existing.post_id)
              .then(({ error: cntErr }) => {
                if (cntErr) console.warn('[community-comment] comments_count decrement failed:', cntErr.message);
              });
          }
        });

      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[community-comment] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
