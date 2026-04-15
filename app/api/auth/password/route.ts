/**
 * @task H2 — 비밀번호 변경 API
 * PATCH /api/auth/password — 현재 비밀번호 검증 후 새 비밀번호로 변경
 * Rate Limiting: 시간당 10회 (브루트포스 방지)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RATE_PASSWORD } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(req: NextRequest) {
  // Rate Limiting: 시간당 10회 — 브루트포스 방지
  const rl = rateLimit(req, RATE_PASSWORD, 'auth:password');
  if (!rl.allowed) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const token = authHeader.slice(7);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user || !user.email) return NextResponse.json({ error: '유효하지 않은 토큰' }, { status: 401 });

  const { current_password, new_password } = await req.json();
  if (!current_password || !new_password) {
    return NextResponse.json({ error: '현재 비밀번호와 새 비밀번호를 입력하세요.' }, { status: 400 });
  }
  if (new_password.length < 8) {
    return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
  }

  // 현재 비밀번호 검증 (anon 클라이언트로 signIn 시도)
  const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { error: signInError } = await anonClient.auth.signInWithPassword({
    email: user.email,
    password: current_password,
  });
  if (signInError) {
    return NextResponse.json({ error: '현재 비밀번호가 일치하지 않습니다.' }, { status: 401 });
  }

  // 새 비밀번호로 변경
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: new_password,
  });
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
