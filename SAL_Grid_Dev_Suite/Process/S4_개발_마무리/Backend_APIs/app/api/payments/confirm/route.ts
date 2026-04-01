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

// ── 타입 ──────────────────────────────────────────────────────────────────

interface PaymentRow {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_type: string;
}

interface UserCreditRow {
  user_id: string;
  balance: number;
  currency: string;
  updated_at: string;
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
    const { data: paymentData, error: fetchError } = await supabase
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

    // 2. mcw_payments.status → 'completed' 업데이트
    const { error: updatePaymentError } = await supabase
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

    // 3. user_credits.balance += amount (upsert)
    //    기존 잔액 조회 후 합산
    const { data: creditData, error: creditFetchError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (creditFetchError) {
      console.error('[PATCH /api/payments/confirm] Credit fetch error:', creditFetchError.message);
      return NextResponse.json({ error: 'Failed to fetch current balance' }, { status: 500 });
    }

    const currentBalance = (creditData as UserCreditRow | null)?.balance ?? 0;
    const newBalance = currentBalance + amount;
    const now = new Date().toISOString();

    const { error: upsertError } = await supabase
      .from('user_credits')
      .upsert(
        {
          user_id: userId,
          balance: newBalance,
          currency: 'KRW',
          updated_at: now,
        },
        { onConflict: 'user_id' },
      );

    if (upsertError) {
      console.error('[PATCH /api/payments/confirm] Upsert credits error:', upsertError.message);
      // 결제는 완료됐으나 크레딧 반영 실패 → 긴급 알림 필요
      return NextResponse.json(
        { error: 'Payment confirmed but credit update failed. Contact support.' },
        { status: 500 },
      );
    }

    // 4. credit_transactions에 'charge' 이력 기록
    const { error: txError } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      type: 'charge',
      amount,
      balance_after: newBalance,
      description: `무통장 입금 확인 (결제ID: ${paymentId})`,
      reference_id: paymentId,
      created_at: now,
    });

    if (txError) {
      // 이력 기록 실패는 경고 로그만 (크레딧은 이미 충전됨)
      console.warn('[PATCH /api/payments/confirm] Transaction log failed:', txError.message);
    }

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
