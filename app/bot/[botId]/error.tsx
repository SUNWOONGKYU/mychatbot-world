'use client';

/**
 * @description /bot/[botId] 세그먼트 에러 바운더리
 * 봇 페이지 로드/챗 스트리밍 중 에러가 발생해도 전체 앱이 죽지 않도록.
 */
export default function BotError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-base))] px-6">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-4xl">🤖</div>
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
          봇을 불러올 수 없습니다
        </h2>
        <p className="text-[rgb(var(--text-secondary))] text-sm">
          {error.message || '해당 봇이 존재하지 않거나 일시적 오류가 발생했습니다.'}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-[rgb(var(--color-primary))] text-white rounded-lg hover:opacity-90 transition"
          >
            다시 시도
          </button>
          <a
            href="/"
            className="px-4 py-2 border border-[rgb(var(--text-muted)/0.3)] text-[rgb(var(--text-secondary))] rounded-lg hover:bg-[rgb(var(--bg-subtle))] transition"
          >
            홈으로
          </a>
        </div>
      </div>
    </div>
  );
}
