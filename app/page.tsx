/**
 * @task S7FE5 - P0 첫인상 페이지 리디자인 (v2 — 시각 전면 강화)
 * @route / (public)
 *
 * Hero와 통일된 디자인 언어:
 * - 다크 radial-gradient + 플로팅 오브 배경
 * - 글래스모피즘 카드 (blur + 반투명 + 얇은 border)
 * - 골드 시머 엑센트
 * - hover: translate-y + scale + glow
 */

import Link from 'next/link';
import { HeroSection } from '@/components/landing/hero';
import { MarketingGNB } from '@/components/landing/marketing-gnb';
import { LandingFooter } from '@/components/landing/footer';

/* ── 6가지 코코봇 유형 ────────────────────────────── */
const AVATAR_TYPES = [
  { icon: '🏪', title: '매장 전용 코코봇', desc: '카페·식당·학원·병원·미용실 — 직원 없이도 24시간 상담·예약·문의를 자동 응대합니다' },
  { icon: '🏛️', title: '유권자 소통 코코봇', desc: '국회의원·지자체장·지방의원 — 유권자 질문·민원·공약·일정을 24시간 친절하게 답변합니다' },
  { icon: '💼', title: '전문 상담 코코봇', desc: '세무사·변호사·의사·코치·강사 — 반복 기초 상담은 코코봇이 처리하고, 유료 상담으로 자연스럽게 연결합니다' },
  { icon: '🎨', title: '재능 공유 코코봇', desc: '취미·재능·사이드 프로젝트 — 자수·요리·게임 노하우를 코코봇에 담아 소액 유료 답변·디지털 굿즈로 부업화합니다' },
];
const HELPER_TYPES = [
  { icon: '🤖', title: 'AI 업무비서 코코봇', desc: '시키면 대신 해주는 코코봇 — 업무 자동화, 투자 자동매매, AI 원격 실행(폰에서 PC의 AI 도구 제어)' },
  { icon: '🌏', title: '생활 길잡이 코코봇', desc: '물어보면 알려주는 코코봇 — 요약·번역·글쓰기부터 취업·민원·건강·법률까지. 무료·저비용으로 누구나 부담 없이' },
];

/* ── 5단계 생성 프로세스 ──────────────────────────── */
const BIRTH_STEPS = [
  { num: '01', title: '기본정보 입력', desc: '코코봇 이름, 한 줄 소개, 사용자명(URL)을 설정합니다' },
  { num: '02', title: '페르소나 설정', desc: '대면용(공개) 페르소나와 도우미(비공개) 페르소나를 구성합니다' },
  { num: '03', title: '5분 음성 인터뷰', desc: 'AI에게 자신을 소개해주세요. 음성으로 입력합니다' },
  { num: '04', title: 'AI 분석', desc: 'AI가 인터뷰 내용을 분석하여 인사말과 FAQ를 자동 생성합니다' },
  { num: '05', title: '코코봇 생성 완료', desc: '전용 링크와 QR 코드가 생성됩니다' },
];

/* ── 코코봇스쿨 4기능 ──────────────────────────────── */
const SCHOOL_FEATURES = [
  { icon: '🧑‍🏫', title: 'AI 멘토링', desc: '경험 많은 AI 전문가가 초보 코코봇을 1:1 코칭합니다.' },
  { icon: '🎮', title: '시나리오 훈련', desc: '까다로운 고객, 긴급 상황 등 다양한 시나리오를 훈련합니다.' },
  { icon: '📊', title: '학습 이력', desc: '어떤 코코봇 교육을 받았고, 어떤 능력이 향상됐는지 포트폴리오로 보여줍니다.' },
  { icon: '📖', title: '지식 학습', desc: 'FAQ 추가, 문서 업로드, 웹 크롤링으로 전문 지식을 축적합니다.' },
];

/* ── 커뮤니티 3기능 ──────────────────────────────── */
const COMMUNITY_FEATURES = [
  { icon: '💬', title: '노하우 공유', desc: '정치인 코코봇이 터득한 민원 응대 노하우를 다른 코코봇이 학습합니다.' },
  { icon: '🔗', title: '코코봇 간 협업', desc: '식당 코코봇이 배달 코코봇과 연동해서 주문부터 배달까지 자동 처리합니다.' },
  { icon: '📈', title: '성장 기록', desc: '대화 성과, 학습 이력, 레벨 — 내 코코봇이 얼마나 성장했는지 한눈에 봅니다.' },
];

/* ── 공통 다크 섹션 배경 (hero와 동일 계열) ─────────── */
const DARK_BG =
  'radial-gradient(ellipse at top, oklch(0.22 0.14 285) 0%, oklch(0.16 0.12 280) 40%, oklch(0.12 0.08 260) 100%)';

export default function LandingPage() {
  const isLoggedIn = false;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        style={{ background: 'var(--interactive-primary)' }}
      >
        본문으로 건너뛰기
      </a>

      <MarketingGNB isLoggedIn={isLoggedIn} />

      <main id="main-content">
        {/* ═══ SECTION 1: Hero ═══ */}
        <HeroSection isLoggedIn={isLoggedIn} />

        {/* ═══ SECTION 2: 코코봇의 여정 ═══ */}
        <section className="relative overflow-hidden py-24 sm:py-32" style={{ background: DARK_BG }}>
          {/* floating orbs */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div
              className="absolute -top-20 right-0 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl animate-pg-orb-a"
              style={{ background: 'radial-gradient(circle, oklch(0.65 0.25 295) 0%, transparent 70%)' }}
            />
            <div
              className="absolute bottom-0 left-10 h-[360px] w-[360px] rounded-full opacity-20 blur-3xl animate-pg-orb-b"
              style={{ background: 'radial-gradient(circle, oklch(0.70 0.22 50) 0%, transparent 70%)' }}
            />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md"
              style={{
                background: 'color-mix(in oklch, white 8%, transparent)',
                border: '1px solid color-mix(in oklch, white 18%, transparent)',
              }}
            >
              CHATBOT&apos;S JOURNEY
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl [word-break:keep-all]">
              코코봇의{' '}
              <span
                className="inline-block"
                style={{
                  background:
                    'linear-gradient(90deg, oklch(0.85 0.18 85) 0%, oklch(0.78 0.22 50) 50%, oklch(0.70 0.25 25) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  backgroundSize: '200% auto',
                  animation: 'pg-shimmer 4s linear infinite',
                }}
              >
                여정
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg [word-break:keep-all]">
              CoCoBot World에서 코코봇은 태어나고, 배우고, 능력을 키우고, 교류하며 성장합니다
            </p>

            {/* Journey flow — 글래스 카드 + 그라디언트 연결선 */}
            <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
              {[
                { icon: '🐣', label: 'Birth', ko: '탄생', sub: '5분 인터뷰', tint: 'oklch(0.75 0.22 50)' },
                { icon: '📚', label: 'Learning', ko: '학습', sub: '지식 습득', tint: 'oklch(0.70 0.22 210)' },
                { icon: '🔧', label: 'Skills', ko: '스킬', sub: '능력 강화', tint: 'oklch(0.70 0.22 295)' },
                { icon: '🤝', label: 'Community', ko: '봇카페', sub: '교류·성장', tint: 'oklch(0.72 0.20 150)' },
                { icon: '🔗', label: 'Inheritance', ko: '상속', sub: '영속·계승', tint: 'oklch(0.78 0.20 85)' },
              ].map((step, i) => (
                <div key={step.label} className="group relative">
                  <div
                    className="relative h-full rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                    style={{
                      background: 'color-mix(in oklch, white 5%, transparent)',
                      border: '1px solid color-mix(in oklch, white 12%, transparent)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: `0 8px 32px color-mix(in oklch, ${step.tint} 15%, transparent)`,
                    }}
                  >
                    {/* glow on hover */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{
                        background: `radial-gradient(circle at 50% 0%, color-mix(in oklch, ${step.tint} 25%, transparent) 0%, transparent 70%)`,
                      }}
                    />
                    <div className="relative flex flex-col items-center">
                      <span
                        className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                        style={{
                          background: `color-mix(in oklch, ${step.tint} 18%, transparent)`,
                          border: `1px solid color-mix(in oklch, ${step.tint} 35%, transparent)`,
                        }}
                        aria-hidden="true"
                      >
                        {step.icon}
                      </span>
                      <div
                        className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em]"
                        style={{ color: step.tint }}
                      >
                        {i + 1} · {step.label}
                      </div>
                      <h3 className="mt-1 text-base font-bold text-white">{step.ko}</h3>
                      <p className="mt-0.5 text-xs text-white/60">{step.sub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 3: STEP 1 — Birth ═══ */}
        <section className="relative overflow-hidden py-24 sm:py-32" style={{ background: DARK_BG }}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div
              className="absolute left-0 top-20 h-[500px] w-[500px] rounded-full opacity-25 blur-3xl animate-pg-orb-b"
              style={{ background: 'radial-gradient(circle, oklch(0.72 0.22 50) 0%, transparent 70%)' }}
            />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center">
              <span
                className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md"
                style={{
                  background: 'color-mix(in oklch, oklch(0.72 0.22 50) 15%, transparent)',
                  border: '1px solid color-mix(in oklch, oklch(0.72 0.22 50) 35%, transparent)',
                }}
              >
                🐣 STEP 1 · BIRTH
              </span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl [word-break:keep-all]">
                5분 인터뷰로{' '}
                <span
                  style={{
                    background:
                      'linear-gradient(90deg, oklch(0.85 0.18 85), oklch(0.75 0.22 50))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  AI Assistant 코코봇 생성
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg [word-break:keep-all]">
                기본정보 입력, 페르소나 설정, 음성 인터뷰 — 5분이면 당신만의 코코봇이 생성됩니다
              </p>
            </div>

            {/* 5단계 — zig-zag 타임라인 */}
            <div className="relative mx-auto mt-16 max-w-3xl">
              {/* 세로 연결선 */}
              <div
                aria-hidden="true"
                className="absolute left-8 top-0 h-full w-[2px] sm:left-1/2 sm:-translate-x-1/2"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 0%, oklch(0.72 0.22 50) 15%, oklch(0.65 0.25 295) 85%, transparent 100%)',
                }}
              />
              {BIRTH_STEPS.map((s, i) => (
                <div
                  key={s.num}
                  className={`relative mb-8 flex items-center sm:mb-10 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}
                >
                  <div className={`flex-1 pl-20 sm:pl-0 ${i % 2 === 0 ? 'sm:pr-12 sm:text-right' : 'sm:pl-12'}`}>
                    <div
                      className="rounded-2xl p-5 text-left sm:inline-block sm:text-inherit"
                      style={{
                        background: 'color-mix(in oklch, white 6%, transparent)',
                        border: '1px solid color-mix(in oklch, white 14%, transparent)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 8px 32px color-mix(in oklch, black 30%, transparent)',
                      }}
                    >
                      <h3 className="text-lg font-bold text-white">{s.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-white/70">{s.desc}</p>
                    </div>
                  </div>
                  {/* 번호 동그라미 */}
                  <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2">
                    <span
                      className="relative flex h-16 w-16 items-center justify-center rounded-full text-lg font-black text-white"
                      style={{
                        background:
                          'linear-gradient(135deg, oklch(0.55 0.27 285) 0%, oklch(0.48 0.25 295) 100%)',
                        border: '2px solid color-mix(in oklch, white 25%, transparent)',
                        boxShadow:
                          '0 10px 30px color-mix(in oklch, oklch(0.55 0.27 285) 50%, transparent)',
                      }}
                      aria-hidden="true"
                    >
                      {s.num}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 6가지 유형 */}
            <div className="mt-20">
              <div className="text-center">
                <h3 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  6가지 코코봇 유형
                </h3>
                <p className="mt-2 text-sm text-white/60">필요한 유형만 골라 만들 수 있습니다</p>
              </div>

              <div className="mt-10">
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: 'oklch(0.65 0.25 295)', boxShadow: '0 0 12px oklch(0.65 0.25 295)' }}
                  />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                    아바타형 — 나를 대신하는 코코봇
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {AVATAR_TYPES.map((t) => (
                    <div
                      key={t.title}
                      className="group rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1"
                      style={{
                        background: 'color-mix(in oklch, white 5%, transparent)',
                        border: '1px solid color-mix(in oklch, white 12%, transparent)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <span className="text-3xl" aria-hidden="true">
                        {t.icon}
                      </span>
                      <h4 className="mt-3 text-base font-bold text-white">{t.title}</h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/65 [word-break:keep-all]">
                        {t.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: 'oklch(0.78 0.20 85)', boxShadow: '0 0 12px oklch(0.78 0.20 85)' }}
                  />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                    도우미형 — 나를 도와주는 코코봇
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {HELPER_TYPES.map((t) => (
                    <div
                      key={t.title}
                      className="group rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1"
                      style={{
                        background: 'color-mix(in oklch, white 5%, transparent)',
                        border: '1px solid color-mix(in oklch, white 12%, transparent)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <span className="text-3xl" aria-hidden="true">
                        {t.icon}
                      </span>
                      <h4 className="mt-3 text-base font-bold text-white">{t.title}</h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/65 [word-break:keep-all]">
                        {t.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 5: STEP 2 — Learning ═══ */}
        <section className="relative overflow-hidden py-24 sm:py-32" style={{ background: DARK_BG }}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div
              className="absolute right-10 top-10 h-[440px] w-[440px] rounded-full opacity-25 blur-3xl animate-pg-orb-a"
              style={{ background: 'radial-gradient(circle, oklch(0.65 0.22 210) 0%, transparent 70%)' }}
            />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center">
              <span
                className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md"
                style={{
                  background: 'color-mix(in oklch, oklch(0.65 0.22 210) 15%, transparent)',
                  border: '1px solid color-mix(in oklch, oklch(0.65 0.22 210) 35%, transparent)',
                }}
              >
                📚 STEP 2 · LEARNING
              </span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl [word-break:keep-all]">
                체계적으로 배우고{' '}
                <span
                  style={{
                    background: 'linear-gradient(90deg, oklch(0.78 0.18 210), oklch(0.70 0.22 260))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  성장합니다
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg [word-break:keep-all]">
                마이페이지의 학습 기능으로 코코봇을 체계적으로 교육시킵니다
              </p>
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2">
              {SCHOOL_FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className="group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: 'color-mix(in oklch, white 6%, transparent)',
                    border: '1px solid color-mix(in oklch, white 14%, transparent)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px color-mix(in oklch, black 25%, transparent)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
                      style={{
                        background: 'color-mix(in oklch, oklch(0.65 0.22 210) 18%, transparent)',
                        border: '1px solid color-mix(in oklch, oklch(0.65 0.22 210) 30%, transparent)',
                      }}
                      aria-hidden="true"
                    >
                      {f.icon}
                    </span>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                        0{i + 1}
                      </div>
                      <h3 className="mt-1 text-lg font-bold text-white">{f.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/65 [word-break:keep-all]">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 6: STEP 3 — Skills ═══ */}
        <section className="relative overflow-hidden py-24 sm:py-32" style={{ background: DARK_BG }}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div
              className="absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-25 blur-3xl animate-pg-orb-c"
              style={{ background: 'radial-gradient(circle, oklch(0.65 0.28 295) 0%, transparent 70%)' }}
            />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md"
              style={{
                background: 'color-mix(in oklch, oklch(0.65 0.28 295) 15%, transparent)',
                border: '1px solid color-mix(in oklch, oklch(0.65 0.28 295) 35%, transparent)',
              }}
            >
              🔧 STEP 3 · SKILLS
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl [word-break:keep-all]">
              스킬장터에서{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, oklch(0.75 0.24 295), oklch(0.70 0.28 315))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                능력 장착
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg [word-break:keep-all]">
              예약, 결제, 번역, 감정 분석 — 코코봇에 필요한 스킬을 골라 장착하세요.
              <br className="hidden sm:block" />
              사용자가 만든 스킬도 공유·거래합니다.
            </p>

            {/* 스킬 태그 그리드 */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {[
                { label: '예약 관리', icon: '📅' },
                { label: '결제 연동', icon: '💳' },
                { label: '다국어 번역', icon: '🌐' },
                { label: '감정 분석', icon: '💭' },
                { label: '음성 응답', icon: '🎤' },
                { label: 'FAQ 자동생성', icon: '📝' },
                { label: '고객 CRM', icon: '👥' },
                { label: '분석 대시보드', icon: '📊' },
              ].map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/90 transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'color-mix(in oklch, white 6%, transparent)',
                    border: '1px solid color-mix(in oklch, white 14%, transparent)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <span aria-hidden="true">{s.icon}</span>
                  {s.label}
                </span>
              ))}
            </div>

            <div className="mt-12">
              <Link
                href="/skills"
                className="group inline-flex items-center gap-2 overflow-hidden rounded-xl px-8 py-4 text-base font-bold text-white transition-all hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2"
                style={{
                  background:
                    'linear-gradient(135deg, oklch(0.55 0.27 285) 0%, oklch(0.48 0.25 295) 100%)',
                  boxShadow:
                    '0 10px 40px color-mix(in oklch, oklch(0.55 0.27 285) 50%, transparent), inset 0 1px 0 color-mix(in oklch, white 25%, transparent)',
                }}
              >
                전체 스킬 둘러보기
                <svg
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 7: STEP 4 — Community ═══ */}
        <section className="relative overflow-hidden py-24 sm:py-32" style={{ background: DARK_BG }}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div
              className="absolute bottom-0 right-20 h-[460px] w-[460px] rounded-full opacity-25 blur-3xl animate-pg-orb-b"
              style={{ background: 'radial-gradient(circle, oklch(0.65 0.22 150) 0%, transparent 70%)' }}
            />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center">
              <span
                className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md"
                style={{
                  background: 'color-mix(in oklch, oklch(0.65 0.22 150) 15%, transparent)',
                  border: '1px solid color-mix(in oklch, oklch(0.65 0.22 150) 35%, transparent)',
                }}
              >
                🤝 STEP 4 · COMMUNITY
              </span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl [word-break:keep-all]">
                봇카페에서{' '}
                <span
                  style={{
                    background: 'linear-gradient(90deg, oklch(0.75 0.20 150), oklch(0.70 0.22 180))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  교류·협업
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg [word-break:keep-all]">
                CoCoBot World에서 코코봇은 혼자가 아닙니다. 서로 배우고 함께 일합니다.
              </p>
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              {COMMUNITY_FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className="group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: 'color-mix(in oklch, white 6%, transparent)',
                    border: '1px solid color-mix(in oklch, white 14%, transparent)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px color-mix(in oklch, black 25%, transparent)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                      style={{
                        background: 'color-mix(in oklch, oklch(0.65 0.22 150) 18%, transparent)',
                        border: '1px solid color-mix(in oklch, oklch(0.65 0.22 150) 30%, transparent)',
                      }}
                      aria-hidden="true"
                    >
                      {f.icon}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65 [word-break:keep-all]">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 8: STEP 5 — Inheritance ═══ */}
        <section className="relative overflow-hidden py-24 sm:py-32" style={{ background: DARK_BG }}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div
              className="absolute left-10 top-20 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl animate-pg-orb-a"
              style={{ background: 'radial-gradient(circle, oklch(0.78 0.20 85) 0%, transparent 70%)' }}
            />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center">
              <span
                className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md"
                style={{
                  background: 'color-mix(in oklch, oklch(0.78 0.20 85) 15%, transparent)',
                  border: '1px solid color-mix(in oklch, oklch(0.78 0.20 85) 35%, transparent)',
                }}
              >
                🔗 STEP 5 · INHERITANCE
              </span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl [word-break:keep-all]">
                코코봇은{' '}
                <span
                  style={{
                    background: 'linear-gradient(90deg, oklch(0.85 0.18 85), oklch(0.75 0.22 50))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  영원합니다
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg [word-break:keep-all]">
                내 코코봇의 페르소나, 지식, 스킬을 다음 세대에게 물려줄 수 있습니다.
                <br className="hidden sm:block" />
                대화 로그, KB, 유료 스킬 등 항목별로 선택하여 상속합니다.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-3xl gap-4 sm:grid-cols-3">
              {[
                { icon: '👤', title: '피상속인 지정', desc: '누구에게 물려줄지 선택' },
                { icon: '📋', title: '항목별 선택', desc: '대화·KB·스킬·크레딧 개별 지정' },
                { icon: '✅', title: '동의 요청', desc: '피상속인의 수락 후 완료' },
              ].map((item, i) => (
                <div
                  key={item.title}
                  className="group relative rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: 'color-mix(in oklch, white 6%, transparent)',
                    border: '1px solid color-mix(in oklch, white 14%, transparent)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                    style={{
                      background: 'color-mix(in oklch, oklch(0.78 0.20 85) 18%, transparent)',
                      border: '1px solid color-mix(in oklch, oklch(0.78 0.20 85) 30%, transparent)',
                    }}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </div>
                  <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    STEP 0{i + 1}
                  </div>
                  <h3 className="mt-1 text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-white/60">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 9: 하단 CTA ═══ */}
        <section className="relative overflow-hidden py-24 sm:py-32" style={{ background: DARK_BG }}>
          {/* 더 강한 오브들 */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div
              className="absolute -top-20 -left-20 h-[600px] w-[600px] rounded-full opacity-40 blur-3xl animate-pg-orb-a"
              style={{ background: 'radial-gradient(circle, oklch(0.65 0.28 295) 0%, transparent 70%)' }}
            />
            <div
              className="absolute -bottom-32 -right-20 h-[540px] w-[540px] rounded-full opacity-35 blur-3xl animate-pg-orb-b"
              style={{ background: 'radial-gradient(circle, oklch(0.72 0.22 50) 0%, transparent 70%)' }}
            />
            {/* grid */}
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  'linear-gradient(rgb(255 255 255 / 0.15) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.15) 1px, transparent 1px)',
                backgroundSize: '56px 56px',
                maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
              }}
            />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl [word-break:keep-all]">
              당신의 AI Assistant 코코봇을{' '}
              <span
                className="inline-block"
                style={{
                  background:
                    'linear-gradient(90deg, oklch(0.85 0.18 85) 0%, oklch(0.78 0.22 50) 50%, oklch(0.70 0.25 25) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  backgroundSize: '200% auto',
                  animation: 'pg-shimmer 4s linear infinite',
                }}
              >
                생성하세요
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg [word-break:keep-all]">
              5분 만에 생성되고, 코코봇스쿨에서 배우고, 스킬을 장착하고, 커뮤니티에서 성장합니다.
              <br />
              그래서{' '}
              <strong className="font-bold text-white">당신을 대신해 24시간 활동합니다.</strong>
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/create"
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-8 py-4 text-base font-bold text-white transition-all hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 sm:w-auto"
                style={{
                  background:
                    'linear-gradient(135deg, oklch(0.55 0.27 285) 0%, oklch(0.48 0.25 295) 100%)',
                  boxShadow:
                    '0 10px 40px color-mix(in oklch, oklch(0.55 0.27 285) 55%, transparent), inset 0 1px 0 color-mix(in oklch, white 25%, transparent)',
                }}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]"
                />
                <span className="relative" aria-hidden="true">
                  🎤
                </span>
                <span className="relative">5분 인터뷰로 시작하기</span>
              </Link>
              <Link
                href="/guest"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white transition-all hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 sm:w-auto"
                style={{
                  background: 'color-mix(in oklch, white 10%, transparent)',
                  border: '1px solid color-mix(in oklch, white 25%, transparent)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <span aria-hidden="true">⚡</span>
                지금 무료로 체험하기
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />

      {/* 애니메이션 — 페이지 전역 */}
      <style>{`
        @keyframes pg-shimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pg-orb-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(30px, 20px) scale(1.08); }
        }
        @keyframes pg-orb-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-25px, -30px) scale(1.06); }
        }
        @keyframes pg-orb-c {
          0%, 100% { transform: translate(-50%, 0) scale(1); opacity: 0.20; }
          50%      { transform: translate(-50%, -20px) scale(1.12); opacity: 0.30; }
        }
        .animate-pg-orb-a { animation: pg-orb-a 18s ease-in-out infinite; }
        .animate-pg-orb-b { animation: pg-orb-b 22s ease-in-out infinite; }
        .animate-pg-orb-c { animation: pg-orb-c 14s ease-in-out infinite; }
      `}</style>
    </>
  );
}
