// @task S1BI1 - Next.js 프로젝트 초기화 + Tailwind CSS 설정
// Supabase 클라이언트 초기화 placeholder
// S1DB1 (데이터베이스 설계) 완료 후 실제 구현 예정

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// TODO: S1DB1에서 Database 타입 생성 후 제네릭 추가
// import type { Database } from '@/types/supabase';
// export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// detectSessionInUrl 을 끈다: /auth/callback 클라이언트 페이지에서 hash/code 를
// 단독으로 처리하기 위함. 자동 감지와 수동 처리가 경합하면 setSession 이
// "Auth session missing!" 으로 실패하는 증상이 재현되었다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Re-export createClient for files that need custom instances
export { createClient } from '@supabase/supabase-js';

export default supabase;
