/**
 * @task S3BA4
 * @description Supabase 서버 사이드 클라이언트 팩토리
 * - Next.js App Router Route Handler / Server Component 전용
 * - 환경변수 기반, 하드코딩 없음
 * - NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (서버 전용)
 *   또는 NEXT_PUBLIC_SUPABASE_ANON_KEY (공개)
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[S3BA4] Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

/**
 * Route Handler 용 Supabase 클라이언트 생성
 * - Auth 세션을 쿠키/헤더에서 자동 인식하려면
 *   @supabase/ssr 패키지의 createServerClient를 사용하는 것이 권장되나,
 *   이 프로젝트는 Anon Key 기반 RLS 방식을 사용
 * - 매 요청마다 새 인스턴스 생성 (Edge Runtime 호환)
 */
export function createClient() {
  return createSupabaseClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      // Edge Runtime: 쿠키 기반 세션 대신 Authorization 헤더 방식 사용
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
