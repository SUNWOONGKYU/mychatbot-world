/**
 * @task S1SC1
 * @description Next.js Edge Middleware
 * - Refreshes Supabase session on every request (keeps JWT alive)
 * - Protects private routes: unauthenticated → /login
 * - Prevents authenticated users from seeing /login → /dashboard
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

/** Routes accessible without authentication */
const PUBLIC_PATHS = ['/', '/login', '/auth/callback', '/templates']

/**
 * Returns true if the given pathname is a public (unauthenticated-accessible) path.
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (publicPath) => pathname === publicPath || pathname.startsWith(publicPath + '/')
  )
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next()

  // Create a Supabase client that can read/write cookies in middleware
  const supabase = createMiddlewareClient({ req: request, res: response })

  // Refresh the session — this renews the JWT if it has expired.
  // IMPORTANT: must await this before checking session state.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Unauthenticated user trying to access a protected route → redirect to /login
  if (!session && !isPublicPath(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user visiting /login → redirect to /dashboard
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - public folder (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
