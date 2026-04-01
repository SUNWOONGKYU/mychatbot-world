/**
 * @task S4BA1
 * @description 수익 API — 매출 조회, 정산, 수수료 계산, 대시보드
 */

/**
 * Revenue Dashboard API — GET /api/revenue/dashboard
 *
 * Business 대시보드용 통합 집계 데이터:
 * - totalRevenue: 전체 누적 매출
 * - monthlyRevenue: 이번 달 매출
 * - growthRate: 지난달 대비 증감률 (%)
 * - pendingSettlement: 미정산 금액
 * - revenueChart: 최근 12개월 월별 매출 차트 데이터
 * - topPersonas: 매출 기여 상위 페르소나(봇) 목록
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

// ── Types ─────────────────────────────────────────────────────────────────────

interface RevenueChartItem {
  month: string;   // YYYY-MM
  amount: number;
}

interface TopPersona {
  botId: string;
  botName: string;
  emoji: string | null;
  revenue: number;
}

interface DashboardData {
  totalRevenue: number;
  monthlyRevenue: number;
  growthRate: number;           // 지난달 대비 증감률 (%), 소수점 2자리
  pendingSettlement: number;
  revenueChart: RevenueChartItem[];
  topPersonas: TopPersona[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** 현재 월의 첫 날 00:00:00 UTC */
function startOfCurrentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01T00:00:00.000Z`;
}

/** 지난달 범위 [start, end] UTC ISO strings */
function lastMonthRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
  const month = now.getUTCMonth() === 0 ? 12 : now.getUTCMonth(); // 1-based
  const start = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)); // last day of prev month
  return { start, end: endDate.toISOString() };
}

/** N개월 전 첫 날 UTC ISO string */
function startOfMonthsAgo(n: number): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n, 1));
  return d.toISOString();
}

/** transactions 목록에서 월별 집계 생성 */
interface TxRow { created_at: string; amount: number }

function buildMonthlyChart(transactions: TxRow[]): RevenueChartItem[] {
  const buckets = new Map<string, number>();
  for (const tx of transactions) {
    const key = tx.created_at.slice(0, 7); // YYYY-MM
    buckets.set(key, (buckets.get(key) ?? 0) + (tx.amount ?? 0));
  }
  return Array.from(buckets.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/** 증감률 계산 (이전 값이 0인 경우 +100% 처리) */
function calcGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 10000) / 100; // 소수점 2자리
}

// ── GET /api/revenue/dashboard ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();

    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    // 1. 전체 누적 매출
    const { data: totalRows, error: totalError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId);

    if (totalError) {
      console.error('[revenue/dashboard] totalRevenue error:', totalError.message);
      return NextResponse.json({ error: 'Failed to fetch total revenue' }, { status: 500 });
    }

    interface AmountRow { amount: number }
    const totalRevenue = (totalRows ?? []).reduce((s: number, r: AmountRow) => s + (r.amount ?? 0), 0);

    // 2. 이번 달 매출
    const thisMonthStart = startOfCurrentMonth();
    const { data: thisMonthRows, error: thisMonthError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', thisMonthStart);

    if (thisMonthError) {
      console.error('[revenue/dashboard] monthlyRevenue error:', thisMonthError.message);
      return NextResponse.json({ error: 'Failed to fetch monthly revenue' }, { status: 500 });
    }

    const monthlyRevenue = (thisMonthRows ?? []).reduce((s: number, r: AmountRow) => s + (r.amount ?? 0), 0);

    // 3. 지난달 매출 (증감률 계산용)
    const { start: lastStart, end: lastEnd } = lastMonthRange();
    const { data: lastMonthRows, error: lastMonthError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', lastStart)
      .lte('created_at', lastEnd);

    if (lastMonthError) {
      console.error('[revenue/dashboard] lastMonth error:', lastMonthError.message);
      // 비치명적 에러 — 증감률 0으로 처리하고 계속
    }

    const lastMonthRevenue = (lastMonthRows ?? []).reduce((s: number, r: AmountRow) => s + (r.amount ?? 0), 0);
    const growthRate = calcGrowthRate(monthlyRevenue, lastMonthRevenue);

    // 4. 미정산 금액 (settlements 테이블에 연결 안 된 transactions 합산)
    const { data: pendingRows, error: pendingError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .is('settlement_id', null);

    if (pendingError) {
      console.error('[revenue/dashboard] pendingSettlement error:', pendingError.message);
    }

    const pendingSettlement = (pendingRows ?? []).reduce((s: number, r: AmountRow) => s + (r.amount ?? 0), 0);

    // 5. 최근 12개월 차트 데이터
    const twelveMonthsAgo = startOfMonthsAgo(12);
    const { data: chartRows, error: chartError } = await supabase
      .from('transactions')
      .select('created_at, amount')
      .eq('user_id', userId)
      .gte('created_at', twelveMonthsAgo)
      .order('created_at', { ascending: true });

    if (chartError) {
      console.error('[revenue/dashboard] revenueChart error:', chartError.message);
    }

    const revenueChart = buildMonthlyChart((chartRows ?? []) as TxRow[]);

    // 6. 상위 페르소나(봇) 매출 기여 — bot_id별 합산
    interface BotTxRow { amount: number; bot_id: string | null }
    const { data: botRows, error: botError } = await supabase
      .from('transactions')
      .select('amount, bot_id')
      .eq('user_id', userId)
      .not('bot_id', 'is', null);

    if (botError) {
      console.error('[revenue/dashboard] topPersonas error:', botError.message);
    }

    const botRevMap = new Map<string, number>();
    for (const row of (botRows ?? []) as BotTxRow[]) {
      if (!row.bot_id) continue;
      botRevMap.set(row.bot_id, (botRevMap.get(row.bot_id) ?? 0) + (row.amount ?? 0));
    }

    const topBotIds = Array.from(botRevMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    let topPersonas: TopPersona[] = [];
    if (topBotIds.length > 0) {
      const { data: botMeta, error: botMetaError } = await supabase
        .from('mcw_bots')
        .select('id, bot_name, emoji')
        .in('id', topBotIds);

      if (!botMetaError && botMeta) {
        interface BotMeta { id: string; bot_name: string; emoji: string | null }
        topPersonas = (botMeta as BotMeta[]).map((b) => ({
          botId: b.id,
          botName: b.bot_name,
          emoji: b.emoji ?? null,
          revenue: botRevMap.get(b.id) ?? 0,
        })).sort((a, b) => b.revenue - a.revenue);
      }
    }

    const dashboard: DashboardData = {
      totalRevenue,
      monthlyRevenue,
      growthRate,
      pendingSettlement,
      revenueChart,
      topPersonas,
    };

    return NextResponse.json(dashboard);
  } catch (err) {
    console.error('[revenue/dashboard] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
