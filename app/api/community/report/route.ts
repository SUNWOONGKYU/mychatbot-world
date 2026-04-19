// @task S4GA1
/**
 * Community Report API — Next.js App Router Route Handler
 * POST  /api/community/report  — 부적절한 콘텐츠 신고 (인증 필수)
 * GET   /api/community/report  — 신고 목록 조회 (관리자만)
 * PATCH /api/community/report  — 신고 상태 변경 (관리자만)
 *
 * bot_reports 테이블 사용
 * 관리자 여부: users 테이블의 role = 'admin' 또는 is_admin = true
 * Vanilla API 참조: api/Backend_APIs/community-report.js
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── Constants ─────────────────────────────────────────────────────────────────

const ALLOWED_REASONS = ['spam', 'inappropriate', 'abuse', 'misinformation', 'other'] as const;
const ALLOWED_STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'] as const;

type ReportReason = typeof ALLOWED_REASONS[number];
type ReportStatus = typeof ALLOWED_STATUSES[number];

// ── Supabase ─────────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration error: missing Supabase credentials');
  return createClient(url, key);
}

async function authenticate(supabase: any, authHeader: string) {
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { userId: null as null, error: 'Unauthorized: missing Bearer token' };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { userId: null as null, error: 'Unauthorized: invalid or expired token' };
  return { userId: data.user.id, error: null as null };
}

async function checkIsAdmin(supabase: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error || !data) return false;
    return (data as { is_admin: boolean }).is_admin === true;
  } catch {
    return false;
  }
}

// ── GET /api/community/report  (관리자만) ─────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const isAdmin = await checkIsAdmin(supabase, userId!);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as ReportStatus | null;
    const target_type = searchParams.get('target_type');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('bot_reports')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && (ALLOWED_STATUSES as readonly string[]).includes(status)) query = query.eq('status', status);
    if (target_type) query = query.eq('target_type', target_type);

    const { data: reports, count, error: fetchError } = await query;
    if (fetchError) {
      console.error('[community/report/route] list error:', fetchError.message);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return NextResponse.json({
      reports: reports ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err) {
    console.error('[community/report/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/community/report ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as {
      target_type?: string;
      target_id?: string;
      reason?: ReportReason;
      description?: string;
    };

    const { target_type, target_id, reason, description } = body;

    if (!target_type) return NextResponse.json({ error: 'Missing required field: target_type (post|comment)' }, { status: 400 });
    if (!target_id) return NextResponse.json({ error: 'Missing required field: target_id' }, { status: 400 });
    if (!reason) return NextResponse.json({ error: 'Missing required field: reason' }, { status: 400 });
    if (!(ALLOWED_REASONS as readonly string[]).includes(reason)) {
      return NextResponse.json(
        { error: `Invalid reason. Allowed values: ${ALLOWED_REASONS.join(', ')}` },
        { status: 400 },
      );
    }
    if (description && description.length > 1000) {
      return NextResponse.json({ error: '신고 내용은 1000자를 초과할 수 없습니다.' }, { status: 400 });
    }

    // 중복 신고 확인
    const { data: existingReport } = await supabase
      .from('bot_reports')
      .select('id')
      .eq('reporter_id', userId)
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .maybeSingle();

    if (existingReport) {
      return NextResponse.json(
        { error: 'Conflict: you have already reported this content' },
        { status: 409 },
      );
    }

    const { data: newReport, error: insertError } = await supabase
      .from('bot_reports')
      .insert({
        reporter_id: userId,
        target_type,
        target_id,
        reason,
        description: description ? description.trim() : null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[community/report/route] insert error:', insertError.message);
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
    }

    return NextResponse.json({ report: newReport }, { status: 201 });
  } catch (err) {
    console.error('[community/report/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH /api/community/report  (관리자만) ───────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const authHeader = req.headers.get('authorization') ?? '';
    const { userId, error: authError } = await authenticate(supabase, authHeader);
    if (authError) return NextResponse.json({ error: authError }, { status: 401 });

    const isAdmin = await checkIsAdmin(supabase, userId!);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });

    const body = (await req.json().catch(() => ({}))) as {
      id?: string;
      status?: ReportStatus;
      admin_note?: string;
    };

    const { id, status, admin_note } = body;
    if (!id) return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 });
    if (!status) return NextResponse.json({ error: 'Missing required field: status' }, { status: 400 });
    if (!(ALLOWED_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    const { error: fetchErr } = await supabase.from('bot_reports').select('id').eq('id', id).single();
    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
    }

    const updates: Record<string, unknown> = {
      status,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    };
    if (admin_note !== undefined) updates.admin_note = admin_note;

    const { data: updatedReport, error: updateError } = await supabase
      .from('bot_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[community/report/route] update error:', updateError.message);
      return NextResponse.json({ error: 'Failed to update report status' }, { status: 500 });
    }

    return NextResponse.json({ report: updatedReport });
  } catch (err) {
    console.error('[community/report/route] Unexpected error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
