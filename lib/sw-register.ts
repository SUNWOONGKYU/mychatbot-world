/**
 * @task S4DV1 - Service Worker 등록 유틸리티
 *
 * 사용법: app/layout.tsx에서 <ServiceWorkerRegistration /> 컴포넌트 렌더링
 * 개발 환경(NODE_ENV !== 'production')에서는 자동으로 비활성화
 */

'use client';

import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    // 개발 환경에서는 SW 등록 안 함
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if (!('serviceWorker' in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // 새 버전 설치됨 — 필요 시 사용자에게 알림
              console.info('[SW] 새 버전이 설치되었습니다. 페이지를 새로고침하세요.');
            }
          });
        });
      } catch (error) {
        console.error('[SW] Service Worker 등록 실패:', error);
      }
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, []);
}

/**
 * Service Worker 등록 컴포넌트
 * app/layout.tsx의 <body> 안에 추가하면 됩니다.
 *
 * @example
 * import { ServiceWorkerRegistration } from '@/lib/sw-register';
 * // ... layout.tsx body에 추가:
 * <ServiceWorkerRegistration />
 */
export function ServiceWorkerRegistration() {
  useServiceWorker();
  return null;
}
