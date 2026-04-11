/**
 * @task S2BA3 - Home API (KB 임베딩, 설정 저장, 클라우드 동기화)
 * @description Knowledge Base CRUD API
 *
 * Endpoints:
 * - GET  /api/kb          Knowledge Base 목록 조회 (챗봇 ID 필터)
 * - POST /api/kb          Knowledge Base 항목 등록
 * - DELETE /api/kb?id=xx  Knowledge Base 항목 삭제 (관련 임베딩 포함)
 *
 * 인증: Supabase Auth 세션 필수
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ============================
// 타입 정의
// ============================

/** Knowledge Base 항목 */
interface KbItem {
  id: string;
  chatbot_id: string;
  title: string;
  content: string;
  source_type: 'text' | 'file' | 'url';
  source_url?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  char_count: number;
  chunk_count: number;
  is_embedded: boolean;
  created_at: string;
  updated_at: string;
}

/** KB 생성 요청 바디 */
interface CreateKbRequest {
  chatbot_id: string;
  title: string;
  content: string;
  source_type?: 'text' | 'file' | 'url';
  source_url?: string;
}

// ============================
// GET /api/kb
// ============================

/**
 * Knowledge Base 목록 조회
 * @param request - Next.js Request (쿼리: chatbot_id 필수, limit, offset)
 * @returns KB 항목 목록 + 총 개수
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }

  // 쿼리 파라미터 파싱
  const { searchParams } = new URL(request.url);
  const chatbotId = searchParams.get('chatbot_id');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0');

  if (!chatbotId) {
    return NextResponse.json(
      { success: false, error: 'chatbot_id 파라미터가 필요합니다.', data: null },
      { status: 400 }
    );
  }

  try {
    // 챗봇 소유권 확인
    const { data: chatbot, error: chatbotError } = await supabase
      .from('mcw_bots')
      .select('id, owner_id')
      .eq('id', chatbotId)
      .eq('owner_id', user.id)
      .single();

    if (chatbotError || !chatbot) {
      return NextResponse.json(
        { success: false, error: '챗봇을 찾을 수 없거나 접근 권한이 없습니다.', data: null },
        { status: 403 }
      );
    }

    // KB 목록 조회
    const { data: items, error: listError, count } = await supabase
      .from('mcw_kb_items')
      .select('*', { count: 'exact' })
      .eq('bot_id', chatbotId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (listError) {
      console.error('[KB GET] 목록 조회 실패:', listError.message);
      return NextResponse.json(
        { success: false, error: 'KB 목록을 불러오는 데 실패했습니다.', data: null },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      error: null,
      data: {
        items: items as KbItem[],
        total: count ?? 0,
        limit,
        offset,
        hasMore: (count ?? 0) > offset + limit,
      },
    });
  } catch (err) {
    console.error('[KB GET] 예기치 않은 오류:', err);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', data: null },
      { status: 500 }
    );
  }
}

// ============================
// POST /api/kb
// ============================

/**
 * Knowledge Base 항목 등록
 * @param request - Next.js Request (JSON 바디: CreateKbRequest)
 * @returns 생성된 KB 항목
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }

  // 요청 바디 파싱
  let body: CreateKbRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다.', data: null },
      { status: 400 }
    );
  }

  // 필수 필드 검증
  if (!body.chatbot_id || !body.title || !body.content) {
    return NextResponse.json(
      {
        success: false,
        error: 'chatbot_id, title, content 필드가 필요합니다.',
        data: null,
      },
      { status: 400 }
    );
  }

  if (body.content.length > 500_000) {
    return NextResponse.json(
      { success: false, error: '내용이 너무 깁니다. 최대 500,000자까지 허용됩니다.', data: null },
      { status: 400 }
    );
  }

  try {
    // 챗봇 소유권 확인
    const { data: chatbot, error: chatbotError } = await supabase
      .from('mcw_bots')
      .select('id')
      .eq('id', body.chatbot_id)
      .eq('owner_id', user.id)
      .single();

    if (chatbotError || !chatbot) {
      return NextResponse.json(
        { success: false, error: '챗봇을 찾을 수 없거나 접근 권한이 없습니다.', data: null },
        { status: 403 }
      );
    }

    // KB 항목 삽입
    const { data: newItem, error: insertError } = await supabase
      .from('mcw_kb_items')
      .insert({
        bot_id: body.chatbot_id,
        title: body.title.trim(),
        content: body.content,
        source_type: body.source_type ?? 'text',
        source_url: body.source_url ?? null,
        char_count: body.content.length,
        chunk_count: 0,      // 임베딩 완료 시 업데이트
        is_embedded: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[KB POST] 삽입 실패:', insertError.message);
      return NextResponse.json(
        { success: false, error: 'KB 항목 저장에 실패했습니다.', data: null },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, error: null, data: newItem as KbItem },
      { status: 201 }
    );
  } catch (err) {
    console.error('[KB POST] 예기치 않은 오류:', err);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', data: null },
      { status: 500 }
    );
  }
}

// ============================
// DELETE /api/kb?id=xx
// ============================

/**
 * Knowledge Base 항목 삭제 (관련 임베딩 포함)
 * @param request - Next.js Request (쿼리: id 필수)
 * @returns 삭제 성공 여부
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kbId = searchParams.get('id');

  if (!kbId) {
    return NextResponse.json(
      { success: false, error: 'id 파라미터가 필요합니다.', data: null },
      { status: 400 }
    );
  }

  try {
    // KB 항목 소유권 확인 (mcw_bots 조인)
    const { data: kbItem, error: findError } = await supabase
      .from('mcw_kb_items')
      .select('id, bot_id, file_path, mcw_bots!inner(owner_id)')
      .eq('id', kbId)
      .single();

    if (findError || !kbItem) {
      return NextResponse.json(
        { success: false, error: 'KB 항목을 찾을 수 없습니다.', data: null },
        { status: 404 }
      );
    }

    // 소유권 검증
    const chatbot = kbItem.mcw_bots as unknown as { owner_id: string };
    if (chatbot.owner_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '삭제 권한이 없습니다.', data: null },
        { status: 403 }
      );
    }

    // 관련 임베딩 먼저 삭제 (CASCADE 미설정 시 수동 삭제)
    const { error: embeddingDeleteError } = await supabase
      .from('kb_embeddings')
      .delete()
      .eq('kb_item_id', kbId);

    if (embeddingDeleteError) {
      console.error('[KB DELETE] 임베딩 삭제 실패:', embeddingDeleteError.message);
      // 임베딩 삭제 실패는 경고만 (KB 항목 삭제는 계속 진행)
    }

    // Supabase Storage 파일 삭제 (파일 업로드로 등록된 경우)
    if (kbItem.file_path) {
      const { error: storageError } = await supabase.storage
        .from('kb-files')
        .remove([kbItem.file_path]);

      if (storageError) {
        console.warn('[KB DELETE] 스토리지 파일 삭제 실패:', storageError.message);
        // 스토리지 실패는 경고만 처리
      }
    }

    // KB 항목 삭제
    const { error: deleteError } = await supabase
      .from('mcw_kb_items')
      .delete()
      .eq('id', kbId);

    if (deleteError) {
      console.error('[KB DELETE] 항목 삭제 실패:', deleteError.message);
      return NextResponse.json(
        { success: false, error: 'KB 항목 삭제에 실패했습니다.', data: null },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      error: null,
      data: { id: kbId, deleted: true },
    });
  } catch (err) {
    console.error('[KB DELETE] 예기치 않은 오류:', err);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', data: null },
      { status: 500 }
    );
  }
}
