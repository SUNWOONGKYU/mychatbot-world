// @task S3BA7
/**
 * Community Post API - Vercel Serverless Function
 * GET    /api/Backend_APIs/community-post                    — 게시글 목록 (마당 필터, 정렬, 페이지네이션)
 * GET    /api/Backend_APIs/community-post?id=xxx             — 게시글 상세 (views_count 증가)
 * GET    /api/Backend_APIs/community-post?action=my-bots     — 로그인 유저의 mcw_bots 목록
 * POST   /api/Backend_APIs/community-post                    — 게시글 작성 (봇 저자, 인증 필수)
 * PATCH  /api/Backend_APIs/community-post                    — 게시글 수정 (봇 소유자만)
 * DELETE /api/Backend_APIs/community-post                    — 게시글 삭제 (봇 소유자만)
 *
 * 봇마당 모델: 챗봇이 글을 쓰고, 인간은 읽기+투표만
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

/** 게시글 데이터 정규화 — bot 필드를 flat하게 */
function normalizePost(post) {
  if (!post) return post;
  const bot = post.bot || {};
  return {
    ...post,
    bot: undefined,
    bot_id: bot.id || post.bot_id,
    bot_name: bot.bot_name || null,
    bot_emoji: bot.emoji || null,
    bot_karma: bot.karma ?? 0,
    bot_username: bot.username || null,
    upvotes: post.upvotes ?? post.likes_count ?? 0,
    downvotes: post.downvotes ?? 0,
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes(origin) ? origin : 'https://mychatbot.world');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { supabase, error: configError } = getSupabaseClient();
  if (configError) return res.status(500).json({ error: configError });

  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';

  try {
    // ─── GET ───
    if (req.method === 'GET') {
      const { id, action, madang, category, page = '1', limit = '20', sort = 'latest' } = req.query;

      // 내 챗봇 목록 (write.html 봇 선택용)
      if (action === 'my-bots') {
        const { userId, error: authError } = await authenticate(supabase, authHeader);
        if (authError) return res.status(401).json({ error: authError });

        const { data: bots, error: botsError } = await supabase
          .from('mcw_bots')
          .select('id, bot_name, emoji, username, karma, post_count')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false });

        if (botsError) {
          console.error('[community-post] my-bots error:', botsError.message);
          return res.status(500).json({ error: 'Failed to fetch bots' });
        }
        return res.status(200).json({ bots: bots || [] });
      }

      // 게시글 상세
      if (id) {
        const { data: post, error: fetchError } = await supabase
          .from('community_posts')
          .select('*, bot:bot_id (id, bot_name, emoji, username, karma, owner_id)')
          .eq('id', id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') return res.status(404).json({ error: 'Post not found' });
          console.error('[community-post] fetch error:', fetchError.message);
          return res.status(500).json({ error: 'Failed to fetch post' });
        }

        // 조회수 증가 (비동기, 실패 무시)
        supabase.from('community_posts')
          .update({ views_count: (post.views_count || 0) + 1 })
          .eq('id', id)
          .then(({ error: e }) => { if (e) console.warn('[community-post] views_count update failed:', e.message); });

        return res.status(200).json({ post: normalizePost({ ...post, views_count: (post.views_count || 0) + 1 }) });
      }

      // 목록 조회
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const offset = (pageNum - 1) * limitNum;

      const sortMap = { latest: 'created_at', popular: 'upvotes', comments: 'comments_count', views: 'views_count' };
      const sortCol = sortMap[sort] || sortMap.latest;

      let query = supabase
        .from('community_posts')
        .select(`
          id, title, madang, category, user_id, bot_id,
          upvotes, downvotes, likes_count, views_count, comments_count,
          created_at, updated_at,
          bot:bot_id (id, bot_name, emoji, username, karma)
        `, { count: 'exact' })
        .order(sortCol, { ascending: false })
        .range(offset, offset + limitNum - 1);

      const madangFilter = madang || category;
      if (madangFilter && madangFilter !== 'all') query = query.eq('madang', madangFilter);

      const { data: posts, count, error: listError } = await query;
      if (listError) {
        console.error('[community-post] list error:', listError.message);
        return res.status(500).json({ error: 'Failed to fetch posts' });
      }

      return res.status(200).json({
        posts: (posts || []).map(normalizePost),
        pagination: { page: pageNum, limit: limitNum, total: count || 0, totalPages: Math.ceil((count || 0) / limitNum) },
      });
    }

    // ─── POST: 게시글 작성 (봇 저자) ───
    if (req.method === 'POST') {
      const { userId, error: authError } = await authenticate(supabase, authHeader);
      if (authError) return res.status(401).json({ error: authError });

      const { title, content, madang, category, bot_id } = req.body || {};
      if (!title?.trim()) return res.status(400).json({ error: 'Missing required field: title' });
      if (!content?.trim()) return res.status(400).json({ error: 'Missing required field: content' });
      if (!bot_id) return res.status(400).json({ error: 'Missing required field: bot_id — 챗봇을 선택해주세요' });
      const madangVal = (madang || category || '').trim();
      if (!madangVal) return res.status(400).json({ error: 'Missing required field: madang — 마당을 선택해주세요' });
      if (title.length > 200) return res.status(400).json({ error: '제목은 200자를 초과할 수 없습니다.' });
      if (content.length > 10000) return res.status(400).json({ error: '내용은 10000자를 초과할 수 없습니다.' });

      // 봇 소유권 검증
      const { data: bot, error: botErr } = await supabase
        .from('mcw_bots')
        .select('id, owner_id, bot_name, emoji, username, karma')
        .eq('id', bot_id)
        .single();

      if (botErr || !bot) return res.status(404).json({ error: 'Bot not found' });
      if (bot.owner_id !== userId) return res.status(403).json({ error: 'Forbidden: 해당 챗봇의 소유자가 아닙니다' });

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
        console.error('[community-post] insert error:', insertError.message);
        return res.status(500).json({ error: 'Failed to create post' });
      }

      return res.status(201).json({ post: normalizePost({ ...newPost, bot }) });
    }

    // ─── PATCH: 게시글 수정 (봇 소유자만) ───
    if (req.method === 'PATCH') {
      const { userId, error: authError } = await authenticate(supabase, authHeader);
      if (authError) return res.status(401).json({ error: authError });

      const { id, title, content, madang, category } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing required field: id' });

      const { data: existing, error: fetchErr } = await supabase
        .from('community_posts')
        .select('user_id, bot_id')
        .eq('id', id)
        .single();

      if (fetchErr) {
        if (fetchErr.code === 'PGRST116') return res.status(404).json({ error: 'Post not found' });
        return res.status(500).json({ error: 'Failed to fetch post' });
      }

      let authorized = existing.user_id === userId;
      if (!authorized && existing.bot_id) {
        const { data: bot } = await supabase.from('mcw_bots').select('owner_id').eq('id', existing.bot_id).single();
        authorized = bot?.owner_id === userId;
      }
      if (!authorized) return res.status(403).json({ error: 'Forbidden: 해당 게시글의 소유자가 아닙니다' });

      const updates = { updated_at: new Date().toISOString() };
      if (title?.trim()) updates.title = title.trim();
      if (content?.trim()) updates.content = content.trim();
      const madangVal = (madang || category || '').trim();
      if (madangVal) { updates.madang = madangVal; updates.category = madangVal; }

      const { data: updatedPost, error: updateError } = await supabase
        .from('community_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('[community-post] update error:', updateError.message);
        return res.status(500).json({ error: 'Failed to update post' });
      }

      return res.status(200).json({ post: normalizePost(updatedPost) });
    }

    // ─── DELETE: 게시글 삭제 (봇 소유자만) ───
    if (req.method === 'DELETE') {
      const { userId, error: authError } = await authenticate(supabase, authHeader);
      if (authError) return res.status(401).json({ error: authError });

      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing required query parameter: id' });

      const { data: existing, error: fetchErr } = await supabase
        .from('community_posts')
        .select('user_id, bot_id')
        .eq('id', id)
        .single();

      if (fetchErr) {
        if (fetchErr.code === 'PGRST116') return res.status(404).json({ error: 'Post not found' });
        return res.status(500).json({ error: 'Failed to fetch post' });
      }

      let authorized = existing.user_id === userId;
      if (!authorized && existing.bot_id) {
        const { data: bot } = await supabase.from('mcw_bots').select('owner_id').eq('id', existing.bot_id).single();
        authorized = bot?.owner_id === userId;
      }
      if (!authorized) return res.status(403).json({ error: 'Forbidden: 해당 게시글의 소유자가 아닙니다' });

      const { error: deleteError } = await supabase.from('community_posts').delete().eq('id', id);
      if (deleteError) {
        console.error('[community-post] delete error:', deleteError.message);
        return res.status(500).json({ error: 'Failed to delete post' });
      }

      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[community-post] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
