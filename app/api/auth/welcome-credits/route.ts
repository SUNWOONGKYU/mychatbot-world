/**
 * POST /api/auth/welcome-credits
 * 신규 가입 직후 세션이 즉시 생성된 경우 환영 크레딧 지급
 * (이메일 인증 비활성화 환경 또는 즉시 세션 발급 시)
 *
 * 인증: Authorization: Bearer <access_token>
 * 중복 지급 방지: mcw_credits 행 INSERT — 이미 있으면 스킵
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { grantWelcomeCredits } from '@/lib/chat/credits';

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key) as any;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const granted = await grantWelcomeCredits(data.user.id);
  return NextResponse.json({ granted });
}
