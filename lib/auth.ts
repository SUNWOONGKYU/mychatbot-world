/**
 * @task S1SC1
 * @description Supabase Auth utility functions
 * Social login (Google, Kakao) + session management
 *
 * NOTE: 싱글턴 사용으로 통일.
 * @supabase/ssr 의 createBrowserClient 는 code_verifier 등을 쿠키 기반으로 두고
 * 앱의 다른 부분이 쓰는 기본 createClient (localStorage 기반) 와 저장소가 달라
 * OAuth 콜백에서 PKCE 교환이 실패하는 문제가 있었음.
 */
import supabase from '@/lib/supabase'

/**
 * Sign in with Google OAuth
 * Redirects to Google consent screen, then back to /auth/callback
 */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Google sign-in error:', error.message)
    throw error
  }
}

/**
 * Sign in with Kakao OAuth
 * Redirects to Kakao login screen, then back to /auth/callback
 */
export async function signInWithKakao(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Kakao sign-in error:', error.message)
    throw error
  }
}

/**
 * Sign in with email and password
 * Returns data on success; throws on error.
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    console.error('Email sign-in error:', error.message)
    throw error
  }

  return data
}

/**
 * Sign out the current user
 * Clears the session from local storage and Supabase
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign-out error:', error.message)
    throw error
  }
}

/**
 * Get the current session
 * Returns null if no active session exists
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Get session error:', error.message)
    return null
  }

  return data.session
}

/**
 * Get the currently authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Get user error:', error.message)
    return null
  }

  return data.user
}
