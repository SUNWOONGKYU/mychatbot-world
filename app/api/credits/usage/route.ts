/**
 * @task S5M8
 * @description 크레딧 사용 내역 조회 API
 *
 * GET /api/credits/usage
 * Query: page=1, limit=20
 *
 * mcw_credit_usage 테이블에서 사용 내역 조회
 * 테이블 없으면 mcw_ai_usage 테이블 fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const offset = (page - 1) * limit;

  // mcw_credit_usage 시도
  const { data: usageData, error: usageErr } = await supabase
    .from('mcw_credit_usage')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!usageErr) {
    const items = (usageData ?? []).map((u: any) => ({
      id: u.id,
      description: u.description ?? u.model ?? '크레딧 사용',
      amount: u.amount ?? u.credits_used ?? 0,
      model: u.model ?? null,
      tokens: u.tokens ?? null,
      createdAt: u.created_at,
    }));
    return NextResponse.json({ items, page, limit });
  }

  // fallback: mcw_ai_usage
  const { data: aiData, error: aiErr } = await supabase
    .from('mcw_ai_usage')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!aiErr) {
    const items = (aiData ?? []).map((u: any) => ({
      id: u.id,
      description: u.model ?? '크레딧 사용',
      amount: u.cost ?? u.credits_used ?? 0,
      model: u.model ?? null,
      tokens: u.total_tokens ?? null,
      createdAt: u.created_at,
    }));
    return NextResponse.json({ items, page, limit });
  }

  // 테이블 없음 — 빈 목록 반환
  return NextResponse.json({ items: [], page, limit });
}
