// @task S2BA4
/**
 * Bot Templates API - Vercel Serverless Function
 * GET /api/templates
 * bot_templates 테이블에서 활성 템플릿 목록 조회
 * 쿼리 파라미터: category (선택적 필터)
 */
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server configuration error: missing Supabase credentials' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { category } = req.query;

    // is_active=true인 템플릿 조회, category 필터 선택적 적용
    let query = supabase
      .from('bot_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[templates] Supabase query error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch templates', detail: error.message });
    }

    return res.status(200).json({
      templates: data || [],
    });
  } catch (err) {
    console.error('[templates] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
