/**
 * @task S12FE1
 * @description 페르소나 포털 /hub — 서버 컴포넌트 래퍼
 * Route: /hub
 *
 * 인증·데이터 fetch 는 project convention 에 따라 client 에서 수행
 * (Bearer 토큰이 localStorage 기반이므로 서버 RSC fetch 불가)
 */

import { Suspense } from 'react';
import HubClient from './page-client';

export default function HubPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-text-secondary text-sm">포털 불러오는 중...</p>
          </div>
        </div>
      }
    >
      <HubClient />
    </Suspense>
  );
}
