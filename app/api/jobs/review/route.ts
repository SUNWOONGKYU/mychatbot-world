/**
 * @task S3BA3
 * @description 채용 리뷰 시스템
 *
 * POST  /api/jobs/review — 리뷰 작성 (인증 필수)
 *   요청: { job_id, rating, comment, review_type }
 *   - review_type: 'employer_to_freelancer' | 'freelancer_to_employer'
 *   - 정산 완료(status='completed') 후에만 작성 가능
 *   응답: { review: JobReview }
 *
 * GET   /api/jobs/review?job_id= — 채용 리뷰 목록 조회 (공개)
 *   응답: { reviews: JobReview[], average_rating: number }
 *
 * PATCH /api/jobs/review — 리뷰 수정 (작성자만)
 *   요청: { review_id, rating?, comment? }
 *   응답: { review: JobReview }
 *
 * DELETE /api/jobs/review?review_id= — 리뷰 삭제 (작성자만)
 *   응답: { message: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================
// 타입 정의
// ============================

type ReviewType = 'employer_to_freelancer' | 'freelancer_to_employer';

interface JobReview {
  id: string;
  job_id: string;
  reviewer_id: string;
  reviewee_id: string;
  review_type: ReviewType;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateReviewBody {
  job_id: string;
  rating: number;
  comment?: string;
  review_type: ReviewType;
}

interface UpdateReviewBody {
  review_id: string;
  rating?: number;
  comment?: string;
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

const ALLOWED_REVIEW_TYPES: ReviewType[] = [
  'employer_to_freelancer',
  'freelancer_to_employer',
];

// ============================
// POST /api/jobs/review
// ============================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseServer();

  const auth = await authenticate(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { userId } = auth;

  let body: CreateReviewBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '유효하지 않은 JSON 요청입니다' }, { status: 400 });
  }

  const { job_id, rating, comment, review_type } = body;

  // 필수 필드 검증
  if (!job_id) {
    return NextResponse.json({ error: 'job_id는 필수입니다' }, { status: 400 });
  }
  if (!review_type || !ALLOWED_REVIEW_TYPES.includes(review_type)) {
    return NextResponse.json(
      { error: `Invalid review_type. Allowed: ${ALLOWED_REVIEW_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  const ratingNum = typeof rating === 'number' ? rating : parseFloat(String(rating));
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: 'rating은 1~5 사이의 숫자여야 합니다' }, { status: 400 });
  }

  if (comment && comment.length > 2000) {
    return NextResponse.json({ error: 'comment는 2000자를 초과할 수 없습니다' }, { status: 400 });
  }

  // 채용 공고 조회 (고용주/프리랜서 확인 위해)
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

  // 정산 완료 여부 확인 (status='completed' 정산이 있어야 함)
  const { data: completedSettlement, error: settlError } = await supabase
    .from('job_settlements')
    .select('id, employer_id, freelancer_id')
    .eq('job_id', job_id)
    .eq('status', 'completed')
    .limit(1);

  if (settlError) {
    console.warn('[jobs/review POST] 정산 조회 실패:', settlError.message);
  }

  if (!completedSettlement || completedSettlement.length === 0) {
    return NextResponse.json(
      { error: '리뷰는 정산 완료(settlement status="completed") 후에만 작성할 수 있습니다' },
      { status: 403 }
    );
  }

  const settlement = completedSettlement[0];

  // reviewer/reviewee 결정
  let reviewee_id: string;

  if (review_type === 'employer_to_freelancer') {
    // 고용주가 프리랜서를 리뷰
    if (settlement.employer_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: employer_to_freelancer 리뷰는 고용주만 작성할 수 있습니다' },
        { status: 403 }
      );
    }
    reviewee_id = settlement.freelancer_id;
  } else {
    // 프리랜서가 고용주를 리뷰
    if (settlement.freelancer_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: freelancer_to_employer 리뷰는 프리랜서만 작성할 수 있습니다' },
        { status: 403 }
      );
    }
    reviewee_id = settlement.employer_id;
  }

  // 중복 리뷰 확인
  const { data: existingReview } = await supabase
    .from('job_reviews')
    .select('id')
    .eq('job_id', job_id)
    .eq('reviewer_id', userId)
    .eq('review_type', review_type)
    .limit(1);

  if (existingReview && existingReview.length > 0) {
    return NextResponse.json(
      { error: '이미 이 채용 공고에 대한 리뷰를 작성하셨습니다' },
      { status: 409 }
    );
  }

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('job_reviews')
      .insert({
        job_id,
        reviewer_id: userId,
        reviewee_id,
        review_type,
        rating: Math.round(ratingNum * 10) / 10, // 소수점 1자리
        comment: comment ?? null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('[jobs/review POST] Supabase error:', error.message);
      return NextResponse.json({ error: '리뷰 작성에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ review: data as JobReview }, { status: 201 });
  } catch (err) {
    console.error('[jobs/review POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================
// GET /api/jobs/review?job_id=
// ============================

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const job_id = searchParams.get('job_id');
  const reviewee_id = searchParams.get('reviewee_id');

  const supabase = getSupabaseServer();

  try {
    let query = supabase
      .from('job_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (job_id) {
      query = query.eq('job_id', job_id);
    }

    if (reviewee_id) {
      query = query.eq('reviewee_id', reviewee_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[jobs/review GET] Supabase error:', error.message);
      return NextResponse.json({ error: '리뷰 조회에 실패했습니다' }, { status: 500 });
    }

    const reviews = data as JobReview[];

    // 평균 평점 계산
    const averageRating =
      reviews.length > 0
        ? Math.round(
            (reviews.reduce((sum: any, r: any) => sum + r.rating, 0) / reviews.length) * 10
          ) / 10
        : 0;

    return NextResponse.json({ reviews, average_rating: averageRating });
  } catch (err) {
    console.error('[jobs/review GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================
// PATCH /api/jobs/review
// ============================

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseServer();

  const auth = await authenticate(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { userId } = auth;

  let body: UpdateReviewBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '유효하지 않은 JSON 요청입니다' }, { status: 400 });
  }

  const { review_id, rating, comment } = body;

  if (!review_id) {
    return NextResponse.json({ error: 'review_id는 필수입니다' }, { status: 400 });
  }

  // 리뷰 소유자 확인
  const { data: existing, error: fetchError } = await supabase
    .from('job_reviews')
    .select('reviewer_id')
    .eq('id', review_id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: '리뷰를 찾을 수 없습니다' }, { status: 404 });
    }
    return NextResponse.json({ error: '리뷰 조회에 실패했습니다' }, { status: 500 });
  }

  if (existing.reviewer_id !== userId) {
    return NextResponse.json(
      { error: 'Forbidden: 본인이 작성한 리뷰만 수정할 수 있습니다' },
      { status: 403 }
    );
  }

  // 업데이트 필드 검증
  const updates: Partial<JobReview> & { updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (rating !== undefined) {
    const ratingNum = typeof rating === 'number' ? rating : parseFloat(String(rating));
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'rating은 1~5 사이의 숫자여야 합니다' }, { status: 400 });
    }
    updates.rating = Math.round(ratingNum * 10) / 10;
  }

  if (comment !== undefined) {
    if (comment.length > 2000) {
      return NextResponse.json({ error: 'comment는 2000자를 초과할 수 없습니다' }, { status: 400 });
    }
    updates.comment = comment;
  }

  try {
    const { data, error } = await supabase
      .from('job_reviews')
      .update(updates)
      .eq('id', review_id)
      .select()
      .single();

    if (error) {
      console.error('[jobs/review PATCH] Supabase error:', error.message);
      return NextResponse.json({ error: '리뷰 수정에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ review: data as JobReview });
  } catch (err) {
    console.error('[jobs/review PATCH] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================
// DELETE /api/jobs/review?review_id=
// ============================

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseServer();

  const auth = await authenticate(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { userId } = auth;

  const { searchParams } = new URL(req.url);
  const review_id = searchParams.get('review_id');

  if (!review_id) {
    return NextResponse.json({ error: 'review_id 쿼리 파라미터가 필요합니다' }, { status: 400 });
  }

  // 소유자 확인
  const { data: existing, error: fetchError } = await supabase
    .from('job_reviews')
    .select('reviewer_id')
    .eq('id', review_id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: '리뷰를 찾을 수 없습니다' }, { status: 404 });
    }
    return NextResponse.json({ error: '리뷰 조회에 실패했습니다' }, { status: 500 });
  }

  if (existing.reviewer_id !== userId) {
    return NextResponse.json(
      { error: 'Forbidden: 본인이 작성한 리뷰만 삭제할 수 있습니다' },
      { status: 403 }
    );
  }

  try {
    const { error } = await supabase
      .from('job_reviews')
      .delete()
      .eq('id', review_id);

    if (error) {
      console.error('[jobs/review DELETE] Supabase error:', error.message);
      return NextResponse.json({ error: '리뷰 삭제에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ message: '리뷰가 삭제되었습니다' });
  } catch (err) {
    console.error('[jobs/review DELETE] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
