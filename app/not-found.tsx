import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-base))]">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-4xl font-bold text-[rgb(var(--text-primary-rgb))]">404</h2>
        <p className="text-[rgb(var(--text-secondary-rgb))]">페이지를 찾을 수 없습니다.</p>
        <Link href="/" className="inline-block px-4 py-2 bg-[rgb(var(--color-primary))] text-white rounded-lg hover:opacity-90 transition">홈으로 돌아가기</Link>
      </div>
    </div>
  );
}
