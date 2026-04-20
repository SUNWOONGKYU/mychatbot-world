/**
 * @task BOT1
 * @description 공개 봇 카탈로그 API (인증 불필요)
 *
 * GET /api/bots/public — 배포된 공개 봇 목록
 *   쿼리: category, sort(popular|latest|rating), limit, offset
 *   응답: { bots: PublicBot[], total: number }
 *
 * 테이블: mcw_bots (deploy_url IS NOT NULL = 배포됨)
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

// 공개 엔드포인트: 임베드/외부 위젯 호환을 위해 CORS 허용
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
} as const;

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

interface PublicBot {
  id: string;
  username: string;
  bot_name: string;
  bot_desc: string | null;
  emoji: string | null;
  category: string | null;
  deploy_url: string | null;
  karma: number | null;
  chat_count: number | null;
  avg_rating: number | null;
  created_at: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);

  const category  = searchParams.get('category') || '';
  const sort      = searchParams.get('sort') || 'popular';
  const rawLimit  = searchParams.get('limit');
  const rawOffset = searchParams.get('offset');

  const limit  = Math.min(parseInt(rawLimit  ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = Math.max(parseInt(rawOffset ?? '0', 10) || 0, 0);

  const supabase = getSupabase();

  try {
    let query = supabase
      .from('mcw_bots')
      .select('id, username, bot_name, bot_desc, emoji, category, deploy_url, karma, chat_count, avg_rating, created_at', { count: 'exact' })
      .not('deploy_url', 'is', null);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (sort === 'latest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'rating') {
      query = query.order('avg_rating', { ascending: false, nullsFirst: false });
    } else {
      // popular: karma 기준
      query = query.order('karma', { ascending: false, nullsFirst: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[bots/public GET] Supabase error:', error.message);
      return NextResponse.json({ error: '봇 목록 조회에 실패했습니다.' }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json({ bots: (data ?? []) as PublicBot[], total: count ?? 0 }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error('[bots/public GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}
