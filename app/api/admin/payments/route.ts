/**
 * @task S4BA7
 * @description 관리자 결제/입금 관리 API
 *
 * Endpoints:
 * - GET   /api/admin/payments   결제 목록 조회 (status 필터 + 페이지네이션)
 * - PATCH /api/admin/payments   입금 승인 또는 거부
 *
 * GET 쿼리 파라미터:
 *  - status : pending | completed | all (기본값 all)
 *  - page   : 페이지 번호 (기본값 1)
 *  - limit  : 페이지당 항목 수 (기본값 20, 최대 100)
 *
 * PATCH 요청 바디:
 *  { paymentId: string, action: 'approve' | 'reject', confirmedBy?: string }
 *
 * approve 흐름:
 *  1. mcw_payments.status → 'completed' 업데이트
 *  2. mcw_credits.balance += amount (upsert)
 *  3. mcw_credit_transactions 이력 기록
 *
 * 보안:
 * - requireAdmin() — X-Admin-Key 헤더 검증
 * - service_role 키로 RLS 우회
 */


import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminSupabase } from '@/lib/admin-auth';
import { rateLimit, rateLimitAsync, RATE_ADMIN } from '@/lib/rate-limiter';

// user_id 별 크레딧 증가 직렬화 락 — 동일 유저 복수 승인 동시 처리 race 방지
const CREDIT_ADD_LOCK = { limit: 1, windowMs: 3_000 };

// ── 타입 ──────────────────────────────────────────────────────────────────

interface PaymentRow {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_type: string;
  description?: string | null;
  created_at: string;
  updated_at?: string;
  confirmed_at?: string;
  confirmed_by?: string;
}

// 크레딧 충전이 아닌 상품 구매 (음성팩, 아바타팩, 페르소나 템플릿 등)
function isProductPurchase(description?: string | null): boolean {
  if (!description) return false;
  return description.startsWith('[부가기능]') || description.startsWith('[페르소나 템플릿]');
}

interface UserCreditRow {
  user_id: string;
  balance: number;
  total_purchased: number;
}

interface PatchBody {
  paymentId: string;
  action: 'approve' | 'reject';
  confirmedBy?: string;
}

// ── GET /api/admin/payments ───────────────────────────────────────────────

/**
 * 결제 목록 조회
 * Headers: X-Admin-Key: {ADMIN_API_KEY}
 * Query: status(pending|completed|all), page, limit
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getAdminSupabase();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status') ?? 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const offset = (page - 1) * limit;

    let query = (supabase as any)
      .from('mcw_payments')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === 'pending' || status === 'completed') {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('[GET /api/admin/payments] Query error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      payments: data ?? [],
      total,
      page,
      totalPages,
    });
  } catch (err) {
    console.error('[GET /api/admin/payments] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH /api/admin/payments ─────────────────────────────────────────────

/**
 * 입금 승인 또는 거부
 * Headers: X-Admin-Key: {ADMIN_API_KEY}
 * Body: { paymentId, action: 'approve' | 'reject', confirmedBy? }
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getAdminSupabase();

    let body: PatchBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { paymentId, action, confirmedBy } = body;

    if (!paymentId || typeof paymentId !== 'string') {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
    }
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
    }

    // 결제 레코드 조회
    const { data: paymentData, error: fetchError } = await (supabase as any)
      .from('mcw_payments')
      .select('id, user_id, amount, status, payment_type, description')
      .eq('id', paymentId)
      .maybeSingle();

    if (fetchError) {
      console.error('[PATCH /api/admin/payments] Fetch error:', fetchError.message);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!paymentData) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const payment = paymentData as PaymentRow;

    if (payment.status === 'completed') {
      return NextResponse.json({ error: 'Payment already completed' }, { status: 409 });
    }
    if (payment.status === 'cancelled' || payment.status === 'refunded') {
      return NextResponse.json(
        { error: `Cannot process payment with status: ${payment.status}` },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();

    // ── 거부 처리 ────────────────────────────────────────────────────────
    if (action === 'reject') {
      const { error: rejectError } = await (supabase as any)
        .from('mcw_payments')
        .update({
          status: 'cancelled',
          confirmed_by: confirmedBy ?? 'admin',
          updated_at: now,
        })
        .eq('id', paymentId);

      if (rejectError) {
        console.error('[PATCH /api/admin/payments] Reject error:', rejectError.message);
        return NextResponse.json({ error: 'Failed to reject payment' }, { status: 500 });
      }

      return NextResponse.json({
        paymentId,
        action: 'rejected',
        message: '입금 요청이 거부되었습니다.',
        processedAt: now,
      });
    }

    // ── 승인 처리 ────────────────────────────────────────────────────────
    const { user_id: userId, amount, description: paymentDesc } = payment;
    const isProduct = isProductPurchase(paymentDesc);

    // 1. mcw_payments → 'completed'
    const { error: updatePaymentError } = await (supabase as any)
      .from('mcw_payments')
      .update({
        status: 'completed',
        confirmed_at: now,
        confirmed_by: confirmedBy ?? 'admin',
        updated_at: now,
      })
      .eq('id', paymentId);

    if (updatePaymentError) {
      console.error('[PATCH /api/admin/payments] Update payment error:', updatePaymentError.message);
      return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
    }

    // 상품 구매([부가기능], [페르소나 템플릿])는 크레딧 충전 없이 완료
    if (isProduct) {
      return NextResponse.json({
        paymentId,
        userId,
        amount,
        action: 'approved',
        type: 'product',
        message: `${paymentDesc} 구매 확인 완료. 아이템을 수동 지급하세요.`,
        processedAt: now,
      });
    }

    // 동일 유저에 대한 동시 승인 직렬화 (balance SELECT→UPSERT race 완화)
    const lock = await rateLimitAsync(req, CREDIT_ADD_LOCK, `credit-add:${userId}`);
    if (!lock.allowed) {
      return NextResponse.json(
        { error: 'Another approval for this user is in progress. Retry shortly.' },
        { status: 429, headers: { 'Retry-After': String(lock.retryAfterSec) } },
      );
    }

    // 2. 크레딧 충전: mcw_credits.balance += amount (upsert)
    const { data: creditData, error: creditFetchError } = await (supabase as any)
      .from('mcw_credits')
      .select('balance, total_purchased')
      .eq('user_id', userId)
      .maybeSingle();

    if (creditFetchError) {
      console.error('[PATCH /api/admin/payments] Credit fetch error:', creditFetchError.message);
      return NextResponse.json({ error: 'Failed to fetch current balance' }, { status: 500 });
    }

    // 동일 유저에 대한 동시 승인 직렬화 (balance SELECT→UPSERT race 완화)
    const lock = await rateLimitAsync(req, CREDIT_ADD_LOCK, `credit-add:${userId}`);
    if (!lock.allowed) {
      return NextResponse.json(
        { error: 'Another approval for this user is in progress. Retry shortly.' },
        { status: 429, headers: { 'Retry-After': String(lock.retryAfterSec) } },
      );
    }

    // 2. 크레딧 원자적 증가 (S8BA1 — add_credits_tx RPC: row lock + upsert + tx log 단일 TX)
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('add_credits_tx', {
      p_user_id: userId,
      p_amount: amount,
      p_type: 'purchase',
      p_description: `무통장 입금 확인 (결제ID: ${paymentId})`,
      p_reference_id: paymentId,
      p_reference_type: 'payment',
    });

    if (rpcError) {
      console.error('[PATCH /api/admin/payments] add_credits_tx error:', rpcError.message);
      return NextResponse.json(
        { error: 'Payment confirmed but credit update failed. Contact support.' },
        { status: 500 },
      );
    }

    const newBalance = (rpcData as Array<{ new_balance: number }> | null)?.[0]?.new_balance ?? 0;

    return NextResponse.json({
      paymentId,
      userId,
      amount,
      newBalance,
      action: 'approved',
      type: 'credit',
      message: `${amount.toLocaleString()}원 입금 확인 완료. 크레딧이 충전되었습니다.`,
      processedAt: now,
    });
  } catch (err) {
    console.error('[PATCH /api/admin/payments] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
