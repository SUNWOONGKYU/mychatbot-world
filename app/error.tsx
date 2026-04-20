'use client';

import { useEffect } from 'react';
import { captureException } from '@/lib/observability/sentry';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void captureException(error, {
      tags: { component: 'app/error.tsx', digest: error.digest ?? 'none' },
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-base))]">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">문제가 발생했습니다</h2>
        <p className="text-[rgb(var(--text-secondary))]">{error.message || '잠시 후 다시 시도해주세요.'}</p>
        <button onClick={reset} className="px-4 py-2 bg-[rgb(var(--color-primary))] text-white rounded-lg hover:opacity-90 transition">다시 시도</button>
      </div>
    </div>
  );
}
