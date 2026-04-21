/**
 * @task S7FE5 - P0 첫인상 페이지 리디자인
 * @description Login page — server component Suspense wrapper
 *
 * useSearchParams()는 Suspense boundary 안쪽 LoginClient에서만 호출한다.
 * Next.js 14 App Router: useSearchParams without Suspense boundary causes
 * build warning and potential hydration mismatch.
 */

import { Suspense } from 'react'
import LoginClient from './page-client'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    }>
      <LoginClient />
    </Suspense>
  )
}
