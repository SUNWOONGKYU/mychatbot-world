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
      const errorDescription = url.searchParams.get('error_description');

      if (errorDescription) {
        setStatus('error');
        setErrMsg(decodeURIComponent(errorDescription));
        return;
      }

      // code 가 없는 경우(이메일 verify 후 Supabase 가 단순 redirect 만 할 때 포함)
      // → 이메일 인증 완료 안내로 로그인 유도
      if (!code) {
        router.replace('/login?confirmed=1');
        return;
      }

      // PKCE code 를 세션으로 명시 교환 (브라우저 자동 감지 타이밍 이슈 회피)
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;

      if (error || !data.session) {
        // 교환 실패: 대부분 이메일 인증 링크 재사용 / 만료 / code_verifier 없음
        // 진단을 위해 에러 메시지를 화면에 노출 (이후 안정화되면 silent redirect 로 복귀)
        // eslint-disable-next-line no-console
        console.error('[auth/callback] exchangeCodeForSession failed', error);
        setStatus('error');
        setErrMsg(error?.message ?? 'session=null');
        return;
      }

      const provider =
        (data.session.user.app_metadata as { provider?: string } | undefined)?.provider ?? 'email';

      if (provider === 'email') {
        // 이메일 가입 경로 → 수동 로그인 정책 유지: 세션 종료 후 /login
        await supabase.auth.signOut();
        router.replace('/login?confirmed=1');
      } else {
        // OAuth (google 등) → 자동 로그인 상태로 /home 진입
        router.replace('/home');
      }
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
