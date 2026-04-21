/**
 * @task S7SC2
 * @description 이메일 링크 진입점 — token_hash 기반 verifyOtp 호출
 *
 * 배경: 이메일 프로바이더(Daum/Hanmail 등)의 안티피싱 스캐너가 {{ .ConfirmationURL }}
 *       링크를 사용자보다 먼저 GET하면서 1회용 verify 토큰이 소진되어
 *       사용자가 실제 클릭 시 `otp_expired`로 튕기는 현상이 발생.
 *
 * 대응: 이메일 템플릿을 {{ .TokenHash }} 기반으로 변경하여 이 페이지로 유도한 뒤,
 *       클라이언트 JS에서 `supabase.auth.verifyOtp({ token_hash, type })`를 호출.
 *       스캐너는 JS를 실행하지 않으므로 GET만으로는 토큰이 소진되지 않음.
 *
 * 지원 type: recovery (비밀번호 재설정) — 필요 시 signup/invite/magiclink도 확장 가능
 */
'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import supabase from '@/lib/supabase';

type EmailOtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';

function ConfirmInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errMsg, setErrMsg] = useState('');
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;

    const sp = searchParams ?? new URLSearchParams();
    const tokenHash = sp.get('token_hash');
    const type = (sp.get('type') || 'recovery') as EmailOtpType;
    const next = sp.get('next') || '/reset-password?flow=recovery';

    // 하단 폴백: 구 링크(#error=...) 대응
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
    const errorCode = sp.get('error_code') ?? hashParams.get('error_code');
    const errorDescription =
      sp.get('error_description') ?? hashParams.get('error_description');

    if (errorCode || errorDescription) {
      setStatus('error');
      setErrMsg(decodeURIComponent(errorDescription || errorCode || '링크 오류'));
      return;
    }

    if (!tokenHash) {
      setStatus('error');
      setErrMsg('유효하지 않은 링크입니다. 다시 요청해 주세요.');
      return;
    }

    (async () => {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) {
        setStatus('error');
        setErrMsg(
          /expired|invalid/i.test(error.message)
            ? '재설정 링크가 만료되었거나 이미 사용되었습니다. 이메일을 다시 요청해 주세요.'
            : error.message
        );
        return;
      }
      // 세션 수립됨 → 다음 경로로 이동 (hash/쿼리 정리)
      router.replace(next);
    })();
  }, [router, searchParams]);

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
            <p className="text-sm text-text-secondary">링크 확인 중…</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium" style={{ color: 'var(--state-danger-fg)' }}>
              인증 처리에 문제가 발생했습니다.
            </p>
            <p className="mt-2 text-xs text-text-tertiary">{errMsg}</p>
            <button
              onClick={() => router.replace('/reset-password')}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: 'var(--interactive-primary)' }}
            >
              비밀번호 재설정 다시 요청
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmInner />
    </Suspense>
  );
}
