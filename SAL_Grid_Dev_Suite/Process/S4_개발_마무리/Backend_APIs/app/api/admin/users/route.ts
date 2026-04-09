/**
 * @task S4BA7
 * @description 관리자 사용자 관리 API
 *
 * Endpoints:
 * - GET /api/admin/users   사용자 목록 조회 (페이지네이션 + 검색)
 *
 * 쿼리 파라미터:
 *  - search   : 이메일 또는 이름 검색 (선택)
 *  - page     : 페이지 번호 (기본값 1)
 *  - limit    : 페이지당 항목 수 (기본값 20, 최대 100)
 *
 * 응답:
 *  { users: [...], total, page, totalPages }
 *
 * 보안:
 * - requireAdmin() — X-Admin-Key 헤더 검증
 * - service_role 키로 RLS 우회 + auth.users 접근
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── 타입 ──────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata?: Record<string, unknown>;
}

interface CreditRow {
  user_id: string;
  balance: number;
  total_purchased: number;
  updated_at: string;
}

// ── 관리자 인증 ────────────────────────────────────────────────────────────

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration error: missing Supabase credentials');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireAdmin(req: NextRequest): Promise<{ authorized: boolean }> {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    console.error('[admin/users] ADMIN_API_KEY env var not set');
    return { authorized: false };
  }
  const provided = req.headers.get('X-Admin-Key');
  return { authorized: provided === adminKey };
}

// ── GET /api/admin/users ──────────────────────────────────────────────────

/**
 * 사용자 목록 조회
 * Headers: X-Admin-Key: {ADMIN_API_KEY}
 * Query: search, page, limit
 * Response: { users, total, page, totalPages }
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getAdminSupabase();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search')?.trim() ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const offset = (page - 1) * limit;

    // mcw_credits 테이블에서 사용자 목록 조회 (credits 정보 포함)
    // auth.users는 service_role로만 접근 가능 — admin API 사용
    let creditsQuery = (supabase as any)
      .from('mcw_credits')
      .select('user_id, balance, total_purchased, updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: creditsData, count: total, error: creditsError } = await creditsQuery;

    if (creditsError) {
      console.error('[GET /api/admin/users] Credits query error:', creditsError.message);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const credits = (creditsData ?? []) as CreditRow[];
    const userIds = credits.map((c) => c.user_id);

    // auth.users에서 이메일/메타데이터 조회 (service_role 필요)
    let authUsers: UserRow[] = [];
    if (userIds.length > 0) {
      const { data: authData, error: authError } = await (supabase as any).auth.admin.listUsers();
      if (!authError && authData?.users) {
        const authMap = new Map<string, UserRow>(
          authData.users.map((u: UserRow) => [u.id, u]),
        );

        authUsers = userIds
          .map((id) => authMap.get(id))
          .filter((u): u is UserRow => u !== undefined);

        // 검색 필터 적용 (이메일 또는 display_name)
        if (search) {
          const lowerSearch = search.toLowerCase();
          authUsers = authUsers.filter(
            (u) =>
              u.email?.toLowerCase().includes(lowerSearch) ||
              String(u.user_metadata?.full_name ?? '')
                .toLowerCase()
                .includes(lowerSearch),
          );
        }
      } else if (authError) {
        console.warn('[GET /api/admin/users] Auth users fetch warn:', authError.message);
      }
    }

    // credits와 auth 정보 조인
    const creditMap = new Map<string, CreditRow>(credits.map((c) => [c.user_id, c]));
    const users = (authUsers.length > 0 ? authUsers : credits.map((c) => ({ id: c.user_id } as UserRow))).map(
      (u) => {
        const credit = creditMap.get(u.id);
        return {
          id: u.id,
          email: u.email ?? null,
          displayName: u.user_metadata?.full_name ?? null,
          createdAt: u.created_at ?? null,
          lastSignInAt: u.last_sign_in_at ?? null,
          balance: credit?.balance ?? 0,
          totalPurchased: credit?.total_purchased ?? 0,
          creditsUpdatedAt: credit?.updated_at ?? null,
        };
      },
    );

    const totalCount = total ?? users.length;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      users,
      total: totalCount,
      page,
      totalPages,
    });
  } catch (err) {
    console.error('[GET /api/admin/users] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
