/**
 * @task S1SC1
 * @description OAuth callback route handler
 * Exchanges the OAuth authorization code for a Supabase session,
 * then redirects the user to the dashboard.
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange the OAuth code for a session
    // This sets the session cookie automatically
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth callback error:', error.message)
      // Redirect to login with an error indicator
      return NextResponse.redirect(new URL('/login?error=auth_callback_failed', requestUrl.origin))
    }
  }

  // Successfully authenticated — redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
