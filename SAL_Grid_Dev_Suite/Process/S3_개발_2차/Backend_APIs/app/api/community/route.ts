/**
 * @task S3BA4
 * @description 커뮤니티 게시글 API — 스레딩 지원 (목록/작성/수정/삭제)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

/** 정렬 옵션 */
type SortOption = 'latest' | 'popular' | 'trending';

/**
 * GET: 게시글 목록 (카테고리/정렬/페이지네이션)
 * Query params:
 *   - category: 카테고리 필터 (optional)
 *   - sort: 'latest' | 'popular' | 'trending' (default: 'latest')
 *   - page: 페이지 번호 (default: 1)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const sort = (searchParams.get('sort') ?? 'latest') as SortOption;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = createClient();

  let query = supabase
    .from('posts')
    .select('*, comments(count)', { count: 'exact' });

  if (category) {
    query = query.eq('category', category);
  }

  switch (sort) {
    case 'popular':
      query = query.order('likes', { ascending: false });
      break;
    case 'trending':
      // trending: 최근 24h 내 좋아요 + 댓글 수 기반
      query = query
        .gte('created_at', new Date(Date.now() - 86_400_000).toISOString())
        .order('likes', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch posts', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    posts: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}

/**
 * POST: 게시글 작성
 * Body: { title, content, category, tags? }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { title?: string; content?: string; category?: string; tags?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, content, category, tags } = body;

  if (!title || !content || !category) {
    return NextResponse.json(
      { error: 'title, content, category are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      title,
      content,
      category,
      tags: tags ?? [],
      user_id: user.id,
      likes: 0,
      comment_count: 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create post', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ post: data }, { status: 201 });
}
