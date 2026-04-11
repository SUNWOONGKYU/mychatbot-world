/**
 * @task S4BA4
 * @description 챗봇 복제 API
 *
 * POST /api/bots/[id]/clone — 원본 봇을 복제하여 새 봇 생성
 *
 * - owner_id 소유권 확인
 * - 새 id(crypto.randomUUID) + 새 username(`{original}-copy-{timestamp}`) 생성
 * - bot_name을 "{원본} (복사본)"으로 설정
 * - owner_id 유지, 나머지 필드 복사
 * - insert 후 새 봇 데이터 반환
 *
 * 인증: Bearer 토큰 필수
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // ── 인증 ────────────────────────────────────────────────────
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

  // ── 원본 봇 조회 (소유권 확인) ──────────────────────────────
  const { data: original, error: getErr } = await supabase
    .from('mcw_bots')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();

  if (getErr || !original) {
    return NextResponse.json({ error: '봇을 찾을 수 없습니다.' }, { status: 404 });
  }

  // ── 복제 데이터 구성 ────────────────────────────────────────
  const newId = crypto.randomUUID();
  const timestamp = Date.now();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _origId, created_at: _c, updated_at: _u, ...rest } = original;

  const clone = {
    ...rest,
    id: newId,
    username: `${rest.username || 'bot'}-copy-${timestamp}`,
    bot_name: `${rest.bot_name || '봇'} (복사본)`,
  };

  // ── Insert ──────────────────────────────────────────────────
  const { data: cloned, error: insErr } = await supabase
    .from('mcw_bots')
    .insert(clone)
    .select()
    .single();

  if (insErr) {
    console.error('[POST /api/bots/[id]/clone] insert error:', insErr);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: cloned });
}
