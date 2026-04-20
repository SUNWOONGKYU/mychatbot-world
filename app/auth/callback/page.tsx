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
      const code = url.searchParams.get('code');
      const errorDescription =
        url.searchParams.get('error_description') ??
        new URLSearchParams(url.hash.replace(/^#/, '')).get('error_description');
      const hashHasToken = url.hash.includes('access_token=');

      if (errorDescription) {
        setStatus('error');
        setErrMsg(decodeURIComponent(errorDescription));
        return;
      }

      // 1) detectSessionInUrl(기본 true) 가 이미 URL hash / code 를 세션으로 처리했을 수 있음.
      //    먼저 기존 세션을 조회해서 있으면 그것으로 분기.
      {
        const { data: first } = await supabase.auth.getSession();
        if (cancelled) return;
        if (first.session) {
          const provider =
            (first.session.user.app_metadata as { provider?: string } | undefined)?.provider ?? 'email';
          if (provider === 'email') {
            await supabase.auth.signOut();
            router.replace('/login?confirmed=1');
          } else {
            router.replace('/home');
          }
          return;
        }
      }

      // 2) code 가 있으면 PKCE 교환 시도
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error || !data.session) {
          // eslint-disable-next-line no-console
          console.error('[auth/callback] exchangeCodeForSession failed', error);
          setStatus('error');
          setErrMsg(error?.message ?? 'session=null');
          return;
        }
        const provider =
          (data.session.user.app_metadata as { provider?: string } | undefined)?.provider ?? 'email';
        if (provider === 'email') {
          await supabase.auth.signOut();
          router.replace('/login?confirmed=1');
        } else {
          router.replace('/home');
        }
        return;
      }

      // 3) hash 에 access_token 이 있으나 아직 세션이 안 잡힌 경우 — 이벤트 대기
      if (hashHasToken) {
        const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
          if (cancelled) return;
          if (session) {
            sub.subscription.unsubscribe();
            const provider =
              (session.user.app_metadata as { provider?: string } | undefined)?.provider ?? 'email';
            if (provider === 'email') {
              supabase.auth.signOut().finally(() => router.replace('/login?confirmed=1'));
            } else {
              router.replace('/home');
            }
          } else if (event === 'SIGNED_OUT') {
            sub.subscription.unsubscribe();
            setStatus('error');
            setErrMsg('hash token present but session not established');
          }
        });
        // 5초 안에 이벤트가 오지 않으면 에러 표시
        setTimeout(() => {
          if (cancelled) return;
          sub.subscription.unsubscribe();
          setStatus((s) => (s === 'processing' ? 'error' : s));
          setErrMsg((m) => m || 'onAuthStateChange timeout');
        }, 5000);
        return;
      }

      // 4) code 도 세션도 토큰도 없음 → 이메일 verify 단순 redirect 로 간주
      router.replace('/login?confirmed=1');
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
