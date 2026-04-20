/**
 * @task S1SC1 (diagnostic build)
 * @description 인증 콜백 — 도착 URL / 세션 상태를 화면에 덤프하여 원인 추적
 *
 * ⚠ 일시적으로 자동 redirect 를 중단하고 디버그 패널을 노출한다.
 * 원인 확인 후 기존 로직으로 되돌린다.
 */
'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';

const BUILD_TAG = 'DIAG-2026-04-21-01';

type Dump = {
  href: string;
  search: Record<string, string>;
  hash: string;
  sessionProvider: string | null;
  sessionUserEmail: string | null;
  exchangeError: string | null;
  exchangeAttempted: boolean;
  onAuthEvents: string[];
};

export default function AuthCallbackPage() {
  const [dump, setDump] = useState<Dump | null>(null);

  useEffect(() => {
    let cancelled = false;
    const events: string[] = [];

    async function run() {
      const url = new URL(window.location.href);
      const search: Record<string, string> = {};
      url.searchParams.forEach((v, k) => {
        search[k] = v.length > 80 ? v.slice(0, 80) + '…' : v;
      });

      const base: Dump = {
        href: window.location.href,
        search,
        hash: url.hash || '(none)',
        sessionProvider: null,
        sessionUserEmail: null,
        exchangeError: null,
        exchangeAttempted: false,
        onAuthEvents: [],
      };

      const { data: first } = await supabase.auth.getSession();
      if (cancelled) return;
      if (first.session) {
        base.sessionProvider =
          (first.session.user.app_metadata as { provider?: string } | undefined)?.provider ?? 'unknown';
        base.sessionUserEmail = first.session.user.email ?? null;
      }

      supabase.auth.onAuthStateChange((event, session) => {
        events.push(`${event}${session ? `(user=${session.user.email ?? '?'})` : ''}`);
        setDump((prev) => (prev ? { ...prev, onAuthEvents: [...events] } : prev));
      });

      const code = url.searchParams.get('code');
      if (code && !first.session) {
        base.exchangeAttempted = true;
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) {
          if (error) {
            base.exchangeError = `${error.name ?? 'Error'}: ${error.message}`;
          } else if (data.session) {
            base.sessionProvider =
              (data.session.user.app_metadata as { provider?: string } | undefined)?.provider ?? 'unknown';
            base.sessionUserEmail = data.session.user.email ?? null;
          } else {
            base.exchangeError = 'exchange returned session=null, error=null';
          }
        }
      }

      if (!cancelled) setDump(base);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen px-4 py-6" style={{ background: 'var(--surface-0)' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-lg font-bold mb-2">🛠 /auth/callback 진단</h1>
        <p className="text-xs text-text-tertiary mb-4">
          BUILD: <code>{BUILD_TAG}</code> — 자동 리다이렉트가 일시 중단되어 있습니다.
        </p>
        {!dump ? (
          <p className="text-sm">확인 중…</p>
        ) : (
          <pre
            className="text-xs p-3 rounded-lg overflow-auto whitespace-pre-wrap break-all"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}
          >
            {JSON.stringify(dump, null, 2)}
          </pre>
        )}
        <div className="mt-4 flex gap-2">
          <a
            href="/login"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'var(--interactive-primary)' }}
          >
            /login 으로 이동
          </a>
          <a
            href="/home"
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}
          >
            /home 으로 이동
          </a>
        </div>
      </div>
    </main>
  );
}
