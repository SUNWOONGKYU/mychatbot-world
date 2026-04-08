/**
 * @task S4BA7
 * @description 관리자 봇 관리 API
 *
 * Endpoints:
 * - GET   /api/admin/bots   전체 봇 목록 조회 (검색 + 페이지네이션)
 * - PATCH /api/admin/bots   봇 상태 변경 (비활성화 등)
 *
 * GET 쿼리 파라미터:
 *  - search : 봇 이름 또는 소유자 검색 (선택)
 *  - page   : 페이지 번호 (기본값 1)
 *  - limit  : 페이지당 항목 수 (기본값 20, 최대 100)
 *
 * PATCH 요청 바디:
 *  { botId: string, status: 'active' | 'inactive' | 'suspended' }
 *
 * 보안:
 * - requireAdmin() — X-Admin-Key 헤더 검증
 * - service_role 키로 RLS 우회
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── 타입 ──────────────────────────────────────────────────────────────────

type BotStatus = 'active' | 'inactive' | 'suspended';

interface PatchBody {
  botId: string;
  status: BotStatus;
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
    console.error('[admin/bots] ADMIN_API_KEY env var not set');
    return { authorized: false };
  }
  const provided = req.headers.get('X-Admin-Key');
  return { authorized: provided === adminKey };
}

// ── GET /api/admin/bots ───────────────────────────────────────────────────

/**
 * 전체 봇 목록 조회
 * Headers: X-Admin-Key: {ADMIN_API_KEY}
 * Query: search, page, limit
 * Response: { bots, total, page, totalPages }
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

    let query = (supabase as any)
      .from('mcw_bots')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 이름 검색
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('[GET /api/admin/bots] Query error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch bots' }, { status: 500 });
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      bots: data ?? [],
      total,
      page,
      totalPages,
    });
  } catch (err) {
    console.error('[GET /api/admin/bots] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH /api/admin/bots ─────────────────────────────────────────────────

/**
 * 봇 상태 변경
 * Headers: X-Admin-Key: {ADMIN_API_KEY}
 * Body: { botId, status: 'active' | 'inactive' | 'suspended' }
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

    const { botId, status } = body;

    if (!botId || typeof botId !== 'string') {
      return NextResponse.json({ error: 'botId is required' }, { status: 400 });
    }

    const validStatuses: BotStatus[] = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 },
      );
    }

    // 봇 존재 확인
    const { data: bot, error: fetchError } = await (supabase as any)
      .from('mcw_bots')
      .select('id, name, status')
      .eq('id', botId)
      .maybeSingle();

    if (fetchError) {
      console.error('[PATCH /api/admin/bots] Fetch error:', fetchError.message);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // 상태 업데이트
    const { data: updated, error: updateError } = await (supabase as any)
      .from('mcw_bots')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', botId)
      .select()
      .single();

    if (updateError) {
      console.error('[PATCH /api/admin/bots] Update error:', updateError.message);
      return NextResponse.json({ error: 'Failed to update bot status' }, { status: 500 });
    }

    return NextResponse.json({
      bot: updated,
      message: `봇 "${bot.name}" 상태가 ${status}(으)로 변경되었습니다.`,
      previousStatus: bot.status,
      newStatus: status,
    });
  } catch (err) {
    console.error('[PATCH /api/admin/bots] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
