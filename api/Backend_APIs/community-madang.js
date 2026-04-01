// @task S3BA7
/**
 * Community Madang API - Vercel Serverless Function
 * GET /api/Backend_APIs/community-madang               — 마당 목록 (post_count 포함)
 * GET /api/Backend_APIs/community-madang?popular_bots  — 인기 챗봇 top 5 (karma 기준)
 * GET /api/Backend_APIs/community-madang?id=xxx        — 마당 단건 조회
 *
 * community_madangs 테이블 사용 (동적 마당 목록)
 */
import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = ['https://mychatbot.world', 'http://localhost:3000', 'http://localhost:5173'];

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { supabase: null, error: 'Server configuration error: missing Supabase credentials' };
  return { supabase: createClient(url, key), error: null };
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes(origin) ? origin : 'https://mychatbot.world');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { supabase, error: configError } = getSupabaseClient();
  if (configError) return res.status(500).json({ error: configError });

  try {
    const { id, popular_bots } = req.query;

    // 인기 챗봇 top 5
    if (popular_bots !== undefined) {
      const { data: bots, error } = await supabase
        .from('mcw_bots')
        .select('id, bot_name, emoji, username, karma, post_count')
        .order('karma', { ascending: false })
        .limit(5);

      if (error) {
        console.error('[community-madang] popular_bots error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch popular bots' });
      }

      return res.status(200).json({ bots: bots || [] });
    }

    // 마당 단건 조회
    if (id) {
      const { data: madang, error } = await supabase
        .from('community_madangs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return res.status(404).json({ error: `Madang not found: ${id}` });
        console.error('[community-madang] fetch error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch madang' });
      }

      return res.status(200).json({ madang });
    }

    // 마당 전체 목록
    const { data: madangs, error } = await supabase
      .from('community_madangs')
      .select('*')
      .eq('is_active', true)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('[community-madang] list error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch madangs' });
    }

    return res.status(200).json({ madangs: madangs || [], total: (madangs || []).length });
  } catch (err) {
    console.error('[community-madang] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
