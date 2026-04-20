'use client';

/**
 * @description /mypage 세그먼트 에러 바운더리
 * 탭 컴포넌트 비동기 로드 실패 시 전체 앱 크래시 방지.
 */
export default function MypageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-base))] px-6">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
          마이페이지 오류
        </h2>
        <p className="text-[rgb(var(--text-secondary))] text-sm">
          {error.message || '데이터를 불러오는 중 문제가 발생했습니다.'}
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
