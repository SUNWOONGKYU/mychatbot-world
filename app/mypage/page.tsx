/**
 * @task S4FE2
 * @description MyPage 서버 컴포넌트 래퍼
 * Route: /mypage
 */

import { Suspense } from 'react';
import MyPageClient from './page-client';

export default function MyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-text-secondary text-sm">불러오는 중...</p>
          </div>
        </div>
      }
    >
      <MyPageClient />
    </Suspense>
  );
}
