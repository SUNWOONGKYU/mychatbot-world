// @task S3BA7
/**
 * Community Bookmark API - Vercel Serverless Function
 * GET  /api/Backend_APIs/community-bookmark?post_id=xxx  — 북마크 여부 확인
 * POST /api/Backend_APIs/community-bookmark              — 북마크 토글 (추가/삭제)
 *
 * community_bookmarks 테이블 사용
 * Authorization: Bearer <supabase_access_token> 헤더 필수
 */
import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = ['https://mychatbot.world', 'http://localhost:3000', 'http://localhost:5173'];

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

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes(origin) ? origin : 'https://mychatbot.world');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { supabase, error: configError } = getSupabaseClient();
  if (configError) return res.status(500).json({ error: configError });

  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';

  try {
    // ─── GET: 북마크 여부 확인 ───
    if (req.method === 'GET') {
      const { userId, error: authError } = await authenticate(supabase, authHeader);
      if (authError) return res.status(401).json({ error: authError });

      const { post_id } = req.query;
      if (!post_id) return res.status(400).json({ error: 'Missing required query parameter: post_id' });

      const { data, error } = await supabase
        .from('community_bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', post_id)
        .maybeSingle();

      if (error) {
        console.error('[community-bookmark] get error:', error.message);
        return res.status(500).json({ error: 'Failed to check bookmark' });
      }

      return res.status(200).json({ bookmarked: !!data, bookmark_id: data?.id || null });
    }

    // ─── POST: 북마크 토글 ───
    if (req.method === 'POST') {
      const { userId, error: authError } = await authenticate(supabase, authHeader);
      if (authError) return res.status(401).json({ error: authError });

      const { post_id } = req.body || {};
      if (!post_id) return res.status(400).json({ error: 'Missing required field: post_id' });

      // 기존 북마크 확인
      const { data: existing, error: checkError } = await supabase
        .from('community_bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', post_id)
        .maybeSingle();

      if (checkError) {
        console.error('[community-bookmark] check error:', checkError.message);
        return res.status(500).json({ error: 'Failed to check bookmark' });
      }

      if (existing) {
        // 북마크 삭제
        const { error: deleteError } = await supabase
          .from('community_bookmarks')
          .delete()
          .eq('id', existing.id);

        if (deleteError) {
          console.error('[community-bookmark] delete error:', deleteError.message);
          return res.status(500).json({ error: 'Failed to remove bookmark' });
        }

        return res.status(200).json({ bookmarked: false, action: 'removed' });
      } else {
        // 북마크 추가
        const { data: newBookmark, error: insertError } = await supabase
          .from('community_bookmarks')
          .insert({ user_id: userId, post_id })
          .select('id')
          .single();

        if (insertError) {
          console.error('[community-bookmark] insert error:', insertError.message);
          return res.status(500).json({ error: 'Failed to add bookmark' });
        }

        return res.status(201).json({ bookmarked: true, action: 'added', bookmark_id: newBookmark.id });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[community-bookmark] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
