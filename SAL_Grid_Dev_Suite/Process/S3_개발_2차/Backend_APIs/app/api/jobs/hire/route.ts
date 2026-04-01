/**
 * @task S3BA3
 * @description 채용 워크플로우 API
 *
 * POST /api/jobs/hire — 지원자 채용 확정 (인증 필수, 고용주만)
 *   요청: { job_id, applicant_id }
 *   동작:
 *     1. job_matches.status → 'hired' (선택된 지원자)
 *     2. 나머지 지원자 → 'rejected'
 *     3. job_postings.status → 'filled'
 *   응답: { hired: JobMatch, rejected_count: number, job: JobPosting }
 *
 * GET /api/jobs/hire?job_id= — 채용 현황 조회 (인증 필수)
 *   응답: { matches: JobMatch[], hired: JobMatch | null }
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
  status: 'open' | 'closed' | 'filled';
  required_skills: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
  updated_at: string;
}

interface JobMatch {
  id: string;
  job_id: string;
  applicant_id: string;
  match_score: number;
  matched_at: string;
  status: 'pending' | 'hired' | 'rejected';
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
// POST /api/jobs/hire
// ============================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseServer();

  const auth = await authenticate(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { userId } = auth;

  let body: { job_id: string; applicant_id: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '유효하지 않은 JSON 요청입니다' }, { status: 400 });
  }

  const { job_id, applicant_id } = body;

  if (!job_id || !applicant_id) {
    return NextResponse.json({ error: 'job_id와 applicant_id는 필수입니다' }, { status: 400 });
  }

  // 채용 공고 조회 및 소유자 확인
  const { data: job, error: jobError } = await supabase
    .from('job_postings')
    .select('*')
    .eq('id', job_id)
    .single();

  if (jobError) {
    if (jobError.code === 'PGRST116') {
      return NextResponse.json({ error: '채용 공고를 찾을 수 없습니다' }, { status: 404 });
    }
    return NextResponse.json({ error: '채용 공고 조회에 실패했습니다' }, { status: 500 });
  }

  const jobData = job as JobPosting;

  if (jobData.employer_id !== userId) {
    return NextResponse.json(
      { error: 'Forbidden: 본인의 채용 공고에서만 채용 확정을 할 수 있습니다' },
      { status: 403 }
    );
  }

  if (jobData.status === 'filled') {
    return NextResponse.json(
      { error: '이미 채용이 완료된 공고입니다' },
      { status: 409 }
    );
  }

  if (jobData.status === 'closed') {
    return NextResponse.json(
      { error: '마감된 채용 공고에는 채용 확정을 할 수 없습니다' },
      { status: 400 }
    );
  }

  // 선택된 지원자의 매칭 레코드 확인
  const { data: targetMatch, error: matchError } = await supabase
    .from('job_matches')
    .select('*')
    .eq('job_id', job_id)
    .eq('applicant_id', applicant_id)
    .single();

  if (matchError) {
    if (matchError.code === 'PGRST116') {
      return NextResponse.json(
        { error: '해당 지원자의 매칭 레코드를 찾을 수 없습니다. 먼저 /api/jobs/match 를 실행하세요' },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: '매칭 레코드 조회에 실패했습니다' }, { status: 500 });
  }

  try {
    // 트랜잭션 흉내: 순차 실행
    // 1. 선택된 지원자 → 'hired'
    const { data: hiredMatch, error: hireError } = await supabase
      .from('job_matches')
      .update({ status: 'hired' })
      .eq('id', (targetMatch as JobMatch).id)
      .select()
      .single();

    if (hireError) {
      console.error('[jobs/hire] hired 업데이트 실패:', hireError.message);
      return NextResponse.json({ error: '채용 확정 처리에 실패했습니다' }, { status: 500 });
    }

    // 2. 나머지 pending 지원자 → 'rejected'
    const { error: rejectError, count: rejectedCount } = await supabase
      .from('job_matches')
      .update({ status: 'rejected' })
      .eq('job_id', job_id)
      .eq('status', 'pending')
      .neq('applicant_id', applicant_id);

    if (rejectError) {
      console.warn('[jobs/hire] 나머지 지원자 rejected 처리 실패:', rejectError.message);
      // 부분 실패 허용 — 주요 hired 처리는 완료됨
    }

    // 3. 채용 공고 status → 'filled'
    const { data: updatedJob, error: jobUpdateError } = await supabase
      .from('job_postings')
      .update({ status: 'filled', updated_at: new Date().toISOString() })
      .eq('id', job_id)
      .select()
      .single();

    if (jobUpdateError) {
      console.warn('[jobs/hire] job status 업데이트 실패:', jobUpdateError.message);
    }

    return NextResponse.json({
      hired: hiredMatch as JobMatch,
      rejected_count: rejectedCount ?? 0,
      job: (updatedJob ?? jobData) as JobPosting,
    });
  } catch (err) {
    console.error('[jobs/hire POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================
// GET /api/jobs/hire?job_id=
// ============================

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseServer();

  const auth = await authenticate(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { userId } = auth;

  const { searchParams } = new URL(req.url);
  const job_id = searchParams.get('job_id');

  if (!job_id) {
    return NextResponse.json({ error: 'job_id 쿼리 파라미터가 필요합니다' }, { status: 400 });
  }

  // 소유자 확인
  const { data: job, error: jobError } = await supabase
    .from('job_postings')
    .select('employer_id, status')
    .eq('id', job_id)
    .single();

  if (jobError) {
    if (jobError.code === 'PGRST116') {
      return NextResponse.json({ error: '채용 공고를 찾을 수 없습니다' }, { status: 404 });
    }
    return NextResponse.json({ error: '채용 공고 조회에 실패했습니다' }, { status: 500 });
  }

  if (job.employer_id !== userId) {
    return NextResponse.json(
      { error: 'Forbidden: 본인의 채용 공고 현황만 조회할 수 있습니다' },
      { status: 403 }
    );
  }

  try {
    const { data: matches, error: matchesError } = await supabase
      .from('job_matches')
      .select('*')
      .eq('job_id', job_id)
      .order('match_score', { ascending: false });

    if (matchesError) {
      console.error('[jobs/hire GET] Supabase error:', matchesError.message);
      return NextResponse.json({ error: '채용 현황 조회에 실패했습니다' }, { status: 500 });
    }

    const allMatches = matches as JobMatch[];
    const hired = allMatches.find((m) => m.status === 'hired') ?? null;

    return NextResponse.json({
      matches: allMatches,
      hired,
      job_status: job.status,
    });
  } catch (err) {
    console.error('[jobs/hire GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
