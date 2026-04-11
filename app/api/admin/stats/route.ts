/**
 * @task S4BA7
 * @description 관리자 대시보드 통계 API
 *
 * Endpoints:
 * - GET /api/admin/stats   대시보드 핵심 통계 조회
 *
 * 응답 항목:
 *  - totalUsers       : auth.users 총 인원
 *  - totalBots        : mcw_bots 총 봇 수
 *  - totalRevenue     : mcw_payments completed 합산 매출
 *  - activeUsersToday : 오늘(자정 기준) 활성 사용자 수
 *  - pendingPayments  : mcw_payments pending 건수
 *
 * 보안:
 * - requireAdmin() — X-Admin-Key 헤더 검증
 * - service_role 키로 RLS 우회
 */


import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminSupabase } from '@/lib/admin-auth';
import { rateLimit, RATE_ADMIN } from '@/lib/rate-limiter';

> {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    console.error('[admin/stats] ADMIN_API_KEY env var not set');
    return { authorized: false };
  }
  const provided = req.headers.get('X-Admin-Key');
  return { authorized: provided === adminKey };
}

// ── GET /api/admin/stats ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getAdminSupabase();

    // 오늘 자정 (KST 기준 UTC 변환)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartISO = todayStart.toISOString();

    // 병렬 조회
    const [usersResult, botsResult, revenueResult, activeResult, pendingResult] =
      await Promise.all([
        // 1. 총 사용자 수 (auth.users)
        (supabase as any).from('mcw_credits').select('user_id', { count: 'exact', head: true }),

        // 2. 총 봇 수
        (supabase as any).from('mcw_bots').select('id', { count: 'exact', head: true }),

        // 3. 총 매출 (completed 합산)
        (supabase as any)
          .from('mcw_payments')
          .select('amount')
          .eq('status', 'completed'),

        // 4. 오늘 활성 사용자 (mcw_credit_transactions 기준)
        (supabase as any)
          .from('mcw_credit_transactions')
          .select('user_id', { count: 'exact', head: true })
          .gte('created_at', todayStartISO),

        // 5. 대기 중 입금 건수
        (supabase as any)
          .from('mcw_payments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

    // 매출 합산
    const totalRevenue: number =
      revenueResult.data?.reduce(
        (sum: number, row: { amount: number }) => sum + (row.amount ?? 0),
        0,
      ) ?? 0;

    if (usersResult.error) console.warn('[admin/stats] users query warn:', usersResult.error.message);
    if (botsResult.error) console.warn('[admin/stats] bots query warn:', botsResult.error.message);
    if (revenueResult.error) console.warn('[admin/stats] revenue query warn:', revenueResult.error.message);
    if (activeResult.error) console.warn('[admin/stats] active query warn:', activeResult.error.message);
    if (pendingResult.error) console.warn('[admin/stats] pending query warn:', pendingResult.error.message);

    return NextResponse.json({
      totalUsers: usersResult.count ?? 0,
      totalBots: botsResult.count ?? 0,
      totalRevenue,
      activeUsersToday: activeResult.count ?? 0,
      pendingPayments: pendingResult.count ?? 0,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/admin/stats] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
