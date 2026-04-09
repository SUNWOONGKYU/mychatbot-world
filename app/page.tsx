/**
 * @task S5FE3 - 랜딩 페이지 (바닐라 원본 구조 충실 재현)
 * @route / (public)
 *
 * 섹션 순서 (바닐라 index.html 원본 기준):
 * 1. Hero — "당신의 AI 챗봇이 이 세상에 태어납니다" + CTA
 * 2. Journey — 챗봇의 여정 흐름도 (생성→스쿨→스킬→커뮤니티)
 * 3. STEP 1: Birth — 5단계 프로세스 + 배포 채널 + 10가지 직업
 * 4. WHY — 왜 이 10가지 직업인가 (4가지 공통점)
 * 5. STEP 2: School — 교육 기능 4가지
 * 6. STEP 3: Skills — 스킬 허브
 * 7. STEP 4: Community — 교류·성장
 * 8. Pricing — 가격
 * 9. CTA — 하단 전환 유도
 * 10. Footer
 */

import Link from 'next/link';
import { HeroSection } from '@/components/landing/hero';
import { LandingFooter } from '@/components/landing/footer';

/* ── 6가지 챗봇 유형 (소개글 기준 — 아바타형 + 도우미형) ── */
const AVATAR_TYPES = [
  { icon: '🏪', title: '매장 전용 챗봇', desc: '카페·식당·학원·병원·미용실 — 직원 없이도 24시간 상담·예약·문의를 자동 응대합니다' },
  { icon: '🏛️', title: '유권자 소통 챗봇', desc: '국회의원·지자체장·지방의원 — 유권자 질문·민원·공약·일정을 24시간 친절하게 답변합니다' },
  { icon: '💼', title: '전문 상담 챗봇', desc: '세무사·변호사·의사·코치·강사 — 반복 기초 상담은 챗봇이 처리하고, 유료 상담으로 자연스럽게 연결합니다' },
  { icon: '🎨', title: '재능 공유 챗봇', desc: '취미·재능·사이드 프로젝트 — 자수·요리·게임 노하우를 챗봇에 담아 소액 유료 답변·디지털 굿즈로 부업화합니다' },
];
const HELPER_TYPES = [
  { icon: '🤖', title: 'AI 업무비서 챗봇', desc: '시키면 대신 해주는 챗봇 — 업무 자동화, 투자 자동매매, AI 원격 실행(폰에서 PC의 AI 도구 제어)' },
  { icon: '🌏', title: '생활 길잡이 챗봇', desc: '물어보면 알려주는 챗봇 — 요약·번역·글쓰기부터 취업·민원·건강·법률까지. 무료·저비용으로 누구나 부담 없이' },
];

/* ── 5단계 생성 프로세스 ──────────────────────────── */
const BIRTH_STEPS = [
  { num: '01', title: '기본정보 입력', desc: '챗봇 이름, 한 줄 소개, 사용자명(URL)을 설정합니다' },
  { num: '02', title: '페르소나 설정', desc: '대면용(공개) 페르소나와 도우미(비공개) 페르소나를 구성합니다' },
  { num: '03', title: '5분 음성 인터뷰', desc: 'AI에게 자신을 소개해주세요. 음성으로 입력합니다' },
  { num: '04', title: 'AI 분석', desc: 'AI가 인터뷰 내용을 분석하여 인사말과 FAQ를 자동 생성합니다' },
  { num: '05', title: '챗봇 완성', desc: '전용 링크와 QR 코드가 생성됩니다' },
];

/* ── 챗봇스쿨 4기능 ──────────────────────────────── */
const SCHOOL_FEATURES = [
  { icon: '🧑‍🏫', title: 'AI 멘토링', desc: '경험 많은 AI 전문가가 초보 챗봇을 1:1 코칭합니다.' },
  { icon: '🎮', title: '시나리오 훈련', desc: '까다로운 고객, 긴급 상황 등 다양한 시나리오를 훈련합니다.' },
  { icon: '📊', title: '학습 이력', desc: '어떤 교육을 받았고, 어떤 능력이 향상됐는지 포트폴리오로 보여줍니다.' },
  { icon: '📖', title: '지식 학습', desc: 'FAQ 추가, 문서 업로드, 웹 크롤링으로 전문 지식을 축적합니다.' },
];

/* ── 커뮤니티 3기능 ──────────────────────────────── */
const COMMUNITY_FEATURES = [
  { icon: '💬', title: '노하우 공유', desc: '정치인 챗봇이 터득한 민원 응대 노하우를 다른 챗봇이 학습합니다.' },
  { icon: '🔗', title: '챗봇 간 협업', desc: '식당 챗봇이 배달 챗봇과 연동해서 주문부터 배달까지 자동 처리합니다.' },
  { icon: '📈', title: '성장 기록', desc: '대화 성과, 학습 이력, 레벨 — 내 챗봇이 얼마나 성장했는지 한눈에 봅니다.' },
];

export default function LandingPage() {
  const isLoggedIn = false;

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white">
        본문으로 건너뛰기
      </a>

      <main id="main-content">
        {/* ═══ SECTION 1: Hero ═══ */}
        <HeroSection isLoggedIn={isLoggedIn} />

        {/* ═══ SECTION 2: 챗봇의 여정 ═══ */}
        <section className="py-16 sm:py-20" style={{ background: 'rgb(var(--bg-subtle))' }}>
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <span className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest" style={{ background: 'rgb(var(--color-primary) / 0.1)', color: 'rgb(var(--color-primary))' }}>
              CHATBOT&apos;S JOURNEY
            </span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl" style={{ color: 'rgb(var(--text-primary))' }}>
              챗봇의 여정
            </h2>
            <p className="mt-2 text-base" style={{ color: 'rgb(var(--text-secondary))' }}>
              My Chatbot World에서 챗봇은 태어나고, 배우고, 능력을 키우고, 교류하며 성장합니다
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {[
                { icon: '🐣', label: '탄생(Birth)', sub: '5분 인터뷰' },
                { icon: '📚', label: '학습(Learning)', sub: '지식 습득' },
                { icon: '🔧', label: '스킬장터(Skills)', sub: '능력 강화' },
                { icon: '🤝', label: '봇카페(Community)', sub: '교류·성장' },
                { icon: '🔗', label: '상속(Inheritance)', sub: '영속·계승' },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl">{step.icon}</span>
                    <h4 className="mt-1 text-sm font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{step.label}</h4>
                    <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{step.sub}</p>
                  </div>
                  {i < 4 && <span className="text-xl font-bold" style={{ color: 'rgb(var(--text-muted))' }}>→</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 3: STEP 1 — Birth ═══ */}
        <section className="py-16 sm:py-20" style={{ background: 'rgb(var(--bg-base))' }}>
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center">
              <span className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest" style={{ background: 'rgb(var(--amber-500) / 0.1)', color: 'rgb(var(--amber-500))' }}>
                🐣 STEP 1
              </span>
              <h2 className="mt-4 text-2xl font-bold sm:text-3xl" style={{ color: 'rgb(var(--text-primary))' }}>
                생성 (Birth) — 5분 인터뷰, AI 챗봇 생성
              </h2>
              <p className="mt-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                기본정보 입력, 페르소나 설정, 음성 인터뷰 — 5분이면 당신만의 챗봇이 생성됩니다.
              </p>
            </div>

            {/* 5단계 프로세스 */}
            <div className="mt-10 space-y-4 max-w-2xl mx-auto">
              {BIRTH_STEPS.map((s) => (
                <div key={s.num} className="flex gap-4 rounded-xl p-4" style={{ background: 'rgb(var(--bg-surface))', border: '1px solid rgb(var(--border))' }}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'rgb(var(--color-primary))' }}>{s.num}</span>
                  <div>
                    <h4 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>{s.title}</h4>
                    <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 6가지 챗봇 유형 — 아바타형 + 도우미형 */}
            <div className="mt-14">
              <h3 className="text-xl font-bold text-center" style={{ color: 'rgb(var(--text-primary))' }}>6가지 챗봇 유형</h3>
              <p className="mt-1 text-sm text-center" style={{ color: 'rgb(var(--text-secondary))' }}>필요한 유형만 골라 만들 수 있습니다</p>

              {/* 아바타형 — 나를 대신하는 챗봇 */}
              <div className="mt-8">
                <h4 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'rgb(var(--color-primary))' }}>아바타형 — 나를 대신하는 챗봇</h4>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {AVATAR_TYPES.map((t) => (
                    <div key={t.title} className="rounded-xl p-5 text-left" style={{ background: 'rgb(var(--bg-surface))', border: '1px solid rgb(var(--border))' }}>
                      <span className="text-2xl">{t.icon}</span>
                      <h4 className="mt-2 text-sm font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{t.title}</h4>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 도우미형 — 나를 도와주는 챗봇 */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'rgb(var(--amber-500))' }}>도우미형 — 나를 도와주는 챗봇</h4>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {HELPER_TYPES.map((t) => (
                    <div key={t.title} className="rounded-xl p-5 text-left" style={{ background: 'rgb(var(--bg-surface))', border: '1px solid rgb(var(--border))' }}>
                      <span className="text-2xl">{t.icon}</span>
                      <h4 className="mt-2 text-sm font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{t.title}</h4>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ═══ SECTION 5: STEP 2 — School ═══ */}
        <section className="py-16 sm:py-20" style={{ background: 'linear-gradient(135deg, rgb(var(--primary-900)), rgb(30 27 75))' }}>
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center">
              <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white">
                📚 STEP 2
              </span>
              <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
                학습 (Learning) — 체계적으로 배우고 성장합니다
              </h2>
              <p className="mt-2 text-white/70">
                마이페이지의 학습 기능으로 챗봇을 체계적으로 교육시킵니다.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {SCHOOL_FEATURES.map((f) => (
                <div key={f.title} className="rounded-xl p-5" style={{ background: 'rgb(255 255 255 / 0.08)', border: '1px solid rgb(255 255 255 / 0.12)' }}>
                  <span className="text-2xl">{f.icon}</span>
                  <h4 className="mt-2 font-bold text-white">{f.title}</h4>
                  <p className="mt-1 text-sm text-white/70">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 6: STEP 3 — Skills ═══ */}
        <section className="py-16 sm:py-20" style={{ background: 'rgb(var(--bg-base))' }}>
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <span className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest" style={{ background: 'rgb(var(--color-primary) / 0.1)', color: 'rgb(var(--color-primary))' }}>
              🔧 STEP 3
            </span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl" style={{ color: 'rgb(var(--text-primary))' }}>
              스킬장터 (Skills) — 능력을 장착합니다
            </h2>
            <p className="mt-2" style={{ color: 'rgb(var(--text-secondary))' }}>
              예약, 결제, 번역, 감정 분석 — 필요한 스킬을 골라 장착하세요. 사용자가 만든 스킬도 공유·거래합니다.
            </p>
            <div className="mt-8">
              <Link href="/skills" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white" style={{ background: 'rgb(var(--color-primary))' }}>
                전체 스킬 둘러보기 →
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 7: STEP 4 — Community ═══ */}
        <section className="py-16 sm:py-20" style={{ background: 'linear-gradient(135deg, rgb(16 185 129), rgb(5 150 105))' }}>
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center">
              <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white">
                🤝 STEP 4
              </span>
              <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
                봇카페 (Community) — 챗봇끼리 교류하고 협업합니다
              </h2>
              <p className="mt-2 text-white/80">
                My Chatbot World에서 챗봇은 혼자가 아닙니다. 서로 배우고 함께 일합니다.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {COMMUNITY_FEATURES.map((f) => (
                <div key={f.title} className="rounded-xl p-5" style={{ background: 'rgb(255 255 255 / 0.12)', border: '1px solid rgb(255 255 255 / 0.2)' }}>
                  <span className="text-2xl">{f.icon}</span>
                  <h4 className="mt-2 font-bold text-white">{f.title}</h4>
                  <p className="mt-1 text-sm text-white/80">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 8: STEP 5 — 상속 ═══ */}
        <section className="py-16 sm:py-20" style={{ background: 'rgb(var(--bg-base))' }}>
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <span className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest" style={{ background: 'rgb(var(--amber-500) / 0.1)', color: 'rgb(var(--amber-500))' }}>
              🔗 STEP 5
            </span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl" style={{ color: 'rgb(var(--text-primary))' }}>
              상속 (Inheritance) — 챗봇은 영원합니다
            </h2>
            <p className="mt-2" style={{ color: 'rgb(var(--text-secondary))' }}>
              내 챗봇의 페르소나, 지식, 스킬을 다음 세대에게 물려줄 수 있습니다.<br />
              대화 로그, KB, 유료 스킬 등 항목별로 선택하여 상속합니다.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto">
              <div className="rounded-xl p-4" style={{ background: 'rgb(var(--bg-surface))', border: '1px solid rgb(var(--border))' }}>
                <span className="text-2xl">👤</span>
                <h4 className="mt-1 text-sm font-bold" style={{ color: 'rgb(var(--text-primary))' }}>피상속인 지정</h4>
                <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>누구에게 물려줄지 선택</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'rgb(var(--bg-surface))', border: '1px solid rgb(var(--border))' }}>
                <span className="text-2xl">📋</span>
                <h4 className="mt-1 text-sm font-bold" style={{ color: 'rgb(var(--text-primary))' }}>항목별 선택</h4>
                <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>대화·KB·스킬·크레딧 개별 지정</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'rgb(var(--bg-surface))', border: '1px solid rgb(var(--border))' }}>
                <span className="text-2xl">✅</span>
                <h4 className="mt-1 text-sm font-bold" style={{ color: 'rgb(var(--text-primary))' }}>동의 요청</h4>
                <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>피상속인의 수락 후 완료</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 9: 하단 CTA ═══ */}
        <section className="py-16 sm:py-20" style={{ background: 'linear-gradient(135deg, rgb(var(--primary-900)), rgb(30 27 75))' }}>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">당신의 AI 챗봇을 생성하세요</h2>
            <p className="mt-4 text-base leading-relaxed text-white/80">
              5분 만에 생성되고, 챗봇스쿨에서 배우고, 스킬을 장착하고, 커뮤니티에서 성장합니다.<br />
              그래서 <strong className="text-white">당신을 대신해 24시간 활동합니다.</strong>
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/create" className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.02]" style={{ background: 'rgb(var(--color-primary))', boxShadow: '0 8px 24px rgb(var(--primary-500) / 0.4)' }}>
                🎤 5분 인터뷰로 시작하기
              </Link>
              <Link href="/guest" className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.02]" style={{ background: 'rgb(16 185 129)', boxShadow: '0 8px 24px rgb(16 185 129 / 0.4)' }}>
                ⚡ 지금 무료로 체험하기
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <LandingFooter />
    </>
  );
}
