/**
 * @task S4BA2
 * @description 결제 시스템 — 크레딧 사용 이력 조회
 *
 * Endpoints:
 * - GET /api/credits/history   크레딧 충전/차감 이력 목록 (페이지네이션)
 *
 * credit_transactions 테이블:
 * - id, user_id, type ('charge'|'deduct'|'refund'), amount, balance_after
 * - description, reference_id, created_at
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── 타입 ──────────────────────────────────────────────────────────────────

type TransactionType = 'charge' | 'deduct' | 'refund';

interface CreditTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  description: string;
  reference_id: string | null;
  created_at: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

// ── GET /api/credits/history ──────────────────────────────────────────────

/**
 * 크레딧 거래 이력 조회
 * Query params:
 *   - page: number (default 1)
 *   - limit: number (default 20, max 100)
 *   - type: 'charge' | 'deduct' | 'refund' (optional)
 * Response: { items: CreditTransaction[], pagination: PaginationMeta }
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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const typeFilter = searchParams.get('type') as TransactionType | null;

    // 타입 필터 유효성 검사
    const validTypes: TransactionType[] = ['charge', 'deduct', 'refund'];
    if (typeFilter && !validTypes.includes(typeFilter)) {
      return NextResponse.json(
        { error: `Invalid type. Allowed: ${validTypes.join(', ')}` },
        { status: 400 },
      );
    }

    const offset = (page - 1) * limit;

    // 기본 쿼리 빌더
    let query = supabase
      .from('credit_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (typeFilter) {
      query = query.eq('type', typeFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[GET /api/credits/history] DB error:', error.message);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const total = count ?? 0;
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    const items = (data as CreditTransaction[]).map((tx: any) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      balanceAfter: tx.balance_after,
      description: tx.description,
      referenceId: tx.reference_id,
      createdAt: tx.created_at,
    }));

    return NextResponse.json({ items, pagination });
  } catch (err) {
    console.error('[GET /api/credits/history] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
