/**
 * @task S4SC4
 * @description 관리자 권한 미들웨어
 *
 * 인증 우선순위:
 *  1. Bearer 토큰 → Supabase JWT 검증 → profiles.is_admin = true 확인
 *  2. X-Admin-Key 헤더 (ADMIN_API_KEY 환경변수) — 레거시 폴백
 *
 * 하드코딩된 이메일 목록 제거 (2026-04-12 보안 강화)
 */
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** X-Admin-Key 헤더 검증 (레거시 폴백) */
export function verifyAdminKey(req: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return false;
  const provided = req.headers.get('X-Admin-Key');
  if (!provided) return false;
  // 타이밍 어택 방지: 길이가 다르면 즉시 false
  if (provided.length !== adminKey.length) return false;
  return provided === adminKey;
}

/**
 * Bearer 토큰 검증 + profiles.is_admin DB 확인
 * 이메일 화이트리스트 방식 제거 — DB의 is_admin 컬럼 기준
 */
export async function verifyAdminUser(
  req: NextRequest
): Promise<{ isAdmin: boolean; userId?: string; email?: string; error?: string }> {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return { isAdmin: false, error: 'No token' };

  const supabase = getAdminSupabase();

  // JWT 검증
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return { isAdmin: false, error: 'Invalid token' };
  }

  const userId = userData.user.id;
  const email = userData.user.email ?? '';

  // profiles.is_admin 확인 (DB 기준 — 이메일 하드코딩 제거)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return { isAdmin: false, userId, email, error: 'Profile not found' };
  }

  return { isAdmin: profile.is_admin === true, userId, email };
}

/**
 * 통합 관리자 검증
 * 1순위: Bearer JWT + profiles.is_admin
 * 2순위: X-Admin-Key (레거시, 단계적 제거 예정)
 */
export async function requireAdmin(
  req: NextRequest
): Promise<{ authorized: boolean; userId?: string; email?: string; error?: string }> {
  // 1순위: JWT 기반 관리자 확인
  const authHeader = req.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const result = await verifyAdminUser(req);
    if (result.isAdmin) {
      return { authorized: true, userId: result.userId, email: result.email };
    }
    // 토큰이 있지만 관리자가 아닌 경우 즉시 거부 (X-Admin-Key 폴백 건너뜀)
    if (result.error !== 'No token') {
      return { authorized: false, error: result.error || 'Not an admin' };
    }
  }

  // 2순위: X-Admin-Key (Bearer 토큰이 없는 경우만)
  if (verifyAdminKey(req)) {
    return { authorized: true, userId: 'system', email: 'admin-key' };
  }

  return { authorized: false, error: 'Unauthorized' };
}
