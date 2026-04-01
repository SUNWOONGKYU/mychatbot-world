/**
 * @task S4BA2
 * @description 결제 시스템 — 크레딧 잔액 조회 / 무통장 입금 충전 요청
 *
 * Endpoints:
 * - GET  /api/credits        현재 크레딧 잔액 조회
 * - POST /api/credits        무통장 입금 충전 요청 (pending 레코드 생성)
 *
 * 충전 단위: 1,000 / 5,000 / 10,000 / 50,000 (KRW)
 * 1 크레딧 = 1원
 *
 * 무통장 입금 흐름:
 *  1. 사용자가 금액 선택 → POST /api/credits
 *  2. mcw_payments에 status='pending' 레코드 생성
 *  3. 은행 정보(PAYMENT_BANK_NAME, PAYMENT_ACCOUNT_NUMBER, PAYMENT_ACCOUNT_HOLDER) 반환
 *  4. 관리자가 입금 확인 후 PATCH /api/payments/confirm → status='completed' + 크레딧 충전
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── 허용 충전 금액 ─────────────────────────────────────────────────────────

const ALLOWED_AMOUNTS = [1000, 5000, 10000, 50000] as const;
type AllowedAmount = typeof ALLOWED_AMOUNTS[number];

// ── 타입 ──────────────────────────────────────────────────────────────────

interface UserCreditRow {
  user_id: string;
  balance: number;
  currency: string;
  updated_at: string;
}

interface PaymentRow {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  created_at: string;
}

// ── Supabase ──────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration error: missing Supabase credentials');
  return createClient(url, key) as any;
}

async function authenticate(
  supabase: ReturnType<typeof createClient>,
  authHeader: string | null,
): Promise<{ userId: string | null; error: string | null }> {
  if (!authHeader) return { userId: null, error: 'Unauthorized: missing Authorization header' };
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { userId: null, error: 'Unauthorized: missing Bearer token' };
  const { data, error } = await (supabase as any).auth.getUser(token);
  if (error || !data?.user) return { userId: null, error: 'Unauthorized: invalid or expired token' };
  return { userId: data.user.id, error: null };
}

// ── GET /api/credits ──────────────────────────────────────────────────────

/**
 * 현재 크레딧 잔액 조회
 * Response: { balance: number, currency: 'KRW', updatedAt: string }
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { userId, error: authError } = await authenticate(
      supabase as any,
      req.headers.get('Authorization'),
    );
    if (authError || !userId) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    // user_credits 테이블에서 잔액 조회 (없으면 0)
    const { data, error } = await (supabase as any)
      .from('user_credits')
      .select('balance, currency, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[GET /api/credits] DB error:', error.message);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const row = data as UserCreditRow | null;
    return NextResponse.json({
      balance: row?.balance ?? 0,
      currency: row?.currency ?? 'KRW',
      updatedAt: row?.updated_at ?? null,
    });
  } catch (err) {
    console.error('[GET /api/credits] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/credits ─────────────────────────────────────────────────────

interface ChargeRequest {
  amount: AllowedAmount;
}

/**
 * 무통장 입금 충전 요청
 * Body: { amount: 1000 | 5000 | 10000 | 50000 }
 * Response: {
 *   paymentId: string,
 *   amount: number,
 *   status: 'pending',
 *   bankInfo: { bankName, accountNumber, accountHolder },
 *   message: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { userId, error: authError } = await authenticate(
      supabase as any,
      req.headers.get('Authorization'),
    );
    if (authError || !userId) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    // 요청 바디 파싱
    let body: ChargeRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { amount } = body;

    // 충전 금액 유효성 검사
    if (!amount || !(ALLOWED_AMOUNTS as readonly number[]).includes(amount)) {
      return NextResponse.json(
        {
          error: `Invalid amount. Allowed values: ${ALLOWED_AMOUNTS.join(', ')} (KRW)`,
        },
        { status: 400 },
      );
    }

    // 환경변수에서 은행 정보 로드
    const bankName = process.env.PAYMENT_BANK_NAME ?? '국민은행';
    const accountNumber = process.env.PAYMENT_ACCOUNT_NUMBER ?? '123-456-789';
    const accountHolder = process.env.PAYMENT_ACCOUNT_HOLDER ?? 'MCW';

    // mcw_payments에 pending 레코드 생성
    const { data: payment, error: insertError } = await (supabase as any)
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
      console.error('[POST /api/credits] Insert error:', insertError?.message);
      return NextResponse.json({ error: 'Failed to create payment request' }, { status: 500 });
    }

    const row = payment as PaymentRow;
    return NextResponse.json(
      {
        paymentId: row.id,
        amount: row.amount,
        status: 'pending',
        bankInfo: {
          bankName,
          accountNumber,
          accountHolder,
        },
        message: `아래 계좌로 ${amount.toLocaleString()}원을 입금해 주세요. 입금 확인 후 크레딧이 자동 충전됩니다.`,
        createdAt: row.created_at,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/credits] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
