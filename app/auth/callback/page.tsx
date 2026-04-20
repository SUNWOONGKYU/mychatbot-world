/**
 * @task S1SC1 (v2: 클라이언트 라우터 + provider 분기)
 * @description 인증 콜백 클라이언트 페이지
 *
 * 동일한 /auth/callback 이지만 두 가지 플로우를 수용:
 *   1) 이메일 인증 완료 (signup 확인 링크 클릭)
 *      → 자동 로그인 금지 (PO 정책: 수동 로그인 플로우) → signOut + /login?confirmed=1
 *   2) OAuth 로그인 (Google 등)
 *      → 자동 로그인 허용 → /home
 *
 * Supabase 브라우저 클라이언트의 detectSessionInUrl(기본 true) 가
 * URL의 PKCE code 를 교환해 localStorage 에 세션을 기록한다.
 * 교환 결과 세션의 app_metadata.provider 로 분기한다.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const url = new URL(window.location.href);
      const errorDescription =
        url.searchParams.get('error_description') ??
        new URLSearchParams(url.hash.replace(/^#/, '')).get('error_description');

      if (errorDescription) {
        setStatus('error');
        setErrMsg(decodeURIComponent(errorDescription));
        return;
      }

      function routeBySession(session: {
        user: { app_metadata?: unknown };
      }) {
        const provider =
          (session.user.app_metadata as { provider?: string } | undefined)?.provider ?? 'email';
        if (provider === 'email') {
          // 이메일 가입 경로 → 수동 로그인 정책: 세션 종료 후 /login
          supabase.auth.signOut().finally(() => {
            if (!cancelled) router.replace('/login?confirmed=1');
          });
        } else {
          if (!cancelled) router.replace('/home');
        }
      }

      // 1) 이미 세션이 있으면(= detectSessionInUrl 가 code/hash 를 이미 교환 완료) 즉시 분기
      const { data: first } = await supabase.auth.getSession();
      if (cancelled) return;
      if (first.session) {
        routeBySession(first.session);
        return;
      }

      // 2) 세션이 아직 없다면 detectSessionInUrl 가 교환 중일 수 있음.
      //    onAuthStateChange 로 SIGNED_IN 이벤트를 기다리며, 동시에 searchParams 의
      //    code 가 있으면 명시 교환을 병행 시도 (detectSessionInUrl 비활성 또는 타이밍 회피).
      let resolved = false;
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (cancelled || resolved) return;
        if (session) {
          resolved = true;
          sub.subscription.unsubscribe();
          routeBySession(session);
        }
      });

      const code = url.searchParams.get('code');
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (!resolved && (error || !data.session)) {
          // detectSessionInUrl 가 이미 소비한 경우 'code verifier' 류 에러가 날 수 있음 →
          // onAuthStateChange 타임아웃에서 최종 판정
          // eslint-disable-next-line no-console
          console.warn('[auth/callback] explicit exchange error (will wait for event)', error);
        } else if (!resolved && data.session) {
          resolved = true;
          sub.subscription.unsubscribe();
          routeBySession(data.session);
          return;
        }
      }

      // 3) 5 초 안에 세션이 확정되지 않으면:
      //    - code 도 없었고 hash 도 없었다 → 이메일 verify 단순 redirect (confirmed=1)
      //    - 뭔가 있었는데 실패 → 에러 UI
      const hadAuthPayload = Boolean(code) || url.hash.includes('access_token=');
      setTimeout(() => {
        if (cancelled || resolved) return;
        resolved = true;
        sub.subscription.unsubscribe();
        if (hadAuthPayload) {
          setStatus('error');
          setErrMsg('session not established within 5s');
        } else {
          router.replace('/login?confirmed=1');
        }
      }, 5000);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--surface-0)' }}
    >
      <div className="text-center">
        {status === 'processing' ? (
          <>
            <div
              className="mx-auto mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
              style={{ borderColor: 'var(--interactive-primary) transparent transparent transparent' }}
              aria-hidden="true"
            />
            <p className="text-sm text-text-secondary">인증 확인 중…</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium" style={{ color: 'var(--state-danger-fg)' }}>
              인증 처리에 문제가 발생했습니다.
            </p>
            <p className="mt-2 text-xs text-text-tertiary">{errMsg}</p>
            <button
              onClick={() => router.replace('/login')}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: 'var(--interactive-primary)' }}
            >
              로그인 페이지로 이동
            </button>
          </>
        )}
      </div>
    </main>
  );
}
