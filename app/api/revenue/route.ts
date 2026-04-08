/**
 * @task S4BA1
 * @description 수익 API — 봇 소유자 매출 요약 조회 (일별/월별 집계)
 *
 * GET /api/revenue — 매출 요약 조회 (인증 필수, 소유자 본인만)
 *   쿼리: period=daily|monthly, from=YYYY-MM-DD, to=YYYY-MM-DD, bot_id=uuid
 *   응답: { summary: RevenueSummary, daily?: DailyRevenue[], monthly?: MonthlyRevenue[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================
// 타입 정의
// ============================

interface RevenueSummary {
  total_gross: number;
  total_platform_fee: number;
  total_net: number;
  total_transactions: number;
  unsettled_net: number;
  currency: string;
}

interface DailyRevenue {
  date: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  transaction_count: number;
}

interface MonthlyRevenue {
  year: number;
  month: number;
  month_label: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  transaction_count: number;
}

// ============================
// Supabase 서버 클라이언트
// ============================

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, serviceKey);
}

// ============================
// 인증 헬퍼
// ============================

async function authenticate(
  req: NextRequest
): Promise<{ userId: string } | { error: string; status: number }> {
  const supabase = getSupabaseServer();
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return { error: 'Unauthorized: Bearer 토큰이 필요합니다', status: 401 };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { error: 'Unauthorized: 유효하지 않거나 만료된 토큰입니다', status: 401 };
  }

  return { userId: data.user.id };
}

// ============================
// 상수
// ============================

const ALLOWED_PERIODS = ['daily', 'monthly'] as const;
type Period = typeof ALLOWED_PERIODS[number];

// ============================
// GET /api/revenue
// ============================

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseServer();

  const auth = await authenticate(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { userId } = auth;

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get('period') ?? 'monthly') as Period;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const bot_id = searchParams.get('bot_id');

  // period 파라미터 검증
  if (!ALLOWED_PERIODS.includes(period)) {
    return NextResponse.json(
      { error: `Invalid period. Allowed: ${ALLOWED_PERIODS.join(', ')}` },
      { status: 400 }
    );
  }

  // 날짜 파라미터 검증
  if (from && isNaN(Date.parse(from))) {
    return NextResponse.json({ error: 'Invalid from date. Use YYYY-MM-DD format.' }, { status: 400 });
  }
  if (to && isNaN(Date.parse(to))) {
    return NextResponse.json({ error: 'Invalid to date. Use YYYY-MM-DD format.' }, { status: 400 });
  }
  if (from && to && new Date(from) > new Date(to)) {
    return NextResponse.json({ error: 'from date must be before or equal to to date.' }, { status: 400 });
  }

  try {
    // 기본 쿼리 빌더 — creator_id로 소유자 필터링
    let baseQuery = supabase
      .from('mcw_revenue')
      .select('*')
      .eq('creator_id', userId);

    if (bot_id) {
      baseQuery = baseQuery.eq('bot_id', bot_id);
    }
    if (from) {
      baseQuery = baseQuery.gte('created_at', `${from}T00:00:00.000Z`);
    }
    if (to) {
      baseQuery = baseQuery.lte('created_at', `${to}T23:59:59.999Z`);
    }

    const { data: rows, error: fetchError } = await baseQuery.order('created_at', { ascending: true });

    if (fetchError) {
      console.error('[revenue GET] Supabase error:', fetchError.message);
      return NextResponse.json({ error: '매출 데이터 조회에 실패했습니다' }, { status: 500 });
    }

    const records = rows ?? [];

    // ── 요약 집계
    const summary: RevenueSummary = records.reduce(
      (acc, r) => {
        acc.total_gross += Number(r.gross_amount ?? 0);
        acc.total_platform_fee += Number(r.platform_fee ?? 0);
        acc.total_net += Number(r.net_amount ?? 0);
        acc.total_transactions += 1;
        if (!r.settled) {
          acc.unsettled_net += Number(r.net_amount ?? 0);
        }
        return acc;
      },
      {
        total_gross: 0,
        total_platform_fee: 0,
        total_net: 0,
        total_transactions: 0,
        unsettled_net: 0,
        currency: 'KRW',
      } as RevenueSummary
    );

    // 소수점 반올림
    summary.total_gross = Math.round(summary.total_gross * 10000) / 10000;
    summary.total_platform_fee = Math.round(summary.total_platform_fee * 10000) / 10000;
    summary.total_net = Math.round(summary.total_net * 10000) / 10000;
    summary.unsettled_net = Math.round(summary.unsettled_net * 10000) / 10000;

    // ── 기간별 집계
    if (period === 'daily') {
      // 일별 집계
      const dailyMap = new Map<string, DailyRevenue>();

      for (const r of records) {
        const date = (r.created_at as string).slice(0, 10); // YYYY-MM-DD
        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            date,
            gross_amount: 0,
            platform_fee: 0,
            net_amount: 0,
            transaction_count: 0,
          });
        }
        const entry = dailyMap.get(date)!;
        entry.gross_amount += Number(r.gross_amount ?? 0);
        entry.platform_fee += Number(r.platform_fee ?? 0);
        entry.net_amount += Number(r.net_amount ?? 0);
        entry.transaction_count += 1;
      }

      const daily: DailyRevenue[] = Array.from(dailyMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => ({
          ...d,
          gross_amount: Math.round(d.gross_amount * 10000) / 10000,
          platform_fee: Math.round(d.platform_fee * 10000) / 10000,
          net_amount: Math.round(d.net_amount * 10000) / 10000,
        }));

      return NextResponse.json({ summary, daily });
    } else {
      // 월별 집계
      const monthlyMap = new Map<string, MonthlyRevenue>();

      for (const r of records) {
        const dt = new Date(r.created_at as string);
        const year = dt.getUTCFullYear();
        const month = dt.getUTCMonth() + 1;
        const key = `${year}-${String(month).padStart(2, '0')}`;
        const monthLabel = `${year}년 ${month}월`;

        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, {
            year,
            month,
            month_label: monthLabel,
            gross_amount: 0,
            platform_fee: 0,
            net_amount: 0,
            transaction_count: 0,
          });
        }
        const entry = monthlyMap.get(key)!;
        entry.gross_amount += Number(r.gross_amount ?? 0);
        entry.platform_fee += Number(r.platform_fee ?? 0);
        entry.net_amount += Number(r.net_amount ?? 0);
        entry.transaction_count += 1;
      }

      const monthly: MonthlyRevenue[] = Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, m]) => ({
          ...m,
          gross_amount: Math.round(m.gross_amount * 10000) / 10000,
          platform_fee: Math.round(m.platform_fee * 10000) / 10000,
          net_amount: Math.round(m.net_amount * 10000) / 10000,
        }));

      return NextResponse.json({ summary, monthly });
    }
  } catch (err) {
    console.error('[revenue GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
