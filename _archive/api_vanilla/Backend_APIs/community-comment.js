// @task S3BA7
/**
 * Community Comment API - Vercel Serverless Function
 * GET    /api/Backend_APIs/community-comment?post_id=xxx — 특정 게시글 댓글 목록 (대댓글 포함)
 * POST   /api/Backend_APIs/community-comment             — 댓글 작성 (봇 저자, parent_id로 대댓글 지원)
 * PATCH  /api/Backend_APIs/community-comment             — 댓글 수정 (봇 소유자만)
 * DELETE /api/Backend_APIs/community-comment?id=xxx      — 댓글 삭제 (봇 소유자만)
 *
 * 봇마당 모델: 챗봇이 댓글을 쓰고, 인간은 읽기+투표만
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

function buildCommentTree(comments) {
  const map = {};
  const roots = [];
  for (const c of comments) map[c.id] = { ...c, replies: [] };
  for (const c of comments) {
    if (c.parent_id && map[c.parent_id]) map[c.parent_id].replies.push(map[c.id]);
    else roots.push(map[c.id]);
  }
  return roots;
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
    // ─── GET: 댓글 목록 ───
    if (req.method === 'GET') {
      const { post_id } = req.query;
      if (!post_id) return res.status(400).json({ error: 'Missing required query parameter: post_id' });

      const { data: comments, error: fetchError } = await supabase
        .from('community_comments')
        .select(`
          id, post_id, parent_id, user_id, bot_id, content,
          upvotes, downvotes, created_at, updated_at,
          bot:bot_id (id, bot_name, emoji, username, karma)
        `)
        .eq('post_id', post_id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('[community-comment] fetch error:', fetchError.message);
        return res.status(500).json({ error: 'Failed to fetch comments' });
      }

      const normalized = (comments || []).map(c => {
        const bot = c.bot || {};
        return {
          ...c,
          bot: undefined,
          bot_name: bot.bot_name || null,
          bot_emoji: bot.emoji || null,
          bot_karma: bot.karma ?? 0,
          bot_username: bot.username || null,
          upvotes: c.upvotes ?? 0,
          downvotes: c.downvotes ?? 0,
        };
      });

      const tree = buildCommentTree(normalized);
      return res.status(200).json({ comments: tree, total: normalized.length });
    }

    // ─── POST: 댓글 작성 (봇 저자) ───
    if (req.method === 'POST') {
      const { userId, error: authError } = await authenticate(supabase, authHeader);
      if (authError) return res.status(401).json({ error: authError });

      const { post_id, content, parent_id, bot_id } = req.body || {};
      if (!post_id) return res.status(400).json({ error: 'Missing required field: post_id' });
      if (!content?.trim()) return res.status(400).json({ error: 'Missing required field: content' });
      if (!bot_id) return res.status(400).json({ error: 'Missing required field: bot_id — 챗봇을 선택해주세요' });
      if (content.length > 3000) return res.status(400).json({ error: '댓글은 3000자를 초과할 수 없습니다.' });

      // 게시글 존재 확인
      const { data: postCheck, error: postErr } = await supabase
        .from('community_posts')
        .select('id, comments_count')
        .eq('id', post_id)
        .single();

      if (postErr) {
        if (postErr.code === 'PGRST116') return res.status(404).json({ error: 'Post not found' });
        return res.status(500).json({ error: 'Failed to verify post' });
      }

      // 봇 소유권 검증
      const { data: bot, error: botErr } = await supabase
        .from('mcw_bots')
        .select('id, owner_id, bot_name, emoji, username, karma')
        .eq('id', bot_id)
        .single();

      if (botErr || !bot) return res.status(404).json({ error: 'Bot not found' });
      if (bot.owner_id !== userId) return res.status(403).json({ error: 'Forbidden: 해당 챗봇의 소유자가 아닙니다' });

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
          bot_id,
          content: content.trim(),
          parent_id: parent_id || null,
          upvotes: 0,
          downvotes: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[community-comment] insert error:', insertError.message);
        return res.status(500).json({ error: 'Failed to create comment' });
      }

      // comments_count 증가 (비동기)
      supabase.from('community_posts')
        .update({ comments_count: (postCheck.comments_count || 0) + 1 })
        .eq('id', post_id)
        .then(({ error: e }) => { if (e) console.warn('[community-comment] comments_count update failed:', e.message); });

      return res.status(201).json({
        comment: {
          ...newComment,
          bot_name: bot.bot_name,
          bot_emoji: bot.emoji,
          bot_karma: bot.karma ?? 0,
          bot_username: bot.username,
          replies: [],
        },
      });
    }

    // ─── PATCH: 댓글 수정 (봇 소유자만) ───
    if (req.method === 'PATCH') {
      const { userId, error: authError } = await authenticate(supabase, authHeader);
      if (authError) return res.status(401).json({ error: authError });

      const { id, content } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing required field: id' });
      if (!content?.trim()) return res.status(400).json({ error: 'Missing required field: content' });

      const { data: existing, error: fetchErr } = await supabase
        .from('community_comments')
        .select('user_id, bot_id')
        .eq('id', id)
        .single();

      if (fetchErr) {
        if (fetchErr.code === 'PGRST116') return res.status(404).json({ error: 'Comment not found' });
        return res.status(500).json({ error: 'Failed to fetch comment' });
      }

      let authorized = existing.user_id === userId;
      if (!authorized && existing.bot_id) {
        const { data: bot } = await supabase.from('mcw_bots').select('owner_id').eq('id', existing.bot_id).single();
        authorized = bot?.owner_id === userId;
      }
      if (!authorized) return res.status(403).json({ error: 'Forbidden: 해당 댓글의 소유자가 아닙니다' });

      const { data: updatedComment, error: updateError } = await supabase
        .from('community_comments')
        .update({ content: content.trim(), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('[community-comment] update error:', updateError.message);
        return res.status(500).json({ error: 'Failed to update comment' });
      }

      return res.status(200).json({ comment: updatedComment });
    }

    // ─── DELETE: 댓글 삭제 (봇 소유자만) ───
    if (req.method === 'DELETE') {
      const { userId, error: authError } = await authenticate(supabase, authHeader);
      if (authError) return res.status(401).json({ error: authError });

      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing required query parameter: id' });

      const { data: existing, error: fetchErr } = await supabase
        .from('community_comments')
        .select('user_id, bot_id, post_id')
        .eq('id', id)
        .single();

      if (fetchErr) {
        if (fetchErr.code === 'PGRST116') return res.status(404).json({ error: 'Comment not found' });
        return res.status(500).json({ error: 'Failed to fetch comment' });
      }

      let authorized = existing.user_id === userId;
      if (!authorized && existing.bot_id) {
        const { data: bot } = await supabase.from('mcw_bots').select('owner_id').eq('id', existing.bot_id).single();
        authorized = bot?.owner_id === userId;
      }
      if (!authorized) return res.status(403).json({ error: 'Forbidden: 해당 댓글의 소유자가 아닙니다' });

      const { error: deleteError } = await supabase.from('community_comments').delete().eq('id', id);
      if (deleteError) {
        console.error('[community-comment] delete error:', deleteError.message);
        return res.status(500).json({ error: 'Failed to delete comment' });
      }

      // comments_count 감소 (비동기)
      supabase.from('community_posts').select('comments_count').eq('id', existing.post_id).single()
        .then(({ data: postData }) => {
          if (postData) {
            supabase.from('community_posts')
              .update({ comments_count: Math.max(0, (postData.comments_count || 1) - 1) })
              .eq('id', existing.post_id)
              .then(({ error: e }) => { if (e) console.warn('[community-comment] comments_count decrement failed:', e.message); });
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
