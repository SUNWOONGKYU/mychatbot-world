// @task S3BA7
/**
 * Community Post API - Vercel Serverless Function
 * GET    /api/Backend_APIs/community-post          — 게시글 목록 (카테고리 필터, 페이지네이션, 정렬)
 * GET    /api/Backend_APIs/community-post?id=xxx   — 게시글 상세 (views_count 증가)
 * POST   /api/Backend_APIs/community-post          — 게시글 작성 (인증 필수)
 * PATCH  /api/Backend_APIs/community-post          — 게시글 수정 (작성자만)
 * DELETE /api/Backend_APIs/community-post          — 게시글 삭제 (작성자만)
 *
 * community_posts 테이블 사용
 * Authorization: Bearer <supabase_access_token> 헤더 (쓰기/삭제 시 필수)
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { supabase, error: configError } = getSupabaseClient();
  if (configError) return res.status(500).json({ error: configError });

  try {
    // ─── GET: 게시글 목록 또는 상세 ───
    if (req.method === 'GET') {
      const { id, category, page = '1', limit = '20', sort = 'created_at' } = req.query;

      // 상세 조회
      if (id) {
        const { data: post, error: fetchError } = await supabase
          .from('community_posts')
          .select('*, author:user_id(id, email)')
          .eq('id', id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') return res.status(404).json({ error: 'Post not found' });
          console.error('[community-post] fetch error:', fetchError.message);
          return res.status(500).json({ error: 'Failed to fetch post', detail: fetchError.message });
        }

        // 조회수 증가 (비동기, 실패 무시)
        supabase
          .from('community_posts')
          .update({ views_count: (post.views_count || 0) + 1 })
          .eq('id', id)
          .then(({ error: updateErr }) => {
            if (updateErr) console.warn('[community-post] views_count update failed:', updateErr.message);
          });

        return res.status(200).json({ post: { ...post, views_count: (post.views_count || 0) + 1 } });
      }

      // 목록 조회
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const offset = (pageNum - 1) * limitNum;
      const allowedSorts = ['created_at', 'updated_at', 'likes_count', 'views_count', 'comments_count'];
      const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';

      let query = supabase
        .from('community_posts')
        .select('id, title, category, user_id, likes_count, views_count, comments_count, created_at, updated_at', { count: 'exact' })
        .order(sortCol, { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (category) query = query.eq('category', category);

      const { data: posts, count, error: listError } = await query;
      if (listError) {
        console.error('[community-post] list error:', listError.message);
        return res.status(500).json({ error: 'Failed to fetch posts', detail: listError.message });
      }

      return res.status(200).json({
        posts: posts || [],
        pagination: { page: pageNum, limit: limitNum, total: count || 0, totalPages: Math.ceil((count || 0) / limitNum) },
      });
    }

    // ─── POST: 게시글 작성 (인증 필수) ───
    if (req.method === 'POST') {
      const { userId, error: authError } = await authenticate(supabase, req.headers['authorization'] || req.headers['Authorization'] || '');
      if (authError) return res.status(401).json({ error: authError });

      const { title, content, category } = req.body || {};
      if (!title || !title.trim()) return res.status(400).json({ error: 'Missing required field: title' });
      if (!content || !content.trim()) return res.status(400).json({ error: 'Missing required field: content' });
      if (!category || !category.trim()) return res.status(400).json({ error: 'Missing required field: category' });

      const { data: newPost, error: insertError } = await supabase
        .from('community_posts')
        .insert({
          title: title.trim(),
          content: content.trim(),
          category: category.trim(),
          user_id: userId,
          likes_count: 0,
          views_count: 0,
          comments_count: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[community-post] insert error:', insertError.message);
        return res.status(500).json({ error: 'Failed to create post', detail: insertError.message });
      }

      return res.status(201).json({ post: newPost });
    }

    // ─── PATCH: 게시글 수정 (작성자만) ───
    if (req.method === 'PATCH') {
      const { userId, error: authError } = await authenticate(supabase, req.headers['authorization'] || req.headers['Authorization'] || '');
      if (authError) return res.status(401).json({ error: authError });

      const { id, title, content, category } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing required field: id' });

      // 작성자 확인
      const { data: existing, error: fetchErr } = await supabase
        .from('community_posts')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchErr) {
        if (fetchErr.code === 'PGRST116') return res.status(404).json({ error: 'Post not found' });
        return res.status(500).json({ error: 'Failed to fetch post', detail: fetchErr.message });
      }
      if (existing.user_id !== userId) return res.status(403).json({ error: 'Forbidden: you are not the author of this post' });

      const updates = { updated_at: new Date().toISOString() };
      if (title && title.trim()) updates.title = title.trim();
      if (content && content.trim()) updates.content = content.trim();
      if (category && category.trim()) updates.category = category.trim();

      const { data: updatedPost, error: updateError } = await supabase
        .from('community_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('[community-post] update error:', updateError.message);
        return res.status(500).json({ error: 'Failed to update post', detail: updateError.message });
      }

      return res.status(200).json({ post: updatedPost });
    }

    // ─── DELETE: 게시글 삭제 (작성자만) ───
    if (req.method === 'DELETE') {
      const { userId, error: authError } = await authenticate(supabase, req.headers['authorization'] || req.headers['Authorization'] || '');
      if (authError) return res.status(401).json({ error: authError });

      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing required query parameter: id' });

      // 작성자 확인
      const { data: existing, error: fetchErr } = await supabase
        .from('community_posts')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchErr) {
        if (fetchErr.code === 'PGRST116') return res.status(404).json({ error: 'Post not found' });
        return res.status(500).json({ error: 'Failed to fetch post', detail: fetchErr.message });
      }
      if (existing.user_id !== userId) return res.status(403).json({ error: 'Forbidden: you are not the author of this post' });

      const { error: deleteError } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('[community-post] delete error:', deleteError.message);
        return res.status(500).json({ error: 'Failed to delete post', detail: deleteError.message });
      }

      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[community-post] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
