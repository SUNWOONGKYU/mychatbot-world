/**
 * @task S3BA3
 * @description 스킬 활성/비활성 토글 API
 *
 * PATCH /api/skills/[id]/toggle
 * body: { active: boolean }
 *
 * - skill_installations 테이블에서 skill_id + user_id 조합의
 *   status를 'active' 또는 'inactive'로 업데이트
 *
 * 인증: Bearer 토큰 필수
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: skillId } = await params;

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

  // ── 바디 파싱 ────────────────────────────────────────────────
  let body: { active: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '요청 바디를 파싱할 수 없습니다.' }, { status: 400 });
  }

  if (typeof body.active !== 'boolean') {
    return NextResponse.json({ error: 'active(boolean) 필드가 필요합니다.' }, { status: 400 });
  }

  const newStatus = body.active ? 'active' : 'inactive';

  // ── skill_installations 업데이트 ────────────────────────────
  const { data, error } = await supabase
    .from('skill_installations')
    .update({ status: newStatus })
    .eq('skill_id', skillId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[PATCH /api/skills/[id]/toggle] update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: '설치된 스킬을 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: { skill_id: skillId, status: newStatus },
  });
}
