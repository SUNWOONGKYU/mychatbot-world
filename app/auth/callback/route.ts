/**
 * @task S1SC1
 * @description OAuth 콜백 라우트 핸들러 — @supabase/ssr로 쿠키 기반 세션 영속화
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/home'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options)
              } catch {
                // Server Component에서 set 호출 시 예외 — middleware가 쿠키 설정 담당
              }
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const errUrl = new URL('/login', request.url)
      errUrl.searchParams.set('error', 'auth_callback_failed')
      return NextResponse.redirect(errUrl)
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
