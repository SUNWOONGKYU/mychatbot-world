/**
 * @task S4BA2
 * @description 결제 시스템 — 결제 내역 조회 / 무통장 입금 요청 생성
 *
 * Endpoints:
 * - GET  /api/payments   결제 내역 목록 (페이지네이션, 타입 필터)
 * - POST /api/payments   무통장 입금 요청 생성
 *
 * mcw_payments 테이블:
 * - id, user_id, amount, status ('pending'|'completed'|'cancelled'|'refunded')
 * - payment_type ('bank_transfer'), bank_name, account_number, account_holder
 * - description, confirmed_at, confirmed_by, created_at, updated_at
 *
 * API 사용료 과금 유틸리티:
 * - calculateApiCost(provider, tokens): 실제 비용의 1.3배(마진 30%) 계산
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── API 과금 유틸리티 ─────────────────────────────────────────────────────

/**
 * AI API 토큰 단가 (1,000 토큰당 KRW, 마진 적용 전)
 * 실제 서비스 비용 기준 — 정기적으로 업데이트 필요
 */
const API_COST_PER_1K_TOKENS: Record<string, number> = {
  'gpt-4o': 3.846,          // $0.005 / 1K tokens → KRW (환율 769)
  'gpt-4o-mini': 0.1154,    // $0.00015 / 1K tokens → KRW
  'claude-3-5-sonnet': 2.307, // $0.003 / 1K tokens → KRW
  'claude-3-haiku': 0.1923,  // $0.00025 / 1K tokens → KRW
  'default': 1.0,            // fallback
};

const MARGIN_RATE = 1.3; // 30% 마진

/**
 * AI API 사용료를 계산합니다 (마진 30% 적용).
 * 1 크레딧 = 1원 기준.
 *
 * @param provider - AI 모델명 (예: 'gpt-4o', 'claude-3-5-sonnet')
 * @param tokens - 사용된 토큰 수
 * @returns 차감할 크레딧 수 (원 단위, 소수점 올림)
 *
 * @example
 * calculateApiCost('gpt-4o', 1000) // => 5 (3.846 * 1.3 ≈ 4.999 → 5)
 */
export function calculateApiCost(provider: string, tokens: number): number {
  if (tokens <= 0) return 0;
  const costPer1k = API_COST_PER_1K_TOKENS[provider] ?? API_COST_PER_1K_TOKENS['default'];
  const baseCost = (tokens / 1000) * costPer1k;
  const withMargin = baseCost * MARGIN_RATE;
  return Math.ceil(withMargin); // 소수점 올림 (최소 1원)
}

// ── 타입 ──────────────────────────────────────────────────────────────────

type PaymentStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

interface PaymentRow {
  id: string;
  user_id: string;
  amount: number;
  status: PaymentStatus;
  payment_type: string;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  description: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  updated_at: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 허용 충전 금액
const ALLOWED_AMOUNTS = [1000, 5000, 10000, 50000] as const;

// ── Supabase ──────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration error: missing Supabase credentials');
  return createClient(url, key);
}

async function authenticate(
  supabase: ReturnType<typeof createClient>,
  authHeader: string | null,
): Promise<{ userId: string | null; error: string | null }> {
  if (!authHeader) return { userId: null, error: 'Unauthorized: missing Authorization header' };
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { userId: null, error: 'Unauthorized: missing Bearer token' };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { userId: null, error: 'Unauthorized: invalid or expired token' };
  return { userId: data.user.id, error: null };
}

// ── GET /api/payments ─────────────────────────────────────────────────────

/**
 * 결제 내역 조회
 * Query params:
 *   - page: number (default 1)
 *   - limit: number (default 20, max 100)
 *   - status: 'pending' | 'completed' | 'cancelled' | 'refunded' (optional)
 * Response: { items: [...], pagination: PaginationMeta }
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { userId, error: authError } = await authenticate(
      supabase,
      req.headers.get('Authorization'),
    );
    if (authError || !userId) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const statusFilter = searchParams.get('status') as PaymentStatus | null;

    // 상태 필터 유효성 검사
    const validStatuses: PaymentStatus[] = ['pending', 'completed', 'cancelled', 'refunded'];
    if (statusFilter && !validStatuses.includes(statusFilter)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${validStatuses.join(', ')}` },
        { status: 400 },
      );
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('mcw_payments')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[GET /api/payments] DB error:', error.message);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const total = count ?? 0;
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    const items = (data as PaymentRow[]).map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      paymentType: p.payment_type,
      description: p.description,
      confirmedAt: p.confirmed_at,
      createdAt: p.created_at,
    }));

    return NextResponse.json({ items, pagination });
  } catch (err) {
    console.error('[GET /api/payments] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/payments ────────────────────────────────────────────────────

interface PaymentRequest {
  amount: typeof ALLOWED_AMOUNTS[number];
}

/**
 * 무통장 입금 요청 생성
 * Body: { amount: 1000 | 5000 | 10000 | 50000 }
 * Response: { paymentId, amount, status: 'pending', bankInfo, message, createdAt }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { userId, error: authError } = await authenticate(
      supabase,
      req.headers.get('Authorization'),
    );
    if (authError || !userId) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    let body: PaymentRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { amount } = body;

    if (!amount || !(ALLOWED_AMOUNTS as readonly number[]).includes(amount)) {
      return NextResponse.json(
        {
          error: `Invalid amount. Allowed values: ${ALLOWED_AMOUNTS.join(', ')} (KRW)`,
        },
        { status: 400 },
      );
    }

    const bankName = process.env.PAYMENT_BANK_NAME ?? '국민은행';
    const accountNumber = process.env.PAYMENT_ACCOUNT_NUMBER ?? '123-456-789';
    const accountHolder = process.env.PAYMENT_ACCOUNT_HOLDER ?? 'MCW';

    const { data: payment, error: insertError } = await supabase
      .from('mcw_payments')
      .insert({
        user_id: userId,
        amount,
        status: 'pending',
        payment_type: 'bank_transfer',
        bank_name: bankName,
        account_number: accountNumber,
        account_holder: accountHolder,
        description: `크레딧 ${amount.toLocaleString()}원 무통장 입금 요청`,
      })
      .select('id, amount, status, created_at')
      .single();

    if (insertError || !payment) {
      console.error('[POST /api/payments] Insert error:', insertError?.message);
      return NextResponse.json({ error: 'Failed to create payment request' }, { status: 500 });
    }

    const row = payment as Pick<PaymentRow, 'id' | 'amount' | 'status' | 'created_at'>;
    return NextResponse.json(
      {
        paymentId: row.id,
        amount: row.amount,
        status: 'pending',
        bankInfo: { bankName, accountNumber, accountHolder },
        message: `아래 계좌로 ${amount.toLocaleString()}원을 입금해 주세요. 입금 확인 후 크레딧이 자동 충전됩니다.`,
        createdAt: row.created_at,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/payments] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
