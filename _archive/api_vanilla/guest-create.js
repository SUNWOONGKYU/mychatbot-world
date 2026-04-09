// @task S2BA4
/**
 * Guest Create API - Vercel Serverless Function
 * POST /api/guest-create
 * 로그인 없이 임시 게스트 봇 세션 생성
 * - 게스트 세션 ID (UUID) 발급
 * - mcw_bots 테이블에 임시 봇 레코드 저장
 * - 24시간 후 만료
 */
import { createClient } from '@supabase/supabase-js';

const GUEST_TTL_HOURS = 24;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server configuration error: missing Supabase credentials' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 게스트 세션 ID 생성
    const guestSessionId = crypto.randomUUID();

    // 만료 시각 계산 (24시간 후)
    const expiresAt = new Date(Date.now() + GUEST_TTL_HOURS * 60 * 60 * 1000).toISOString();

    const { botName, templateId } = req.body || {};

    // mcw_bots 테이블에 임시 봇 레코드 삽입
    const { data, error } = await supabase
      .from('mcw_bots')
      .insert({
        bot_name: botName || '게스트 체험 봇',
        guest_session_id: guestSessionId,
        is_guest: true,
        expires_at: expiresAt,
        template_id: templateId || null,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[guest-create] Supabase insert error:', error.message);
      return res.status(500).json({ error: 'Failed to create guest bot', detail: error.message });
    }

    return res.status(200).json({
      botId: data.id,
      guestSessionId,
      expiresAt,
    });
  } catch (err) {
    console.error('[guest-create] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
