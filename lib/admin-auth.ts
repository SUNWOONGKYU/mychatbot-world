/**
 * @task S4SC4
 * @description 관리자 권한 미들웨어 — X-Admin-Key 헤더 또는 Bearer 토큰으로 관리자 확인
 */
import { createClient } from '@supabase/supabase-js';

// 관리자 이메일 목록 (환경변수 또는 하드코딩)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'wksn@gmail.com').split(',').map(e => e.trim());

export function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// X-Admin-Key 헤더 검증
export function verifyAdminKey(req: Request): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return false;
  return req.headers.get('X-Admin-Key') === adminKey;
}

// Bearer 토큰으로 관리자 여부 확인
export async function verifyAdminUser(req: Request): Promise<{ isAdmin: boolean; userId?: string; email?: string; error?: string }> {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return { isAdmin: false, error: 'No token' };

  const supabase = getAdminSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { isAdmin: false, error: 'Invalid token' };

  const email = data.user.email || '';
  const isAdmin = ADMIN_EMAILS.includes(email);

  return { isAdmin, userId: data.user.id, email };
}

// 통합 검증: Admin-Key 또는 Bearer 토큰 중 하나로 관리자 확인
export async function requireAdmin(req: Request): Promise<{ authorized: boolean; userId?: string; email?: string; error?: string }> {
  // 방법 1: X-Admin-Key 헤더
  if (verifyAdminKey(req)) {
    return { authorized: true, userId: 'admin-key', email: 'system' };
  }

  // 방법 2: Bearer 토큰 + 관리자 이메일
  const result = await verifyAdminUser(req);
  if (result.isAdmin) {
    return { authorized: true, userId: result.userId, email: result.email };
  }

  return { authorized: false, error: result.error || 'Not an admin' };
}
