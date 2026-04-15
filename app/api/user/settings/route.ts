/**
 * @task US1
 * @description 사용자 설정 저장/조회 API
 *
 * GET /api/user/settings?key={key}
 * POST /api/user/settings  { key, value }
 *
 * 테이블: mcw_user_settings (user_id, key, value JSONB)
 * 테이블 없으면 200 빈 값 반환 (graceful fallback)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function authenticate(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '').trim();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user } } = await supabase.auth.getUser(token);
  return user ? { user, supabase } : null;
}

export async function GET(req: NextRequest) {
  const ctx = await authenticate(req);
  if (!ctx) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const key = new URL(req.url).searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'key 파라미터가 필요합니다.' }, { status: 400 });

  const { data, error } = await ctx.supabase
    .from('mcw_user_settings')
    .select('value')
    .eq('user_id', ctx.user.id)
    .eq('key', key)
    .maybeSingle();

  if (error) {
    // 테이블 없으면 빈 값 반환
    return NextResponse.json({ value: null });
  }

  return NextResponse.json({ value: data?.value ?? null });
}

export async function POST(req: NextRequest) {
  const ctx = await authenticate(req);
  if (!ctx) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  let body: { key?: string; value?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { key, value } = body;
  if (!key) return NextResponse.json({ error: 'key가 필요합니다.' }, { status: 400 });

  const { error } = await ctx.supabase
    .from('mcw_user_settings')
    .upsert(
      { user_id: ctx.user.id, key, value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,key' }
    );

  if (error) {
    // 테이블 없으면 무시하고 성공 반환 (localStorage fallback이 있음)
    return NextResponse.json({ ok: true, fallback: true });
  }

  return NextResponse.json({ ok: true });
}
