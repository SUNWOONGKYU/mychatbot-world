/**
 * @task S5BA5
 * @description Wiki CRUD API — 위키 페이지 조회/수정/삭제
 *
 * GET    /api/wiki/pages?bot_id=xxx&page=1&limit=20&type=faq
 * POST   /api/wiki/pages  — 수동 위키 페이지 생성
 * PATCH  /api/wiki/pages?id=xxx — 수정
 * DELETE /api/wiki/pages?id=xxx — 삭제
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ============================
// Supabase 서버 클라이언트
// ============================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ============================
// 타입 정의
// ============================

interface WikiPage {
  id: string;
  bot_id: string;
  slug: string;
  title: string;
  content: string;
  page_type: string;
  source_kb_ids: string[];
  auto_generated: boolean;
  quality_score: number;
  view_count: number;
  is_stale: boolean;
  created_at: string;
  updated_at: string;
}

// ============================
// GET /api/wiki/pages
// ============================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();

  const { searchParams } = new URL(request.url);
  const botId = searchParams.get('bot_id');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
  const pageType = searchParams.get('type');
  const offset = (page - 1) * limit;

  if (!botId) {
    return NextResponse.json({ success: false, error: 'bot_id가 필요합니다.', data: null }, { status: 400 });
  }

  try {
    let query = supabase
      .from('wiki_pages')
      .select('id, bot_id, slug, title, page_type, quality_score, view_count, is_stale, auto_generated, created_at, updated_at', { count: 'exact' })
      .eq('bot_id', botId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (pageType) {
      query = query.eq('page_type', pageType);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      error: null,
      data: {
        items: data as WikiPage[],
        total: count ?? 0,
        page,
        limit,
        hasMore: (count ?? 0) > offset + limit,
      },
    });
  } catch (err) {
    console.error('[wiki/pages GET] 오류:', err);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.', data: null }, { status: 500 });
  }
}

// ============================
// POST /api/wiki/pages
// ============================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }

  let body: Partial<WikiPage>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: '잘못된 요청 형식입니다.', data: null }, { status: 400 });
  }

  if (!body.bot_id || !body.slug || !body.title || !body.content) {
    return NextResponse.json({ success: false, error: 'bot_id, slug, title, content가 필요합니다.', data: null }, { status: 400 });
  }

  try {
    // 봇 소유권 확인
    const { data: bot } = await supabase
      .from('mcw_bots')
      .select('id')
      .eq('id', body.bot_id)
      .eq('owner_id', session.user.id)
      .single();

    if (!bot) {
      return NextResponse.json({ success: false, error: '접근 권한이 없습니다.', data: null }, { status: 403 });
    }

    const { data: newPage, error: insertError } = await supabase
      .from('wiki_pages')
      .insert({
        bot_id: body.bot_id,
        slug: body.slug,
        title: body.title,
        content: body.content,
        page_type: body.page_type ?? 'concept',
        source_kb_ids: body.source_kb_ids ?? [],
        auto_generated: false,
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({ success: true, error: null, data: newPage }, { status: 201 });
  } catch (err) {
    console.error('[wiki/pages POST] 오류:', err);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.', data: null }, { status: 500 });
  }
}

// ============================
// PATCH /api/wiki/pages?id=xxx
// ============================

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'id가 필요합니다.', data: null }, { status: 400 });
  }

  let body: Partial<WikiPage>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: '잘못된 요청 형식입니다.', data: null }, { status: 400 });
  }

  try {
    // 소유권 확인 (wiki_pages → mcw_bots 조인)
    const { data: existing } = await supabase
      .from('wiki_pages')
      .select('id, bot_id, mcw_bots!inner(owner_id)')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: '위키 페이지를 찾을 수 없습니다.', data: null }, { status: 404 });
    }

    const ownerCheck = existing.mcw_bots as unknown as { owner_id: string };
    if (ownerCheck.owner_id !== session.user.id) {
      return NextResponse.json({ success: false, error: '수정 권한이 없습니다.', data: null }, { status: 403 });
    }

    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updateFields.title = body.title;
    if (body.content !== undefined) updateFields.content = body.content;
    if (body.page_type !== undefined) updateFields.page_type = body.page_type;
    if (body.is_stale !== undefined) updateFields.is_stale = body.is_stale;

    const { data: updated, error: updateError } = await supabase
      .from('wiki_pages')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ success: true, error: null, data: updated });
  } catch (err) {
    console.error('[wiki/pages PATCH] 오류:', err);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.', data: null }, { status: 500 });
  }
}

// ============================
// DELETE /api/wiki/pages?id=xxx
// ============================

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'id가 필요합니다.', data: null }, { status: 400 });
  }

  try {
    // 소유권 확인
    const { data: existing } = await supabase
      .from('wiki_pages')
      .select('id, mcw_bots!inner(owner_id)')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: '위키 페이지를 찾을 수 없습니다.', data: null }, { status: 404 });
    }

    const ownerCheck = existing.mcw_bots as unknown as { owner_id: string };
    if (ownerCheck.owner_id !== session.user.id) {
      return NextResponse.json({ success: false, error: '삭제 권한이 없습니다.', data: null }, { status: 403 });
    }

    const { error: deleteError } = await supabase.from('wiki_pages').delete().eq('id', id);
    if (deleteError) throw new Error(deleteError.message);

    return NextResponse.json({ success: true, error: null, data: { id, deleted: true } });
  } catch (err) {
    console.error('[wiki/pages DELETE] 오류:', err);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.', data: null }, { status: 500 });
  }
}
