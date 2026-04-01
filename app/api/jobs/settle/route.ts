/**
 * @task S3BA3
 * @description 채용 정산 API — 20% 수수료 자동 계산
 *
 * POST /api/jobs/settle — 정산 생성 (인증 필수, 고용주만)
 *   요청: { job_id, gross_amount, freelancer_id }
 *   응답: { settlement: JobSettlement }
 *
 * GET  /api/jobs/settle?job_id= — 정산 내역 조회 (인증 필수)
 *   응답: { settlements: JobSettlement[] }
 *
 * PATCH /api/jobs/settle — 정산 상태 변경 (인증 필수)
 *   요청: { settlement_id, status }
 *   응답: { settlement: JobSettlement }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================
// 타입 정의
// ============================

interface JobSettlement {
  id: string;
  job_id: string;
  employer_id: string;
  freelancer_id: string;
  gross_amount: number;
  commission_rate: number;
  commission_amount: number;
  net_amount: number;
  settled_at: string;
  status: 'pending' | 'completed' | 'disputed';
}

interface CreateSettlementBody {
  job_id: string;
  gross_amount: number;
  freelancer_id: string;
}

interface UpdateSettlementBody {
  settlement_id: string;
  status: 'pending' | 'completed' | 'disputed';
}

// ============================
// 수수료 상수 (20% 고정)
// ============================

const COMMISSION_RATE = 0.20; // 20%

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
// POST /api/jobs/settle
// ============================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseServer();

  const auth = await authenticate(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { userId } = auth;

  let body: CreateSettlementBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '유효하지 않은 JSON 요청입니다' }, { status: 400 });
  }

  const { job_id, gross_amount, freelancer_id } = body;

  // 필수 필드 검증
  if (!job_id) {
    return NextResponse.json({ error: 'job_id는 필수입니다' }, { status: 400 });
  }
  if (!freelancer_id) {
    return NextResponse.json({ error: 'freelancer_id는 필수입니다' }, { status: 400 });
  }
  if (gross_amount === undefined || gross_amount === null) {
    return NextResponse.json({ error: 'gross_amount는 필수입니다' }, { status: 400 });
  }

  const amount = typeof gross_amount === 'number' ? gross_amount : parseFloat(String(gross_amount));

  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: 'gross_amount는 0보다 큰 숫자여야 합니다' }, { status: 400 });
  }

  // 채용 공고 확인 및 소유자 검증
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
      { error: 'Forbidden: 본인의 채용 공고에 대해서만 정산을 생성할 수 있습니다' },
      { status: 403 }
    );
  }

  if (job.status !== 'filled') {
    return NextResponse.json(
      { error: '정산은 채용 완료(status="filled") 상태에서만 가능합니다' },
      { status: 400 }
    );
  }

  // 중복 정산 확인 (동일 job에 대한 pending/completed 정산이 있는지)
  const { data: existing, error: existingError } = await supabase
    .from('job_settlements')
    .select('id, status')
    .eq('job_id', job_id)
    .in('status', ['pending', 'completed'])
    .limit(1);

  if (!existingError && existing && existing.length > 0) {
    return NextResponse.json(
      { error: '이미 정산이 존재합니다. 기존 정산을 확인하세요' },
      { status: 409 }
    );
  }

  // 20% 수수료 계산
  const commission_amount = Math.round(amount * COMMISSION_RATE);
  const net_amount = amount - commission_amount;

  try {
    const { data, error } = await supabase
      .from('job_settlements')
      .insert({
        job_id,
        employer_id: userId,
        freelancer_id,
        gross_amount: Math.round(amount),
        commission_rate: 20.00, // COMMISSION_RATE × 100
        commission_amount,
        net_amount,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[jobs/settle POST] Supabase error:', error.message);
      return NextResponse.json({ error: '정산 생성에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ settlement: data as JobSettlement }, { status: 201 });
  } catch (err) {
    console.error('[jobs/settle POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================
// GET /api/jobs/settle?job_id=
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

  try {
    let query = supabase
      .from('job_settlements')
      .select('*')
      .or(`employer_id.eq.${userId},freelancer_id.eq.${userId}`)
      .order('settled_at', { ascending: false });

    if (job_id) {
      query = query.eq('job_id', job_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[jobs/settle GET] Supabase error:', error.message);
      return NextResponse.json({ error: '정산 내역 조회에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ settlements: data as JobSettlement[] });
  } catch (err) {
    console.error('[jobs/settle GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================
// PATCH /api/jobs/settle
// ============================

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseServer();

  const auth = await authenticate(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { userId } = auth;

  let body: UpdateSettlementBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '유효하지 않은 JSON 요청입니다' }, { status: 400 });
  }

  const { settlement_id, status } = body;

  if (!settlement_id) {
    return NextResponse.json({ error: 'settlement_id는 필수입니다' }, { status: 400 });
  }

  const ALLOWED_STATUSES: Array<JobSettlement['status']> = ['pending', 'completed', 'disputed'];
  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  // 정산 조회 및 권한 확인
  const { data: settlement, error: fetchError } = await supabase
    .from('job_settlements')
    .select('*')
    .eq('id', settlement_id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: '정산 레코드를 찾을 수 없습니다' }, { status: 404 });
    }
    return NextResponse.json({ error: '정산 조회에 실패했습니다' }, { status: 500 });
  }

  const settl = settlement as JobSettlement;

  // employer 또는 freelancer만 수정 가능
  if (settl.employer_id !== userId && settl.freelancer_id !== userId) {
    return NextResponse.json(
      { error: 'Forbidden: 관련 당사자만 정산 상태를 변경할 수 있습니다' },
      { status: 403 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('job_settlements')
      .update({ status })
      .eq('id', settlement_id)
      .select()
      .single();

    if (error) {
      console.error('[jobs/settle PATCH] Supabase error:', error.message);
      return NextResponse.json({ error: '정산 상태 변경에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ settlement: data as JobSettlement });
  } catch (err) {
    console.error('[jobs/settle PATCH] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
