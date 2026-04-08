// @task S3BA6
/**
 * Job List API - Vercel Serverless Function
 * GET /api/Backend_APIs/job-list
 *
 * 구봇구직 챗봇 목록/검색 API
 * - job_postings 테이블에서 목록 조회
 * - 필터: status
 * - 검색: title, description 텍스트 검색 (ilike)
 * - 정렬: created_at, budget_min, budget_max, title
 * - 페이지네이션: offset, limit (기본 20개)
 */
import { createClient } from '@supabase/supabase-js';

/** 허용된 정렬 컬럼 화이트리스트 (SQL 인젝션 방지) */
const ALLOWED_ORDER_BY = ['created_at', 'budget_min', 'budget_max', 'title'];

/** 허용된 status 값 */
const ALLOWED_STATUSES = ['open', 'closed', 'filled'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', (req.headers.origin && ['https://mychatbot.world', 'http://localhost:3000', 'http://localhost:5173'].includes(req.headers.origin)) ? req.headers.origin : 'https://mychatbot.world');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server configuration error: missing Supabase credentials' });
  }

  const {
    status,
    search,
    order_by = 'created_at',
    order_dir = 'desc',
    offset: rawOffset = '0',
    limit: rawLimit = '20',
  } = req.query;

  // 파라미터 유효성 검증
  if (status && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
  }

  if (!ALLOWED_ORDER_BY.includes(order_by)) {
    return res.status(400).json({ error: `Invalid order_by. Allowed: ${ALLOWED_ORDER_BY.join(', ')}` });
  }

  const offset = Math.max(0, parseInt(rawOffset, 10) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(rawLimit, 10) || 20));

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let query = supabase
      .from('job_postings')
      .select(`
        id,
        employer_id,
        title,
        description,
        required_skills,
        budget_min,
        budget_max,
        status,
        created_at,
        updated_at
      `, { count: 'exact' });

    // 필터 적용
    if (status) {
      query = query.eq('status', status);
    } else {
      // status 미지정 시 기본적으로 open만 조회
      query = query.eq('status', 'open');
    }

    // 텍스트 검색 (title 또는 description)
    if (search && search.trim()) {
      const keyword = search.trim();
      query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    // 정렬
    const ascending = order_dir.toLowerCase() !== 'desc';
    query = query.order(order_by, { ascending });

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[job-list] Query error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch job list', detail: 'Internal server error' });
    }

    return res.status(200).json({
      jobs: data || [],
      pagination: {
        total: count ?? 0,
        offset,
        limit,
        hasMore: (count ?? 0) > offset + limit,
      },
    });
  } catch (err) {
    console.error('[job-list] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
