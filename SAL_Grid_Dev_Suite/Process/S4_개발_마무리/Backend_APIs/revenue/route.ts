/**
 * @task S4BA1
 * @description 수익 API — 매출 조회, 정산, 수수료 계산, 대시보드
 */

/**
 * Revenue API — GET /api/revenue
 *
 * 로그인 크리에이터의 매출 데이터를 날짜 범위 및 주기(daily/weekly/monthly)별로 반환.
 * 수익 소스: subscription | tip | marketplace
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── Constants ─────────────────────────────────────────────────────────────────

/** 플랫폼 수수료율 (환경 변수 우선, 기본값 0.20 = 20%) */
export const PLATFORM_FEE_RATE = parseFloat(process.env.PLATFORM_FEE_RATE ?? '0.20');

/** 수익 소스 타입 */
export type RevenueSource = 'subscription' | 'tip' | 'marketplace';

/** 집계 주기 */
type Period = 'daily' | 'weekly' | 'monthly';

// ── Supabase ─────────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration error: missing Supabase credentials');
  return createClient(url, key);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function authenticate(
  supabase: ReturnType<typeof getSupabase>,
  authHeader: string,
): Promise<{ userId: string | null; error: string | null }> {
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { userId: null, error: 'Unauthorized: missing Bearer token' };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { userId: null, error: 'Unauthorized: invalid or expired token' };
  return { userId: data.user.id, error: null };
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/**
 * 수수료 계산 유틸 함수
 * @param gross 총 매출 금액 (원)
 * @returns { fee, net } — 플랫폼 수수료와 크리에이터 수령액
 */
export function calculateFee(gross: number): { fee: number; net: number } {
  const fee = Math.round(gross * PLATFORM_FEE_RATE);
  const net = gross - fee;
  return { fee, net };
}

/** ISO 날짜 문자열 → 날짜 범위 끝(그날 23:59:59.999) */
function endOfDay(isoDate: string): string {
  return `${isoDate.slice(0, 10)}T23:59:59.999Z`;
}

/**
 * transactions 배열을 주기(daily/weekly/monthly)로 그룹화
 */
interface Transaction {
  created_at: string;
  amount: number;
  source: RevenueSource;
}

function groupByPeriod(
  transactions: Transaction[],
  period: Period,
): Array<{ date: string; amount: number; source: RevenueSource }> {
  const buckets = new Map<string, { amount: number; source: RevenueSource }>();

  for (const tx of transactions) {
    const d = new Date(tx.created_at);
    let key: string;
    if (period === 'daily') {
      key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    } else if (period === 'weekly') {
      // ISO 주차 시작일(월요일) 기준
      const day = d.getDay(); // 0=Sun
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      key = monday.toISOString().slice(0, 10);
    } else {
      key = d.toISOString().slice(0, 7); // YYYY-MM
    }

    const existing = buckets.get(key);
    if (existing) {
      existing.amount += tx.amount;
    } else {
      buckets.set(key, { amount: tx.amount, source: tx.source });
    }
  }

  return Array.from(buckets.entries())
    .map(([date, v]) => ({ date, amount: v.amount, source: v.source }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── GET /api/revenue ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();

    // 인증
    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const period = (searchParams.get('period') ?? 'daily') as Period;

    // 유효한 period 값 검증
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json({ error: 'Invalid period. Use daily | weekly | monthly' }, { status: 400 });
    }

    // transactions 테이블 조회
    let query = supabase
      .from('transactions')
      .select('created_at, amount, source')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (from) query = query.gte('created_at', `${from}T00:00:00.000Z`);
    if (to) query = query.lte('created_at', endOfDay(to));

    const { data: txList, error: txError } = await query;
    if (txError) {
      console.error('[revenue/route] transactions query error:', txError.message);
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
    }

    const transactions = (txList ?? []) as Transaction[];
    const total = transactions.reduce((sum, tx) => sum + (tx.amount ?? 0), 0);
    const breakdown = groupByPeriod(transactions, period);

    return NextResponse.json({ total, breakdown });
  } catch (err) {
    console.error('[revenue/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
