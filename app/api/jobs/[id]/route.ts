/**
 * @task S3BA3
 * @description Jobs API — 채용 공고 상세/수정/삭제
 *
 * GET    /api/jobs/[id] — 채용 공고 상세 조회 (공개)
 *   응답: { job: JobPosting }
 *
 * PATCH  /api/jobs/[id] — 채용 공고 수정 (고용주 본인만)
 *   요청: { title?, description?, required_skills?, budget_min?, budget_max?, status? }
 *   응답: { job: JobPosting }
 *
 * DELETE /api/jobs/[id] — 채용 공고 삭제 (고용주 본인만)
 *   응답: { message: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================
// 타입 정의
// ============================

interface JobPosting {
  id: string;
  employer_id: string;
  title: string;
  description: string | null;
  required_skills: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  status: 'open' | 'closed' | 'filled';
  created_at: string;
  updated_at: string;
}

interface UpdateJobBody {
  title?: string;
  description?: string;
  required_skills?: string[];
  budget_min?: number;
  budget_max?: number;
  status?: 'open' | 'closed' | 'filled';
}

// ============================
// Supabase 서버 클라이언트
// ============================

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, serviceKey);
}

// ============================
// 인증 헬퍼
// ============================

async function authenticate(
  req: NextRequest
): Promise<{ userId: string } | { error: string; status: number }> {
  const supabase = getSupabaseServer();
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return { error: 'Unauthorized: Bearer 토큰이 필요합니다', status: 401 };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { error: 'Unauthorized: 유효하지 않거나 만료된 토큰입니다', status: 401 };
  }

  return { userId: data.user.id };
}

// ============================
// 허용 상수
// ============================

const ALLOWED_STATUSES = ['open', 'closed', 'filled'] as const;

// ============================
// GET /api/jobs/[id]
// ============================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = getSupabaseServer();
  const { id } = await params;

  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '채용 공고를 찾을 수 없습니다' }, { status: 404 });
      }
      console.error('[jobs/[id] GET] Supabase error:', error.message);
      return NextResponse.json({ error: '채용 공고 조회에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ job: data as JobPosting });
  } catch (err) {
    console.error('[jobs/[id] GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================
// PATCH /api/jobs/[id]
// ============================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = getSupabaseServer();
  const { id } = await params;

  const auth = await authenticate(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { userId } = auth;

  // 공고 소유자 확인
  const { data: existing, error: fetchError } = await supabase
    .from('job_postings')
    .select('employer_id, status')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: '채용 공고를 찾을 수 없습니다' }, { status: 404 });
    }
    return NextResponse.json({ error: '채용 공고 조회에 실패했습니다' }, { status: 500 });
  }

  if (existing.employer_id !== userId) {
    return NextResponse.json({ error: 'Forbidden: 본인의 채용 공고만 수정할 수 있습니다' }, { status: 403 });
  }

  let body: UpdateJobBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '유효하지 않은 JSON 요청입니다' }, { status: 400 });
  }

  const { title, description, required_skills, budget_min, budget_max, status } = body;

  // status 검증
  if (status && !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  // 예산 검증
  const newMin = budget_min ?? null;
  const newMax = budget_max ?? null;
  if (newMin !== null && newMax !== null && newMin > newMax) {
    return NextResponse.json({ error: 'budget_min은 budget_max보다 클 수 없습니다' }, { status: 400 });
  }

  // 업데이트할 필드만 추출
  const updates: Partial<JobPosting> & { updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description;
  if (required_skills !== undefined) updates.required_skills = required_skills;
  if (budget_min !== undefined) updates.budget_min = budget_min;
  if (budget_max !== undefined) updates.budget_max = budget_max;
  if (status !== undefined) updates.status = status;

  try {
    const { data, error } = await supabase
      .from('job_postings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[jobs/[id] PATCH] Supabase error:', error.message);
      return NextResponse.json({ error: '채용 공고 수정에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ job: data as JobPosting });
  } catch (err) {
    console.error('[jobs/[id] PATCH] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================
// DELETE /api/jobs/[id]
// ============================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = getSupabaseServer();
  const { id } = await params;

  const auth = await authenticate(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { userId } = auth;

  // 공고 소유자 확인
  const { data: existing, error: fetchError } = await supabase
    .from('job_postings')
    .select('employer_id')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: '채용 공고를 찾을 수 없습니다' }, { status: 404 });
    }
    return NextResponse.json({ error: '채용 공고 조회에 실패했습니다' }, { status: 500 });
  }

  if (existing.employer_id !== userId) {
    return NextResponse.json({ error: 'Forbidden: 본인의 채용 공고만 삭제할 수 있습니다' }, { status: 403 });
  }

  try {
    const { error } = await supabase
      .from('job_postings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[jobs/[id] DELETE] Supabase error:', error.message);
      return NextResponse.json({ error: '채용 공고 삭제에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ message: '채용 공고가 삭제되었습니다' });
  } catch (err) {
    console.error('[jobs/[id] DELETE] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
