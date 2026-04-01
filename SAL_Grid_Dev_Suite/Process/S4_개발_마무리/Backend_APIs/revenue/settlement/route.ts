/**
 * @task S4BA1
 * @description 수익 API — 매출 조회, 정산, 수수료 계산, 대시보드
 */

/**
 * Settlement API
 *
 * GET   /api/revenue/settlement  — 정산 내역 목록 조회
 * POST  /api/revenue/settlement  — 정산 요청 생성 (최소 10,000원 이상)
 * PATCH /api/revenue/settlement  — 정산 주기 설정 (weekly | biweekly | monthly)
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { calculateFee } from '../route';

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

type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed';
type SettlementCycle = 'weekly' | 'biweekly' | 'monthly';

interface SettlementItem {
  id: string;
  period: string;
  grossAmount: number;
  fee: number;
  netAmount: number;
  status: SettlementStatus;
  paidAt: string | null;
}

interface RawSettlement {
  id: string;
  period: string;
  gross_amount: number;
  fee: number;
  net_amount: number;
  status: SettlementStatus;
  paid_at: string | null;
}

/** 최소 정산 금액 (원) */
const MIN_SETTLEMENT_AMOUNT = 10_000;

// ── GET /api/revenue/settlement ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();

    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const { data: rows, error: dbError } = await supabase
      .from('settlements')
      .select('id, period, gross_amount, fee, net_amount, status, paid_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('[settlement/route] GET error:', dbError.message);
      return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
    }

    const items: SettlementItem[] = (rows ?? []).map((r: RawSettlement) => ({
      id: r.id,
      period: r.period,
      grossAmount: r.gross_amount,
      fee: r.fee,
      netAmount: r.net_amount,
      status: r.status,
      paidAt: r.paid_at ?? null,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[settlement/route] GET Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/revenue/settlement ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();

    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as {
      period?: string;
      bankInfo?: Record<string, string>;
    };

    const { period, bankInfo } = body;

    if (!period?.trim()) {
      return NextResponse.json({ error: 'Missing required field: period' }, { status: 400 });
    }
    if (!bankInfo || typeof bankInfo !== 'object') {
      return NextResponse.json({ error: 'Missing required field: bankInfo' }, { status: 400 });
    }

    // 해당 기간의 미정산 transactions 합산
    const { data: txList, error: txError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('settlement_period', period)
      .is('settlement_id', null); // 아직 정산 연결 안 된 거래

    if (txError) {
      console.error('[settlement/route] POST transactions error:', txError.message);
      return NextResponse.json({ error: 'Failed to calculate settlement amount' }, { status: 500 });
    }

    interface AmountRow { amount: number }
    const grossAmount = (txList ?? []).reduce((sum: number, tx: AmountRow) => sum + (tx.amount ?? 0), 0);

    // 최소 정산 금액 검증
    if (grossAmount < MIN_SETTLEMENT_AMOUNT) {
      return NextResponse.json(
        {
          error: `정산 가능 금액이 부족합니다. 최소 ${MIN_SETTLEMENT_AMOUNT.toLocaleString('ko-KR')}원 이상이어야 합니다. (현재: ${grossAmount.toLocaleString('ko-KR')}원)`,
        },
        { status: 422 },
      );
    }

    const { fee, net } = calculateFee(grossAmount);

    // 정산 레코드 생성
    const { data: newSettlement, error: insertError } = await supabase
      .from('settlements')
      .insert({
        user_id: userId,
        period: period.trim(),
        gross_amount: grossAmount,
        fee,
        net_amount: net,
        status: 'pending' as SettlementStatus,
        bank_info: bankInfo,
        paid_at: null,
      })
      .select('id, period, gross_amount, fee, net_amount, status, paid_at')
      .single();

    if (insertError) {
      console.error('[settlement/route] POST insert error:', insertError.message);
      return NextResponse.json({ error: 'Failed to create settlement request' }, { status: 500 });
    }

    const s = newSettlement as RawSettlement;
    return NextResponse.json(
      {
        settlement: {
          id: s.id,
          period: s.period,
          grossAmount: s.gross_amount,
          fee: s.fee,
          netAmount: s.net_amount,
          status: s.status,
          paidAt: s.paid_at ?? null,
        } as SettlementItem,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[settlement/route] POST Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH /api/revenue/settlement — 정산 주기 설정 ────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabase();

    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as { cycle?: string };
    const { cycle } = body;

    const validCycles: SettlementCycle[] = ['weekly', 'biweekly', 'monthly'];
    if (!cycle || !validCycles.includes(cycle as SettlementCycle)) {
      return NextResponse.json(
        { error: `Invalid cycle. Use one of: ${validCycles.join(' | ')}` },
        { status: 400 },
      );
    }

    // creator_settings 테이블에 settlement_cycle upsert
    const { error: upsertError } = await supabase
      .from('creator_settings')
      .upsert(
        { user_id: userId, settlement_cycle: cycle as SettlementCycle, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );

    if (upsertError) {
      console.error('[settlement/route] PATCH upsert error:', upsertError.message);
      return NextResponse.json({ error: 'Failed to update settlement cycle' }, { status: 500 });
    }

    return NextResponse.json({ cycle });
  } catch (err) {
    console.error('[settlement/route] PATCH Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
