/**
 * @task S4BA1
 * @description 수익 정산 API — 정산 내역 목록 조회 + 정산 요청
 *
 * GET  /api/revenue/settlements — 정산 내역 목록 (인증 필수, 소유자 본인만)
 *   쿼리: status=pending|processing|completed|failed, limit=20, offset=0
 *   응답: { settlements: Settlement[], total: number }
 *
 * POST /api/revenue/settlements — 정산 요청 생성 (인증 필수)
 *   요청: { requested_amount, bank_name, bank_account_number, bank_account_holder, period_from?, period_to? }
 *   응답: { settlement: Settlement }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================
// 타입 정의
// ============================

interface Settlement {
  id: string;
  creator_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requested_amount: number;
  approved_amount: number | null;
  currency: string;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  period_from: string | null;
  period_to: string | null;
  processed_at: string | null;
  fail_reason: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateSettlementBody {
  requested_amount: number;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  period_from?: string;
  period_to?: string;
}

// ============================
// 상수
// ============================

const ALLOWED_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
type SettlementStatus = typeof ALLOWED_STATUSES[number];

const MIN_SETTLEMENT_AMOUNT = 10000; // 최소 정산 금액 (10,000원)
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

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
// GET /api/revenue/settlements
// ============================

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseServer();

  const auth = await authenticate(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { userId } = auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as SettlementStatus | null;
  const rawLimit = searchParams.get('limit');
  const rawOffset = searchParams.get('offset');

  // status 파라미터 검증
  if (status && !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  const limit = Math.min(parseInt(rawLimit ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = Math.max(parseInt(rawOffset ?? '0', 10) || 0, 0);

  try {
    let query = supabase
      .from('mcw_settlements')
      .select('*', { count: 'exact' })
      .eq('creator_id', userId) // 소유자 본인 데이터만 반환
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[revenue/settlements GET] Supabase error:', error.message);
      return NextResponse.json({ error: '정산 내역 조회에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({
      settlements: data as Settlement[],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[revenue/settlements GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================
// POST /api/revenue/settlements
// ============================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseServer();

  const auth = await authenticate(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { userId } = auth;

  let body: CreateSettlementBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '유효하지 않은 JSON 요청입니다' }, { status: 400 });
  }

  const {
    requested_amount,
    bank_name,
    bank_account_number,
    bank_account_holder,
    period_from,
    period_to,
  } = body;

  // 필수 필드 검증
  if (requested_amount === undefined || requested_amount === null) {
    return NextResponse.json({ error: 'requested_amount는 필수입니다' }, { status: 400 });
  }

  const amount = typeof requested_amount === 'number'
    ? requested_amount
    : parseFloat(String(requested_amount));

  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: 'requested_amount는 0보다 큰 숫자여야 합니다' }, { status: 400 });
  }

  // 최소 정산 금액 검증
  if (amount < MIN_SETTLEMENT_AMOUNT) {
    return NextResponse.json(
      {
        error: `최소 정산 금액은 ${MIN_SETTLEMENT_AMOUNT.toLocaleString()}원입니다`,
        min_amount: MIN_SETTLEMENT_AMOUNT,
      },
      { status: 422 }
    );
  }

  // 날짜 파라미터 검증
  if (period_from && isNaN(Date.parse(period_from))) {
    return NextResponse.json({ error: 'Invalid period_from date format.' }, { status: 400 });
  }
  if (period_to && isNaN(Date.parse(period_to))) {
    return NextResponse.json({ error: 'Invalid period_to date format.' }, { status: 400 });
  }
  if (period_from && period_to && new Date(period_from) > new Date(period_to)) {
    return NextResponse.json(
      { error: 'period_from must be before or equal to period_to.' },
      { status: 400 }
    );
  }

  // 미정산 수익 확인 — requested_amount가 실제 미정산 금액을 초과하지 않는지 검증
  const { data: revenueRows, error: revenueError } = await supabase
    .from('mcw_revenue')
    .select('net_amount')
    .eq('creator_id', userId)
    .eq('settled', false);

  if (revenueError) {
    console.error('[revenue/settlements POST] Revenue check error:', revenueError.message);
    return NextResponse.json({ error: '수익 잔액 확인에 실패했습니다' }, { status: 500 });
  }

  const unsettledNet = (revenueRows ?? []).reduce(
    (acc, r) => acc + Number(r.net_amount ?? 0),
    0
  );

  if (amount > unsettledNet) {
    return NextResponse.json(
      {
        error: `정산 요청 금액(${amount.toLocaleString()}원)이 미정산 잔액(${Math.floor(unsettledNet).toLocaleString()}원)을 초과합니다`,
        unsettled_balance: Math.floor(unsettledNet),
      },
      { status: 422 }
    );
  }

  // 이미 진행 중인 정산이 있는지 확인
  const { data: pending, error: pendingError } = await supabase
    .from('mcw_settlements')
    .select('id')
    .eq('creator_id', userId)
    .in('status', ['pending', 'processing'])
    .limit(1);

  if (!pendingError && pending && pending.length > 0) {
    return NextResponse.json(
      { error: '이미 진행 중인 정산 요청이 있습니다. 완료 후 다시 요청해주세요.' },
      { status: 409 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('mcw_settlements')
      .insert({
        creator_id: userId,
        status: 'pending',
        requested_amount: Math.round(amount * 10000) / 10000,
        currency: 'KRW',
        bank_name: bank_name ?? null,
        bank_account_number: bank_account_number ?? null,
        bank_account_holder: bank_account_holder ?? null,
        period_from: period_from ?? null,
        period_to: period_to ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('[revenue/settlements POST] Supabase error:', error.message);
      return NextResponse.json({ error: '정산 요청 생성에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ settlement: data as Settlement }, { status: 201 });
  } catch (err) {
    console.error('[revenue/settlements POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
