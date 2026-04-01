// @task S1BI1 - Next.js 프로젝트 초기화 + Tailwind CSS 설정
// Next.js App Router 진입점 — 점진적 전환 단계
// 기존 Vanilla HTML: /docs/index.html, /demo/*.html

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          My Chatbot World
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          AI 챗봇 생성 플랫폼 — Next.js + Tailwind CSS 초기화 완료
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="/docs/index.html"
            className="px-6 py-3 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
          >
            기존 데모 보기
          </a>
          <a
            href="/demo/simple-demo.html"
            className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            심플 데모
          </a>
        </div>
        {/* S1F1 이후 실제 컴포넌트로 교체 예정 */}
        <p className="text-sm text-gray-500">
          Task S1BI1 완료 · 점진적 전환 진행 중
        </p>
      </div>
    </main>
  );
}
