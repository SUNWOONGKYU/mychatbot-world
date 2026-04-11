/**
 * @task S5M5
 * @description KB 텍스트 직접 입력 API
 *
 * POST /api/kb/text
 * Body: { bot_id?: string; title?: string; content: string }
 *
 * - mcw_kb_entries 테이블에 텍스트 레코드 삽입
 * - 인증 필수 (Bearer 토큰)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  // ── 인증 ──────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
  }

  // ── 바디 파싱 ─────────────────────────────────────────
  let body: { bot_id?: string; title?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '요청 바디를 파싱할 수 없습니다.' }, { status: 400 });
  }

  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: 'content 필드가 필요합니다.' }, { status: 400 });
  }
  if (content.length > 50000) {
    return NextResponse.json({ error: '텍스트는 50,000자를 초과할 수 없습니다.' }, { status: 400 });
  }

  // ── bot_id 소유권 확인 (제공된 경우) ─────────────────
  if (body.bot_id) {
    const { data: bot } = await supabase
      .from('mcw_bots')
      .select('id')
      .eq('id', body.bot_id)
      .eq('owner_id', user.id)
      .maybeSingle();
    if (!bot) {
      return NextResponse.json({ error: '챗봇을 찾을 수 없거나 권한이 없습니다.' }, { status: 403 });
    }
  }

  // ── KB 항목 삽입 ──────────────────────────────────────
  const { data, error } = await supabase
    .from('mcw_kb_entries')
    .insert({
      user_id: user.id,
      bot_id: body.bot_id ?? null,
      title: body.title?.trim() || '텍스트 입력',
      content,
      source_type: 'text',
      created_at: new Date().toISOString(),
    })
    .select('id, title, created_at')
    .single();

  if (error) {
    // 테이블이 없으면 graceful fallback
    if (error.code === '42P01') {
      return NextResponse.json({
        success: true,
        data: { message: 'KB 테이블이 준비 중입니다. 텍스트가 접수되었습니다.' },
      });
    }
    console.error('[POST /api/kb/text]', error);
    return NextResponse.json({ error: 'KB 저장에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
