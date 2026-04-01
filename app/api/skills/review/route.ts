/**
 * @task S3BA2
 * @description 스킬 리뷰/평점 API
 *
 * POST /api/skills/review  — 리뷰 작성 또는 수정 (UPSERT, 설치한 스킬만 가능)
 * GET  /api/skills/review  — 특정 스킬의 리뷰 목록 조회
 *
 * 쿼리 파라미터 (GET):
 *   skill_id — 조회할 스킬 ID (필수)
 *   page     — 페이지 번호 (기본 1)
 *   limit    — 페이지당 리뷰 수 (기본 20, 최대 50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================
// 타입 정의
// ============================

interface ReviewUpsertRequest {
  skill_id: string;
  /** 1~5 정수 */
  rating: number;
  review_text?: string;
}

interface ReviewRow {
  id: string;
  user_id: string;
  skill_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
}

// ============================
// Supabase 클라이언트
// ============================

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key) as any;
}

function getSupabaseUser(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

// ============================
// POST /api/skills/review — 리뷰 작성 (UPSERT)
// ============================

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ReviewUpsertRequest;
    const { skill_id, rating, review_text } = body;

    // 입력 검증
    if (!skill_id?.trim()) {
      return NextResponse.json(
        { error: 'skill_id가 필요합니다.' },
        { status: 400 }
      );
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'rating은 1~5 사이의 정수여야 합니다.' },
        { status: 400 }
      );
    }

    // 인증 확인
    const supabaseUser = getSupabaseUser(req);
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    // 설치 여부 확인 (설치한 스킬만 리뷰 가능)
    const { data: installation } = await supabase
      .from('skill_installations')
      .select('id')
      .eq('user_id', user.id)
      .eq('skill_id', skill_id)
      .eq('status', 'active')
      .maybeSingle();

    if (!installation) {
      return NextResponse.json(
        { error: '설치된 스킬에만 리뷰를 작성할 수 있습니다.' },
        { status: 403 }
      );
    }

    // UPSERT: UNIQUE(user_id, skill_id) 제약 활용
    const { data: review, error: upsertError } = await supabase
      .from('skill_reviews')
      .upsert(
        {
          user_id: user.id,
          skill_id,
          rating,
          review_text: review_text?.trim() ?? null,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,skill_id',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('[POST /api/skills/review] upsert error:', upsertError);
      throw upsertError;
    }

    return NextResponse.json(
      { message: '리뷰가 저장되었습니다.', review },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/skills/review] error:', error);
    return NextResponse.json(
      { error: '리뷰 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// ============================
// GET /api/skills/review — 리뷰 목록 조회
// ============================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skillId = searchParams.get('skill_id')?.trim();

    if (!skillId) {
      return NextResponse.json(
        { error: 'skill_id 쿼리 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')));
    const offset = (page - 1) * limit;

    const supabase = getSupabaseServer();

    // 리뷰 목록 조회
    const { data: reviews, error, count } = await supabase
      .from('skill_reviews')
      .select('id, user_id, skill_id, rating, review_text, created_at', {
        count: 'exact',
      })
      .eq('skill_id', skillId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[GET /api/skills/review] query error:', error);
      throw error;
    }

    // 평균 평점 계산
    const rows = (reviews ?? []) as ReviewRow[];
    const avgRating =
      rows.length > 0
        ? Math.round(
            (rows.reduce((sum: any, r: any) => sum + r.rating, 0) / rows.length) * 10
          ) / 10
        : null;

    return NextResponse.json({
      skill_id: skillId,
      reviews: rows,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
      summary: {
        avg_rating: avgRating,
        review_count: count ?? 0,
      },
    });
  } catch (error) {
    console.error('[GET /api/skills/review] error:', error);
    return NextResponse.json(
      { error: '리뷰 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
