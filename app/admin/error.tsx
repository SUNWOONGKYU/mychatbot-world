'use client';

/**
 * @description /admin 세그먼트 에러 바운더리
 * 관리자 페이지 내 비동기/렌더 에러가 전체 앱을 터뜨리지 않도록 격리.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-base))]">
      <div className="text-center space-y-4 p-8 max-w-md">
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
          관리자 페이지 오류
        </h2>
        <p className="text-[rgb(var(--text-secondary))] text-sm">
          {error.message || '일시적 오류가 발생했습니다.'}
        </p>
        {error.digest && (
          <p className="text-xs text-[rgb(var(--text-muted))] font-mono">
            digest: {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-[rgb(var(--color-primary))] text-white rounded-lg hover:opacity-90 transition"
          >
            다시 시도
          </button>
          <a
            href="/admin"
            className="px-4 py-2 border border-[rgb(var(--text-muted)/0.3)] text-[rgb(var(--text-secondary))] rounded-lg hover:bg-[rgb(var(--bg-subtle))] transition"
          >
            관리자 홈
          </a>
        </div>
      </div>
    </div>
  );
}
