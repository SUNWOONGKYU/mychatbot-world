/**
 * @task S5BA4
 * @description 계정 삭제 UI 컴포넌트 (마이페이지 > 계정 보안)
 */
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export function DeleteAccountSection() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (confirmPhrase !== '계정삭제') {
      setError('확인 문구가 올바르지 않습니다. "계정삭제"를 정확히 입력해 주세요.');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ password, confirmPhrase }),
      });

      if (res.status === 204) {
        await supabase.auth.signOut();
        router.replace('/?deleted=1');
        return;
      }

      const data = await res.json().catch(() => ({}));
      setError(data.error ?? '계정 삭제 중 오류가 발생했습니다.');
    } catch {
      setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section aria-labelledby="delete-account-heading" className="mt-8">
      <h2 id="delete-account-heading" className="text-base font-semibold text-error mb-1">
        위험 구역
      </h2>
      <p className="text-sm text-text-secondary mb-4">
        계정을 삭제하면 모든 코코봇, 대화 내역, 크레딧이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
      </p>

      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-error text-error
            hover:bg-error/10 transition-colors focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-error focus-visible:ring-offset-2"
        >
          계정 삭제
        </button>
      ) : (
        <div
          className="rounded-xl border border-error/40 bg-error/5 p-5"
          role="dialog"
          aria-modal="false"
          aria-labelledby="delete-confirm-heading"
        >
          <h3 id="delete-confirm-heading" className="text-sm font-semibold text-error mb-3">
            계정 삭제 확인
          </h3>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-error/10 border border-error/20 text-sm text-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleDelete} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="delete-password" className="text-sm text-text-secondary">
                비밀번호 확인
              </label>
              <input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="현재 비밀번호 입력"
                autoComplete="current-password"
                className="w-full px-3 py-2 rounded-lg text-sm bg-bg-subtle border border-border-default
                  text-text-primary focus:outline-none focus:ring-2 focus:ring-error focus:border-error"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="delete-confirm" className="text-sm text-text-secondary">
                확인 문구 입력: <strong className="text-text-primary">계정삭제</strong>
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder='계정삭제'
                autoComplete="off"
                className="w-full px-3 py-2 rounded-lg text-sm bg-bg-subtle border border-border-default
                  text-text-primary focus:outline-none focus:ring-2 focus:ring-error focus:border-error"
              />
            </div>

            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => { setIsOpen(false); setPassword(''); setConfirmPhrase(''); setError(''); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium border border-border-default
                  text-text-secondary hover:bg-bg-subtle transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-error text-white
                  hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                aria-busy={isLoading}
              >
                {isLoading ? '삭제 중...' : '영구 삭제'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
