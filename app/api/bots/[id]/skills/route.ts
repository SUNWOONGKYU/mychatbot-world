/**
 * @task S10BA2
 * @description GET/POST/DELETE /api/bots/[id]/skills — 봇 장착 스킬 CRUD
 * GET: mcw_bot_skills 목록
 * POST: { skill_id, config? } upsert (bot_id+skill_id UNIQUE)
 * DELETE: ?skill_id= 지정 해제
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { safeError } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return null;
  const { data: { user } } = await getSupabase().auth.getUser(token);
  return user ?? null;
}

async function assertBotOwner(botId: string, userId: string) {
  const supabase = getSupabase();
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
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  if (!(await assertBotOwner(botId, user.id))) {
    return NextResponse.json({ error: '코코봇을 찾을 수 없습니다.' }, { status: 404 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('mcw_bot_skills')
    .select('id, skill_id, config, mounted_at')
    .eq('bot_id', botId)
    .order('mounted_at', { ascending: false });

  if (error) {
    console.error('[bot-skills][GET]', error.message);
    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }
  return NextResponse.json({ skills: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: botId } = await params;
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  if (!(await assertBotOwner(botId, user.id))) {
    return NextResponse.json({ error: '코코봇을 찾을 수 없습니다.' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const skillId = typeof body.skill_id === 'string' ? body.skill_id.trim() : '';
  const config = body.config && typeof body.config === 'object' ? body.config : {};
  if (!skillId) {
    return NextResponse.json({ error: 'skill_id is required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('mcw_bot_skills')
    .upsert(
      { bot_id: botId, skill_id: skillId, config },
      { onConflict: 'bot_id,skill_id' },
    )
    .select('id, skill_id, config, mounted_at')
    .single();

  if (error) {
    console.error('[bot-skills][POST]', error.message);
    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }
  return NextResponse.json({ skill: data }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: botId } = await params;
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  if (!(await assertBotOwner(botId, user.id))) {
    return NextResponse.json({ error: '코코봇을 찾을 수 없습니다.' }, { status: 404 });
  }

  const url = new URL(req.url);
  const skillId = url.searchParams.get('skill_id');
  if (!skillId) {
    return NextResponse.json({ error: 'skill_id query param is required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('mcw_bot_skills')
    .delete()
    .eq('bot_id', botId)
    .eq('skill_id', skillId)
    .select('id');

  if (error) {
    console.error('[bot-skills][DELETE]', error.message);
    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }
  return NextResponse.json({ success: true, deleted: data?.length ?? 0 });
}
