/**
 * @task S1SC1 (수정: 수동 로그인 플로우 정리)
 * @description 이메일 인증 링크 클릭 시 진입하는 콜백 라우트.
 *
 * 현재 프로젝트는 @supabase/ssr 쿠키 연동을 사용하지 않으므로
 * 서버에서 exchangeCodeForSession을 호출해도 브라우저 세션이 생성되지 않음.
 * → 수동 로그인 플로우로 통일하여 /login?confirmed=1 로 안내.
 * (OAuth 소셜 로그인은 Supabase 자체가 클라이언트 측에서 세션을 처리하므로 여기 도달 안 함)
 */
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/login?confirmed=1', request.url))
}
