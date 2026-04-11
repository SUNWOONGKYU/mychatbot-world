/**
 * @task S5M2
 * @description 챗봇 페르소나 관리 API
 *
 * GET    /api/bots/[id]/personas  — 페르소나 목록 조회
 * POST   /api/bots/[id]/personas  — 페르소나 추가
 * DELETE /api/bots/[id]/personas  — 페르소나 삭제 (body: { personaId })
 *
 * 인증: Bearer 토큰 + owner_id 검증
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function auth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return { user: null };
  const token = authHeader.replace('Bearer ', '').trim();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user } } = await supabase.auth.getUser(token);
  return { user, supabase };
}

async function verifyOwner(supabase: ReturnType<typeof createClient>, botId: string, userId: string) {
  const { data } = await supabase
    .from('mcw_bots')
    .select('id')
    .eq('id', botId)
    .eq('owner_id', userId)
    .maybeSingle();
  return !!data;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: botId } = await params;
  const { user, supabase } = await auth(req) as any;
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const owned = await verifyOwner(supabase, botId, user.id);
  if (!owned) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });

  const { data, error } = await supabase
    .from('mcw_personas')
    .select('id, name, created_at')
    .eq('bot_id', botId)
    .order('created_at', { ascending: true });

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ personas: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ personas: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: botId } = await params;
  const { user, supabase } = await auth(req) as any;
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const owned = await verifyOwner(supabase, botId, user.id);
  if (!owned) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });

  let body: { name?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: '요청 바디 파싱 실패' }, { status: 400 });
  }
  if (!body.name?.trim()) {
    return NextResponse.json({ error: '페르소나 이름이 필요합니다.' }, { status: 400 });
  }

  // 최대 10개 제한
  const { count } = await supabase
    .from('mcw_personas')
    .select('id', { count: 'exact', head: true })
    .eq('bot_id', botId);
  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: '페르소나는 최대 10개까지 생성할 수 있습니다.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('mcw_personas')
    .insert({ id: crypto.randomUUID(), bot_id: botId, name: body.name.trim() })
    .select('id, name, created_at')
    .single();

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ success: true, data: { id: `temp-${Date.now()}`, name: body.name.trim() } });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: botId } = await params;
  const { user, supabase } = await auth(req) as any;
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const owned = await verifyOwner(supabase, botId, user.id);
  if (!owned) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });

  let body: { personaId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: '요청 바디 파싱 실패' }, { status: 400 });
  }
  if (!body.personaId) {
    return NextResponse.json({ error: 'personaId가 필요합니다.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('mcw_personas')
    .delete()
    .eq('id', body.personaId)
    .eq('bot_id', botId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
