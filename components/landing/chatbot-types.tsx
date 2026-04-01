/**
 * @task S2FE4 - Landing 페이지 React 전환
 * @component ChatbotTypes
 * @description MCW 6대 챗봇 유형 소개 섹션
 *              대리형×2, 수익형, 부업형, 실행형, 생활도우미
 */

interface ChatbotType {
  id: string;
  icon: string;
  category: string;
  title: string;
  description: string;
  useCases: string[];
  /** 카드 강조 여부 (베스트셀러 등) */
  featured?: boolean;
}

const CHATBOT_TYPES: ChatbotType[] = [
  {
    id: 'proxy-customer',
    icon: '🎧',
    category: '대리형',
    title: '고객 상담 대리봇',
    description: '24시간 고객 응대를 자동화. FAQ, 주문 조회, 불만 처리까지 사람 없이 운영합니다.',
    useCases: ['쇼핑몰 CS', '예약 안내', '자주 묻는 질문'],
    featured: true,
  },
  {
    id: 'proxy-sales',
    icon: '🛍',
    category: '대리형',
    title: '쇼핑 어시스턴트봇',
    description: '상품 추천, 재고 확인, 결제 안내를 자동화해 전환율을 높입니다.',
    useCases: ['상품 추천', '장바구니 도우미', '리뷰 수집'],
  },
  {
    id: 'revenue',
    icon: '💰',
    category: '수익형',
    title: '유료 콘텐츠봇',
    description: '구독형 AI 서비스로 직접 수익을 창출. 멤버십 전용 기능으로 수익 모델을 만듭니다.',
    useCases: ['AI 코칭', '프리미엄 조언', '구독 서비스'],
    featured: true,
  },
  {
    id: 'side-hustle',
    icon: '📱',
    category: '부업형',
    title: 'SNS 마케팅봇',
    description: '콘텐츠 기획, 카피 작성, 해시태그 추천을 자동화해 SNS 운영을 돕습니다.',
    useCases: ['인스타 카피', '블로그 초안', '광고 문구'],
  },
  {
    id: 'action',
    icon: '⚡',
    category: '실행형',
    title: '업무 자동화봇',
    description: '반복 업무를 자동으로 처리. 보고서 작성, 데이터 정리, 일정 관리까지.',
    useCases: ['보고서 자동화', '데이터 요약', '일정 조율'],
  },
  {
    id: 'lifestyle',
    icon: '🏠',
    category: '생활도우미',
    title: '개인 비서봇',
    description: '식단 관리, 운동 루틴, 학습 계획 등 일상을 AI가 함께 관리합니다.',
    useCases: ['건강 관리', '학습 플래너', '여행 계획'],
  },
];

/**
 * ChatbotTypes
 * - 6대 챗봇 유형을 3열 그리드로 표시
 * - featured 카드는 primary 테두리 강조
 */
export function ChatbotTypes() {
  return (
    <section id="chatbot-types" className="bg-bg-subtle py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* 섹션 헤더 */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            6대 챗봇 유형
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            내 목적에 딱 맞는 챗봇
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            비즈니스 유형에 따라 최적화된 챗봇 템플릿을 선택하세요.
            모두 코딩 없이 5분 내 완성됩니다.
          </p>
        </div>

        {/* 카드 그리드 */}
        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CHATBOT_TYPES.map((type) => (
            <li key={type.id}>
              <article
                className={[
                  'relative flex h-full flex-col rounded-2xl border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md',
                  type.featured
                    ? 'border-primary/40 ring-1 ring-primary/20'
                    : 'border-border',
                ].join(' ')}
              >
                {type.featured && (
                  <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    인기
                  </span>
                )}

                {/* 아이콘 */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                  {type.icon}
                </div>

                {/* 카테고리 배지 */}
                <span className="mb-1 text-xs font-medium text-primary">
                  {type.category}
                </span>

                {/* 제목 */}
                <h3 className="text-lg font-semibold text-text-primary">
                  {type.title}
                </h3>

                {/* 설명 */}
                <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
                  {type.description}
                </p>

                {/* 활용 사례 태그 */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {type.useCases.map((uc) => (
                    <span
                      key={uc}
                      className="rounded-md bg-bg-muted px-2.5 py-1 text-xs text-text-secondary"
                    >
                      {uc}
                    </span>
                  ))}
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
