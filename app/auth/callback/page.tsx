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
      const tokenType = hashParams.get('type'); // signup | invite | magiclink | recovery | null
      const code = url.searchParams.get('code');

      // (A) Implicit flow — hash 에 access_token 이 있는 경로.
      //     `type` 파라미터로 이메일 인증 vs OAuth 를 구분한다.
      //     - type=signup|invite|magiclink → 이메일 기반 → 수동 로그인 정책 (setSession 하지 않음)
      //     - type=recovery → 비밀번호 재설정 → /reset-password 에서 처리
      //     - type 없음 → OAuth (Google 등) → 자동 로그인 → /home
      //     email 가입 사용자가 Google 로 로그인 시 app_metadata.provider 가 'email' 로
      //     남아있을 수 있으므로 provider 필드 대신 `type` 부재를 OAuth 판정 근거로 사용.
      if (accessToken && refreshToken) {
        // 이메일 회원가입/초대/매직링크 → 수동 로그인 강제
        if (tokenType === 'signup' || tokenType === 'invite' || tokenType === 'magiclink') {
          // 인증은 이미 서버측에서 완료됨. 클라이언트 세션은 수립하지 않고 로그인 페이지로.
          if (!cancelled) router.replace('/login?confirmed=1');
          return;
        }

        // 비밀번호 재설정 — /reset-password 가 세션을 필요로 하므로 setSession 후 이동
        if (tokenType === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (cancelled) return;
          if (error) {
            setStatus('error');
            setErrMsg(error.message);
            return;
          }
          // ?flow=recovery 플래그를 붙여 /reset-password가 명시적으로
          // '새 비밀번호 입력' 모드로 진입하도록 한다. (일반 로그인 상태의
          // 사용자가 우연히 /reset-password 로 오는 경우와 구분)
          if (!cancelled) router.replace('/reset-password?flow=recovery');
          return;
        }

        // type 없음 → OAuth → 자동 로그인
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
        if (!cancelled) router.replace('/mypage');
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
          if (!cancelled) router.replace('/mypage');
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
