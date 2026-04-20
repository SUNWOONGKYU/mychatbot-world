/**
 * @task S3BA3
 * @description Jobs API — 채용 공고 목록/검색/생성
 *
 * GET  /api/jobs — 채용 공고 목록 조회 (공개)
 *   쿼리: status, search, limit, offset
 *   응답: { jobs: JobPosting[], total: number }
 *
 * POST /api/jobs — 채용 공고 생성 (인증 필수)
 *   요청: { title, description, required_skills, budget_min, budget_max }
 *   응답: { job: JobPosting }
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
  post_type: 'hiring' | 'seeking';
  created_at: string;
  updated_at: string;
}

interface CreateJobBody {
  title: string;
  description?: string;
  required_skills?: string[];
  budget_min?: number;
  budget_max?: number;
  post_type?: 'hiring' | 'seeking';
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
const ALLOWED_POST_TYPES = ['hiring', 'seeking'] as const;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

// ============================
// GET /api/jobs
// ============================

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseServer();
  const { searchParams } = new URL(req.url);

  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const postType = searchParams.get('post_type');
  const rawLimit = searchParams.get('limit');
  const rawOffset = searchParams.get('offset');

  // 파라미터 검증
  if (status && !ALLOWED_STATUSES.includes(status as typeof ALLOWED_STATUSES[number])) {
    return NextResponse.json(
      { error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  if (postType && !ALLOWED_POST_TYPES.includes(postType as typeof ALLOWED_POST_TYPES[number])) {
    return NextResponse.json(
      { error: `Invalid post_type. Allowed: ${ALLOWED_POST_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  const limit = Math.min(parseInt(rawLimit ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = Math.max(parseInt(rawOffset ?? '0', 10) || 0, 0);

  try {
    let query = supabase
      .from('job_postings')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (postType) {
      query = query.eq('post_type', postType);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[jobs GET] Supabase error:', error.message);
      return NextResponse.json({ error: '채용 공고 조회에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ jobs: data as JobPosting[], total: count ?? 0 });
  } catch (err) {
    console.error('[jobs GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================
// POST /api/jobs
// ============================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseServer();

  const auth = await authenticate(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { userId } = auth;

  let body: CreateJobBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '유효하지 않은 JSON 요청입니다' }, { status: 400 });
  }

  const { title, description, required_skills, budget_min, budget_max, post_type } = body;

  // 필수 필드 검증
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'title은 필수입니다' }, { status: 400 });
  }

  if (title.length > 200) {
    return NextResponse.json({ error: 'title은 200자를 초과할 수 없습니다' }, { status: 400 });
  }

  // post_type 검증
  const finalPostType: 'hiring' | 'seeking' =
    post_type === 'seeking' ? 'seeking' : 'hiring';
  if (post_type && !ALLOWED_POST_TYPES.includes(post_type)) {
    return NextResponse.json(
      { error: `Invalid post_type. Allowed: ${ALLOWED_POST_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  // 예산 검증
  if (budget_min !== undefined && budget_max !== undefined) {
    if (budget_min > budget_max) {
      return NextResponse.json({ error: 'budget_min은 budget_max보다 클 수 없습니다' }, { status: 400 });
    }
  }

  try {
    const { data, error } = await supabase
      .from('job_postings')
      .insert({
        employer_id: userId,
        title: title.trim(),
        description: description ?? null,
        required_skills: required_skills ?? null,
        budget_min: budget_min ?? null,
        budget_max: budget_max ?? null,
        status: 'open',
        post_type: finalPostType,
      })
      .select()
      .single();

    if (error) {
      console.error('[jobs POST] Supabase error:', error.message);
      return NextResponse.json({ error: '채용 공고 생성에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ job: data as JobPosting }, { status: 201 });
  } catch (err) {
    console.error('[jobs POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
