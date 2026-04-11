/**
 * @task S2BA3
 * @description KB 텍스트 직접 입력 API
 *
 * Endpoints:
 * - POST /api/kb/text  텍스트를 KB 항목으로 직접 등록
 *
 * Body: { content: string, chatbot_id?: string, title?: string }
 * - chatbot_id 미제공 시 사용자의 첫 번째 챗봇에 등록
 * - title 미제공 시 내용 첫 40자를 제목으로 사용
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const MAX_CONTENT_LENGTH = 500_000;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key) as ReturnType<typeof createClient>;
}

async function authenticate(
  supabase: ReturnType<typeof createClient>,
  authHeader: string | null,
): Promise<{ userId: string | null; error: string | null }> {
  if (!authHeader) return { userId: null, error: 'Unauthorized: missing Authorization header' };
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { userId: null, error: 'Unauthorized: missing Bearer token' };
  const { data, error } = await (supabase as any).auth.getUser(token);
  if (error || !data?.user) return { userId: null, error: 'Unauthorized: invalid or expired token' };
  return { userId: data.user.id, error: null };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { userId, error: authError } = await authenticate(supabase, req.headers.get('Authorization'));
    if (authError || !userId) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    let body: { content?: string; chatbot_id?: string; title?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }

    const { content, chatbot_id, title } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'content 필드가 필요합니다.' }, { status: 400 });
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `내용이 너무 깁니다. 최대 ${MAX_CONTENT_LENGTH.toLocaleString()}자까지 허용됩니다.` },
        { status: 400 },
      );
    }

    // chatbot_id 결정: 제공된 것 사용 or 사용자의 첫 번째 봇 자동 선택
    let targetChatbotId = chatbot_id?.trim();

    if (!targetChatbotId) {
      const { data: firstBot } = await (supabase as any)
        .from('mcw_bots')
        .select('id')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (!firstBot) {
        return NextResponse.json(
          { success: false, error: '챗봇이 없습니다. 먼저 챗봇을 생성해주세요.' },
          { status: 404 },
        );
      }
      targetChatbotId = firstBot.id;
    } else {
      // chatbot_id 제공 시 소유권 확인
      const { data: bot } = await (supabase as any)
        .from('mcw_bots')
        .select('id')
        .eq('id', targetChatbotId)
        .eq('owner_id', userId)
        .single();

      if (!bot) {
        return NextResponse.json(
          { success: false, error: '챗봇을 찾을 수 없거나 접근 권한이 없습니다.' },
          { status: 403 },
        );
      }
    }

    const trimmed = content.trim();
    const kbTitle = title?.trim() || trimmed.slice(0, 40) + (trimmed.length > 40 ? '…' : '');

    const { data: kbItem, error: insertError } = await (supabase as any)
      .from('mcw_kb_items')
      .insert({
        chatbot_id: targetChatbotId,
        title: kbTitle,
        content: trimmed,
        source_type: 'text',
        char_count: trimmed.length,
        chunk_count: 0,
        is_embedded: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[KB TEXT] 삽입 실패:', insertError.message);
      return NextResponse.json({ success: false, error: 'KB 항목 저장에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, error: null, data: kbItem }, { status: 201 });
  } catch (err) {
    console.error('[KB TEXT] 예기치 않은 오류:', err);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
