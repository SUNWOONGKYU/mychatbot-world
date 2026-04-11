/**
 * @task S3BA4
 * @description 스킬 제거 API
 *
 * DELETE /api/skills/[id]/uninstall
 *
 * - skill_installations 테이블에서 skill_id + user_id 조합 레코드 삭제
 *
 * 인증: Bearer 토큰 필수
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  // ── skill_installations 삭제 ────────────────────────────────
  const { error } = await supabase
    .from('skill_installations')
    .delete()
    .eq('skill_id', skillId)
    .eq('user_id', user.id);

  if (error) {
    console.error('[DELETE /api/skills/[id]/uninstall] delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { skill_id: skillId } });
}
