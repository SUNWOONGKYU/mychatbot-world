/**
 * @task S5FE3 - 랜딩 페이지 리디자인
 * @component RevenueSection
 * @description 수익 창출 강조 섹션 — 앰버 골드 컬러 강조
 *              크리에이터 수익 현황 + 스킬 판매 CTA
 *              P4 와이어프레임 SECTION 4 기준
 */

import Link from 'next/link';

const REVENUE_STATS = [
  {
    value: '₩3,240,000',
    label: '이번 달 크리에이터 스킬 판매 수익',
    sub: '전체 크리에이터 합산',
    highlight: true,
  },
  {
    value: '₩15만',
    label: '크리에이터 평균 월 수익',
    sub: '상위 20% 기준 ₩60만',
    highlight: false,
  },
  {
    value: '120명+',
    label: '수익 중인 크리에이터',
    sub: '지난 달 대비 +18명',
    highlight: false,
  },
];

const REVENUE_BREAKDOWN = [
  { label: '스킬 판매', amount: '₩892,000', percent: 72, color: 'rgb(var(--color-primary))' },
  { label: '봇 임대', amount: '₩242,000', percent: 20, color: 'rgb(var(--color-accent))' },
  { label: '프리미엄 상담', amount: '₩100,000', percent: 8, color: 'rgb(var(--color-success))' },
];

export function RevenueSection() {
  return (
    <section
      className="py-20 sm:py-28"
      style={{ background: 'rgb(var(--bg-subtle))' }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* 좌: 카피 */}
          <div>
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{
                background: 'rgb(var(--color-accent) / 0.1)',
                color: 'rgb(var(--color-accent))',
              }}
            >
              수익 창출
            </span>

            <h2
              className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ color: 'rgb(var(--text-primary-rgb))' }}
            >
              코코봇이{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, rgb(var(--amber-400)), rgb(var(--amber-300)))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                나 대신 일합니다
              </span>
            </h2>

            <p
              className="mt-5 text-lg leading-8"
              style={{ color: 'rgb(var(--text-secondary-rgb))' }}
            >
              스킬스토어에서 스킬을 판매하거나, 코코봇을 임대하거나, 프리미엄 상담 서비스로
              직접 수익을 창출하세요. 자는 동안에도 코코봇이 수익을 만들어냅니다.
            </p>

            {/* 통계 */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {REVENUE_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border p-5 transition-all hover:shadow-md"
                  style={{
                    background: stat.highlight
                      ? 'linear-gradient(135deg, rgb(var(--amber-500) / 0.12), rgb(var(--amber-400) / 0.05))'
                      : 'rgb(var(--bg-surface))',
                    borderColor: stat.highlight
                      ? 'rgb(var(--amber-500) / 0.35)'
                      : 'rgb(var(--border))',
                  }}
                >
                  <p
                    className="text-xl font-extrabold sm:text-2xl"
                    style={{ color: 'rgb(var(--color-accent))' }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="mt-1 text-xs font-medium"
                    style={{ color: 'rgb(var(--text-primary-rgb))' }}
                  >
                    {stat.label}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    {stat.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* 수익화 흐름도 */}
            <div
              className="mt-8 rounded-2xl border p-5"
              style={{
                background: 'rgb(var(--bg-surface))',
                borderColor: 'rgb(var(--border))',
              }}
            >
              <p
                className="mb-4 text-xs font-bold uppercase tracking-widest"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                어떻게 수익을 만드나요?
              </p>
              <ol className="space-y-3">
                {[
                  {
                    num: '1',
                    title: '스킬 판매',
                    desc: '스킬장터에서 스킬 등록 → 다른 사용자가 구매',
                    color: 'rgb(var(--color-primary))',
                  },
                  {
                    num: '2',
                    title: '코코봇 임대',
                    desc: '구봇구직에서 내 코코봇 등록 → 고용주가 사용료 지불',
                    color: 'rgb(var(--color-accent))',
                  },
                  {
                    num: '3',
                    title: '프리미엄 상담',
                    desc: '코코봇 대화당 과금 설정 → 전문 상담 자동화',
                    color: 'rgb(var(--color-success))',
                  },
                ].map((item) => (
                  <li key={item.num} className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: item.color }}
                    >
                      {item.num}
                    </span>
                    <div>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: 'rgb(var(--text-primary-rgb))' }}
                      >
                        {item.title}
                      </span>
                      <span
                        className="ml-1.5 text-xs"
                        style={{ color: 'rgb(var(--text-muted))' }}
                      >
                        {item.desc}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/skills"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, rgb(var(--amber-500)), rgb(var(--amber-400)))',
                  color: 'rgb(17 17 17)',
                  boxShadow: '0 6px 20px rgb(var(--amber-500) / 0.35)',
                }}
              >
                스킬 판매 시작하기
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/community"
                className="inline-flex items-center justify-center rounded-xl border px-7 py-3.5 text-sm font-semibold transition-all hover:shadow-sm"
                style={{
                  borderColor: 'rgb(var(--border))',
                  color: 'rgb(var(--text-primary-rgb))',
                  background: 'rgb(var(--bg-surface))',
                }}
              >
                크리에이터 후기 보기
              </Link>
            </div>
          </div>

          {/* 우: 수익 현황 위젯 */}
          <div>
            <div
              className="overflow-hidden rounded-3xl border shadow-xl"
              style={{
                background: 'rgb(var(--bg-surface))',
                borderColor: 'rgb(var(--border))',
                boxShadow: '0 16px 48px rgb(var(--amber-500) / 0.1)',
              }}
            >
              {/* 위젯 헤더 */}
              <div
                className="flex items-center justify-between border-b px-6 py-5"
                style={{
                  background: 'rgb(var(--bg-subtle))',
                  borderColor: 'rgb(var(--border))',
                }}
              >
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'rgb(var(--text-primary-rgb))' }}
                  >
                    수익 현황 대시보드
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    2026년 4월
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: 'rgb(var(--color-success) / 0.1)',
                    color: 'rgb(var(--color-success))',
                  }}
                >
                  실시간
                </span>
              </div>

              <div className="p-6">
                {/* 이번 달 총 수익 */}
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    이번 달 수익
                  </p>
                  <div className="mt-1 flex items-end justify-between">
                    <p
                      className="text-4xl font-extrabold"
                      style={{ color: 'rgb(var(--color-accent))' }}
                    >
                      ₩152,000
                    </p>
                    <div className="text-right">
                      <p
                        className="text-lg font-bold"
                        style={{ color: 'rgb(var(--color-success))' }}
                      >
                        ▲ 23%
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'rgb(var(--text-muted))' }}
                      >
                        지난달 대비
                      </p>
                    </div>
                  </div>
                </div>

                {/* 수익 분류 */}
                <div className="mt-6 space-y-4">
                  {REVENUE_BREAKDOWN.map((item) => (
                    <div key={item.label}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span style={{ color: 'rgb(var(--text-secondary-rgb))' }}>
                          {item.label}
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: 'rgb(var(--text-primary-rgb))' }}
                        >
                          {item.amount}
                        </span>
                      </div>
                      <div
                        className="h-2 w-full overflow-hidden rounded-full"
                        style={{ background: 'rgb(var(--bg-muted))' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${item.percent}%`,
                            background: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 누적 수익 */}
                <div
                  className="mt-6 rounded-2xl border p-4 text-center"
                  style={{
                    background: 'rgb(var(--amber-500) / 0.06)',
                    borderColor: 'rgb(var(--amber-500) / 0.2)',
                  }}
                >
                  <p
                    className="text-xs"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    올해 누적 수익
                  </p>
                  <p
                    className="mt-1 text-2xl font-extrabold"
                    style={{ color: 'rgb(var(--color-accent))' }}
                  >
                    ₩890,000
                  </p>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    목표 ₩1,200,000 달성률 74.2%
                  </p>
                  <div
                    className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                    style={{ background: 'rgb(var(--bg-muted))' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: '74.2%',
                        background: 'linear-gradient(90deg, rgb(var(--amber-500)), rgb(var(--amber-400)))',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
