/**
 * @task S1SC1
 * @description Supabase Auth utility functions
 * Social login (Google, Kakao) + session management
 */

import { createBrowserClient } from '@supabase/ssr'

// Create a Supabase client for use in Client Components
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
