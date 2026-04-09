// @task S2BA4
/**
 * Usage API - Vercel Serverless Function
 * GET /api/usage
 * 인증된 사용자의 현재 월 usage_logs 집계 조회
 * Authorization: Bearer <supabase_access_token> 헤더 필수
 */
import { createClient } from '@supabase/supabase-js';

const MONTHLY_LIMIT = 1000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

  // Authorization 헤더에서 Bearer 토큰 추출
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: missing Bearer token' });
  }

  try {
    // 서비스 롤 클라이언트로 사용자 검증
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Supabase Auth로 사용자 확인
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
      console.warn('[usage] Auth error:', authError?.message);
      return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
    }

    const userId = userData.user.id;

    // 현재 월의 시작/끝 계산
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    // usage_logs에서 현재 월 사용량 집계
    const { data: logs, error: logsError } = await supabase
      .from('usage_logs')
      .select('tokens_used, message_count')
      .eq('user_id', userId)
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd);

    if (logsError) {
      console.error('[usage] Supabase query error:', logsError.message);
      return res.status(500).json({ error: 'Failed to fetch usage data', detail: logsError.message });
    }

    // 월별 사용량 집계 (message_count 합산, 없으면 rows 수 사용)
    const used = (logs || []).reduce((sum, row) => {
      return sum + (row.message_count ?? 1);
    }, 0);

    const percentage = Math.min(100, Math.round((used / MONTHLY_LIMIT) * 100));

    // 현재 월 레이블 (YYYY-MM)
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return res.status(200).json({
      currentMonth,
      limit: MONTHLY_LIMIT,
      used,
      percentage,
    });
  } catch (err) {
    console.error('[usage] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
