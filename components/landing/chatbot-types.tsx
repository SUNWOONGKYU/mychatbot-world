/**
 * @task S5FE3 - 랜딩 페이지 리디자인
 * @component ChatbotTypes
 * @description 챗봇 유형 섹션 — 카테고리 카드 + hover 인터랙션
 *              P4 와이어프레임 SECTION 2 기준
 */
'use client';

import { useState } from 'react';

interface ChatbotCategory {
  id: string;
  icon: string;
  title: string;
  description: string;
  tags: string[];
  gradient: string;
}

const CHATBOT_CATEGORIES: ChatbotCategory[] = [
  {
    id: 'medical',
    icon: '⚕',
    title: '의료 상담봇',
    description: '증상 안내, 병원 예약, 복약 알림까지 24시간 의료 도우미',
    tags: ['증상 분석', '병원 찾기', '복약 관리'],
    gradient: 'linear-gradient(135deg, rgb(59 130 246 / 0.15), rgb(96 165 250 / 0.05))',
  },
  {
    id: 'legal',
    icon: '⚖',
    title: '법률 도우미봇',
    description: '계약서 검토, 법률 상식, 분쟁 초기 가이드 제공',
    tags: ['계약 검토', '법률 상식', '권리 안내'],
    gradient: 'linear-gradient(135deg, rgb(139 92 246 / 0.15), rgb(167 139 250 / 0.05))',
  },
  {
    id: 'shopping',
    icon: '🛍',
    title: '쇼핑 어시스턴트',
    description: '상품 추천, 주문 조회, CS 자동 응대로 전환율 3배 향상',
    tags: ['상품 추천', '주문 추적', 'CS 자동화'],
    gradient: 'linear-gradient(135deg, rgb(236 72 153 / 0.15), rgb(251 113 133 / 0.05))',
  },
  {
    id: 'education',
    icon: '📚',
    title: '교육 튜터봇',
    description: '1:1 맞춤 학습, 퀴즈 생성, 진도 관리까지 AI 과외 선생님',
    tags: ['맞춤 학습', '퀴즈 생성', '진도 관리'],
    gradient: 'linear-gradient(135deg, rgb(16 185 129 / 0.15), rgb(52 211 153 / 0.05))',
  },
  {
    id: 'revenue',
    icon: '💰',
    title: '수익형 컨설팅봇',
    description: '프리미엄 AI 서비스를 구독 형태로 직접 수익 창출',
    tags: ['구독 수익', 'AI 코칭', '프리미엄'],
    gradient: 'linear-gradient(135deg, rgb(245 158 11 / 0.15), rgb(251 191 36 / 0.05))',
  },
];

export function ChatbotTypes() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section
      id="chatbot-types"
      className="py-20 sm:py-28"
      style={{ background: 'rgb(var(--bg-subtle))' }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* 헤더 */}
        <div className="mx-auto max-w-2xl text-center">
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: 'rgb(var(--color-primary) / 0.1)',
              color: 'rgb(var(--color-primary))',
            }}
          >
            코코봇 유형
          </span>
          <h2
            className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            나의 코코봇을 선택하세요
          </h2>
          <p
            className="mt-4 text-lg"
            style={{ color: 'rgb(var(--text-secondary))' }}
          >
            목적에 맞는 코코봇 유형을 선택하면 5분 인터뷰로 바로 생성됩니다.
          </p>
        </div>

        {/* 카드 그리드 */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {CHATBOT_CATEGORIES.map((cat) => {
            const isHovered = hoveredId === cat.id;
            return (
              <a
                key={cat.id}
                href="/create"
                onMouseEnter={() => setHoveredId(cat.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group relative flex flex-col rounded-2xl border p-5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: isHovered ? cat.gradient : 'rgb(var(--bg-surface))',
                  borderColor: isHovered
                    ? 'rgb(var(--color-primary) / 0.5)'
                    : 'rgb(var(--border))',
                  transform: isHovered ? 'translateY(-4px)' : 'none',
                  boxShadow: isHovered
                    ? '0 12px 32px rgb(var(--primary-500) / 0.15)'
                    : 'none',
                  outlineColor: 'rgb(var(--color-primary))',
                }}
              >
                {/* 아이콘 */}
                <div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all duration-300"
                  style={{
                    background: isHovered
                      ? 'rgb(var(--color-primary) / 0.15)'
                      : 'rgb(var(--bg-muted))',
                  }}
                >
                  {cat.icon}
                </div>

                {/* 제목 */}
                <h3
                  className="text-sm font-bold transition-colors"
                  style={{
                    color: isHovered
                      ? 'rgb(var(--color-primary))'
                      : 'rgb(var(--text-primary))',
                  }}
                >
                  {cat.title}
                </h3>

                {/* 설명 */}
                <p
                  className="mt-2 flex-1 text-xs leading-relaxed"
                  style={{ color: 'rgb(var(--text-secondary))' }}
                >
                  {cat.description}
                </p>

                {/* 태그 */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {cat.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md px-2 py-0.5 text-xs"
                      style={{
                        background: 'rgb(var(--bg-muted))',
                        color: 'rgb(var(--text-muted))',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 화살표 */}
                <div
                  className="mt-4 flex items-center gap-1 text-xs font-semibold transition-all duration-300"
                  style={{
                    color: 'rgb(var(--color-primary))',
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? 'translateX(0)' : 'translateX(-8px)',
                  }}
                >
                  <span>체험하기</span>
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </a>
            );
          })}
        </div>

        {/* 더보기 링크 */}
        <div className="mt-10 text-center">
          <a
            href="/create"
            className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition-all hover:shadow-md"
            style={{
              borderColor: 'rgb(var(--color-primary) / 0.4)',
              color: 'rgb(var(--color-primary))',
              background: 'rgb(var(--color-primary) / 0.05)',
            }}
          >
            더 많은 코코봇 유형 보기
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
