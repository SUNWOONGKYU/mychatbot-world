/**
 * @task S5FE6 — 코코봇 삭제 path param route
 * @task S10BA4 — 코코봇 설정 부분 업데이트(PATCH)
 * DELETE /api/bots/{id}
 * PATCH  /api/bots/{id}  (tone, persona_traits, learning_sources, model 등 whitelist)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// S10BA4: PATCH 허용 필드 whitelist
const PATCHABLE_FIELDS = new Set([
  'bot_name',
  'bot_desc',
  'emoji',
  'greeting',
  'tone',
  'persona_traits',
  'learning_sources',
  'model',
  'category',
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const token = authHeader.slice(7).trim();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body ?? {})) {
    if (PATCHABLE_FIELDS.has(k)) payload[k] = v;
  }
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: '업데이트할 허용 필드가 없습니다.' }, { status: 400 });
  }
  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('mcw_bots')
    .update(payload)
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: '코코봇을 찾을 수 없습니다.' }, { status: 404 });
  }
  return NextResponse.json({ bot: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
  }

  // 소유권 확인 후 삭제
  const { error: delError } = await supabase
    .from('mcw_bots')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
