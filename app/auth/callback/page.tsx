/**
 * @task S1SC1 (v3)
 * @description 인증 콜백 — 두 가지 플로우 수용
 *   1) 이메일 인증 완료: URL 이 비어있거나 error_description → /login?confirmed=1
 *   2) OAuth 로그인 (implicit flow): URL hash 의 access_token/refresh_token 으로
 *      setSession 명시 호출. 기존 세션(이전 이메일 로그인)이 남아있을 경우 덮어씀.
 *
 * 왜 implicit 인가: lib/supabase.ts 의 createClient 가 옵션 없이 생성되어
 * 기본 flowType 이 implicit. OAuth 응답은 #access_token=... 해시 형태로 도착.
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
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
      const errorDescription =
        url.searchParams.get('error_description') ?? hashParams.get('error_description');

      if (errorDescription) {
        setStatus('error');
        setErrMsg(decodeURIComponent(errorDescription));
        return;
      }

      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const code = url.searchParams.get('code');

      // (A) Implicit flow — hash 에 access_token 이 있으면 정의상 OAuth 경로.
      //     email 가입 사용자가 나중에 Google 로 로그인하는 경우 Supabase 가 계정을
      //     링크하면서도 app_metadata.provider 를 'email' 로 유지하기도 하므로
      //     provider 필드로 판정하지 않고 경로 자체(hash 도달)로 OAuth 판정.
      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (cancelled) return;
        if (error || !data.session) {
          setStatus('error');
          setErrMsg(error?.message ?? 'setSession returned null');
          return;
        }
        if (!cancelled) router.replace('/home');
        return;
      }

      // (B) PKCE flow — ?code= 가 있으면 명시 교환
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error || !data.session) {
          setStatus('error');
          setErrMsg(error?.message ?? 'exchange returned null');
          return;
        }
        const provider =
          (data.session.user.app_metadata as { provider?: string } | undefined)?.provider ?? 'unknown';
        if (provider === 'email') {
          await supabase.auth.signOut();
          if (!cancelled) router.replace('/login?confirmed=1');
        } else {
          if (!cancelled) router.replace('/home');
        }
        return;
      }

      // (C) 아무 페이로드 없음 — 이메일 인증 완료 후 단순 redirect 로 간주
      //     (혹시 로그인 상태였다면 수동 로그인 정책상 signOut)
      const { data: existing } = await supabase.auth.getSession();
      if (cancelled) return;
      if (existing.session) {
        await supabase.auth.signOut();
      }
      if (!cancelled) router.replace('/login?confirmed=1');
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
