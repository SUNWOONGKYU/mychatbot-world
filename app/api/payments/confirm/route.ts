/**
 * @task S4BA2
 * @description 결제 시스템 — 관리자 입금 확인 및 크레딧 충전
 *
 * Endpoints:
 * - PATCH /api/payments/confirm   관리자가 입금 확인 후 크레딧 충전
 *
 * 처리 흐름:
 *  1. SUPABASE_SERVICE_ROLE_KEY로 관리자 권한 검증
 *  2. mcw_payments.status = 'completed' 업데이트
 *  3. user_credits.balance += amount (upsert)
 *  4. credit_transactions에 'charge' 이력 기록
 *
 * 보안:
 * - 이 엔드포인트는 관리자(service_role) 전용
 * - X-Admin-Key 헤더로 인증 (ADMIN_API_KEY 환경변수)
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitAsync } from '@/lib/rate-limiter';

// user_id 별 크레딧 증가 직렬화 락 (동일 유저에 대한 동시 UPSERT race 방지)
const CREDIT_ADD_LOCK = { limit: 1, windowMs: 3_000 };

// ── 타입 ──────────────────────────────────────────────────────────────────

interface PaymentRow {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_type: string;
}

interface ConfirmRequest {
  paymentId: string;
  confirmedBy?: string; // 관리자 식별자 (선택)
}

// ── Supabase (service_role) ───────────────────────────────────────────────

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration error: missing Supabase credentials');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * 관리자 API 키 검증
 * X-Admin-Key 헤더 값을 ADMIN_API_KEY 환경변수와 비교
 */
function verifyAdminKey(req: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    console.error('[confirm] ADMIN_API_KEY env var not set');
    return false;
  }
  const provided = req.headers.get('X-Admin-Key');
  return provided === adminKey;
}

// ── PATCH /api/payments/confirm ───────────────────────────────────────────

/**
 * 관리자 입금 확인 → 크레딧 충전
 * Headers: X-Admin-Key: {ADMIN_API_KEY}
 * Body: { paymentId: string, confirmedBy?: string }
 * Response: { paymentId, userId, amount, newBalance, message }
 */
export async function PATCH(req: NextRequest) {
  try {
    // 관리자 인증
    if (!verifyAdminKey(req)) {
      return NextResponse.json({ error: 'Forbidden: invalid or missing admin key' }, { status: 403 });
    }

    const supabase = getAdminSupabase();

    // 요청 바디 파싱
    let body: ConfirmRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { paymentId, confirmedBy } = body;

    if (!paymentId || typeof paymentId !== 'string') {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
    }

    // 1. 결제 레코드 조회
    const { data: paymentData, error: fetchError } = await (supabase as any)
      .from('mcw_payments')
      .select('id, user_id, amount, status, payment_type')
      .eq('id', paymentId)
      .maybeSingle();

    if (fetchError) {
      console.error('[PATCH /api/payments/confirm] Fetch error:', fetchError.message);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!paymentData) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const payment = paymentData as PaymentRow;

    // 이미 처리된 결제인지 확인
    if (payment.status === 'completed') {
      return NextResponse.json(
        { error: 'Payment already completed' },
        { status: 409 },
      );
    }

    if (payment.status === 'cancelled' || payment.status === 'refunded') {
      return NextResponse.json(
        { error: `Cannot confirm payment with status: ${payment.status}` },
        { status: 409 },
      );
    }

    const { user_id: userId, amount } = payment;

    // 동일 유저 동시 승인 직렬화 (balance SELECT→UPSERT race 완화)
    const lock = await rateLimitAsync(req, CREDIT_ADD_LOCK, `credit-add:${userId}`);
    if (!lock.allowed) {
      return NextResponse.json(
        { error: 'Another confirmation for this user is in progress. Retry shortly.' },
        { status: 429, headers: { 'Retry-After': String(lock.retryAfterSec) } },
      );
    }

    // 2. mcw_payments.status → 'completed' 업데이트
    const { error: updatePaymentError } = await (supabase as any)
      .from('mcw_payments')
      .update({
        status: 'completed',
        confirmed_at: new Date().toISOString(),
        confirmed_by: confirmedBy ?? 'admin',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    if (updatePaymentError) {
      console.error('[PATCH /api/payments/confirm] Update payment error:', updatePaymentError.message);
      return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
    }

    // 3. 크레딧 원자적 증가: balance UPSERT + credit_transactions INSERT 를 단일 TX 에서 처리
    //    (S8BA1 — add_credits_tx RPC: FOR UPDATE 행 락으로 SELECT→UPSERT race 완전 차단)
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('add_credits_tx', {
      p_user_id: userId,
      p_amount: amount,
      p_type: 'purchase',
      p_description: `무통장 입금 확인 (결제ID: ${paymentId})`,
      p_reference_id: paymentId,
      p_reference_type: 'payment',
    });

    if (rpcError) {
      console.error('[PATCH /api/payments/confirm] add_credits_tx error:', rpcError.message);
      return NextResponse.json(
        { error: 'Payment confirmed but credit update failed. Contact support.' },
        { status: 500 },
      );
    }

    const newBalance = (rpcData as Array<{ new_balance: number }> | null)?.[0]?.new_balance ?? 0;
    const now = new Date().toISOString();

    return NextResponse.json({
      paymentId,
      userId,
      amount,
      newBalance,
      message: `${amount.toLocaleString()}원 입금 확인 완료. 크레딧이 충전되었습니다.`,
      confirmedAt: now,
    });
  } catch (err) {
    console.error('[PATCH /api/payments/confirm] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
