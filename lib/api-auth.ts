/**
 * @task S5BA2
 * @description API 인증 패턴 표준화 — 공통 인증 래퍼 함수
 *
 * 사용법:
 *   // 일반 사용자 인증 필요
 *   const { userId, supabase } = await requireAuth(req);
 *
 *   // 관리자 인증 필요
 *   await requireAdminAuth(req);
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/** 인증된 요청 컨텍스트 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AuthContext {
  userId: string;
  email: string | null;
  // createClient with service key returns an untyped client — use any to avoid generic mismatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
}

/**
 * 프로덕션 환경에서 오류 메시지 노출 방지
 * dev: 원본 메시지 반환 (디버깅용)
 * production: 'Internal server error' 반환 (정보 노출 차단)
 */
export function safeError(err: unknown): string {
  if (process.env.NODE_ENV === 'production') return 'Internal server error';
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

/** 401 Unauthorized 응답 */
export function unauthorized(message = 'Authentication required') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/** 403 Forbidden 응답 */
export function forbidden(message = 'Insufficient permissions') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * 일반 사용자 인증 검증
 * Bearer 토큰에서 Supabase 세션을 검증하고 AuthContext를 반환.
 * 실패 시 null 반환 — 호출 측에서 unauthorized() 반환 처리.
 */
export async function verifyAuth(req: Request): Promise<AuthContext | null> {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  // 쿠키 기반 세션도 지원 (Next.js 서버 컴포넌트 패턴)
  if (!token) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('[api-auth] Missing Supabase credentials');
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    supabase,
  };
}

/**
 * 인증 필수 API 핸들러 래퍼
 * 인증 실패 시 자동으로 401 반환.
 *
 * @example
 * export const POST = withAuth(async (req, ctx) => {
 *   const { userId } = ctx;
 *   // ...
 * });
 */
export function withAuth(
  handler: (req: Request, ctx: AuthContext) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const ctx = await verifyAuth(req);
    if (!ctx) return unauthorized();
    return handler(req, ctx);
  };
}

/**
 * 관리자 인증 필수 API 핸들러 래퍼
 * 인증 실패 시 401, 관리자 아닌 경우 403 반환.
 *
 * @example
 * export const DELETE = withAdminAuth(async (req, ctx) => {
 *   // 관리자만 접근 가능
 * });
 */
export function withAdminAuth(
  handler: (req: Request, ctx: AuthContext & { isApiKey?: boolean }) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    // 방법 1: X-Admin-Key 헤더 (서비스 간 통신)
    const adminKey = process.env.ADMIN_API_KEY;
    if (adminKey) {
      const reqKey = req.headers.get('X-Admin-Key') || '';
      if (reqKey && reqKey === adminKey) {
        // API 키 인증 — 더미 컨텍스트
        const dummyCtx: AuthContext & { isApiKey: boolean } = {
          userId: 'api-key',
          email: 'system',
          isApiKey: true,
          supabase: createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
          ),
        };
        return handler(req, dummyCtx);
      }
    }

    // 방법 2: Bearer 토큰 + 관리자 이메일 확인
    const ctx = await verifyAuth(req);
    if (!ctx) return unauthorized();

    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);

    if (!ctx.email || !adminEmails.includes(ctx.email)) {
      return forbidden();
    }

    return handler(req, ctx);
  };
}
