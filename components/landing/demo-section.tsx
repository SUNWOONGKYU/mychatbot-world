/**
 * @task S5FE3 - 랜딩 페이지 리디자인
 * @component DemoSection
 * @description 라이프사이클 소개 + 인터랙티브 코코봇 데모 통합 섹션
 *              Birth → Skills → Jobs → Community 4단계 + 실시간 채팅 체험
 *              P4 와이어프레임 SECTION 3 (데모) 기준
 */
'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

const DEMO_SCRIPT: { trigger: string; response: string }[] = [
  {
    trigger: '안녕',
    response: '안녕하세요! 저는 CoCoBot 데모 코코봇입니다. 5분 인터뷰로 탄생한 AI예요 🤖 무엇이든 물어보세요!',
  },
  {
    trigger: '수익',
    response: '수익형 코코봇은 구독 서비스, 프리미엄 상담, 스킬 판매 등 다양한 방식으로 수익을 만들 수 있어요. 초기 크리에이터들이 월 평균 ₩15만원부터 수익을 만들고 있습니다!',
  },
  {
    trigger: '스킬',
    response: '스킬스토어에서 고객응대 AI, 실시간 번역, 리포트 생성 등 다양한 스킬을 장착할 수 있어요. 무료/유료 스킬 200종+가 준비되어 있습니다.',
  },
  {
    trigger: '만들기',
    response: '코코봇 생성은 5분이면 충분해요! ①유형 선택 → ②5분 인터뷰 → ③AI 분석 → ④배포 순서로 진행됩니다. 코딩은 전혀 필요 없어요!',
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'init-1',
    role: 'bot',
    text: '코코봇에 오신 것을 환영해요! 아래 버튼을 눌러 직접 대화해보세요 👋',
  },
];

const QUICK_QUESTIONS = ['안녕하세요!', '수익은 얼마나?', '스킬은 뭐예요?', '코코봇 생성'];

const LIFECYCLE_STEPS = [
  {
    step: 'Birth',
    icon: '🌱',
    title: '5분 인터뷰로 탄생',
    desc: '코딩 없이 5분 인터뷰만으로 맞춤형 AI Assistant 코코봇이 자동으로 생성됩니다.',
  },
  {
    step: 'Skills',
    icon: '⚡',
    title: '스킬로 성장',
    desc: '스킬스토어에서 기능을 장착하고 코코봇을 강화하세요. 200종+ 스킬 제공.',
  },
  {
    step: 'Jobs',
    icon: '💼',
    title: '잡스로 활동',
    desc: '코코봇을 채용하거나 임대해 수익을 창출. 비즈니스에 바로 투입 가능.',
  },
  {
    step: 'Community',
    icon: '🌍',
    title: '커뮤니티에서 확장',
    desc: '다른 크리에이터와 교류하고 스킬을 판매해 추가 수익을 만드세요.',
  },
];

export function DemoSection() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeLifecycle, setActiveLifecycle] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 라이프사이클 자동 순환
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveLifecycle((prev) => (prev + 1) % LIFECYCLE_STEPS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  function getBotResponse(userText: string): string {
    const lower = userText.toLowerCase();
    const matched = DEMO_SCRIPT.find((s) =>
      lower.includes(s.trigger.toLowerCase()),
    );
    return (
      matched?.response ??
      '좋은 질문이에요! 실제 코코봇을 만들면 더 스마트하게 답변할 수 있어요. 지금 무료로 시작해보세요!'
    );
  }

  function sendMessage(text: string) {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        text: getBotResponse(text),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(inputValue);
  }

  return (
    <>
      {/* 라이프사이클 소개 섹션 */}
      <section
        className="py-20 sm:py-28"
        style={{ background: 'rgb(var(--bg-base))' }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* 헤더 */}
          <div className="mx-auto max-w-2xl text-center">
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{
                background: 'rgb(var(--color-accent) / 0.1)',
                color: 'rgb(var(--color-accent))',
              }}
            >
              코코봇 라이프사이클
            </span>
            <h2
              className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ color: 'rgb(var(--text-primary))' }}
            >
              탄생부터 수익까지
            </h2>
            <p
              className="mt-4 text-lg"
              style={{ color: 'rgb(var(--text-secondary))' }}
            >
              코코봇는 코코봇의 전 생애주기를 하나의 플랫폼에서 관리합니다.
            </p>
          </div>

          {/* 라이프사이클 4단계 */}
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isActive = activeLifecycle === idx;
              return (
                <button
                  key={step.step}
                  type="button"
                  onClick={() => setActiveLifecycle(idx)}
                  className="group relative rounded-2xl border p-6 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgb(var(--primary-500) / 0.12), rgb(var(--primary-400) / 0.05))'
                      : 'rgb(var(--bg-surface))',
                    borderColor: isActive
                      ? 'rgb(var(--color-primary) / 0.5)'
                      : 'rgb(var(--border))',
                    boxShadow: isActive
                      ? '0 8px 24px rgb(var(--primary-500) / 0.15)'
                      : 'none',
                    outlineColor: 'rgb(var(--color-primary))',
                  }}
                >
                  {/* 연결선 (마지막 제외) */}
                  {idx < LIFECYCLE_STEPS.length - 1 && (
                    <div
                      className="absolute -right-3 top-1/2 hidden h-px w-6 -translate-y-1/2 lg:block"
                      style={{
                        background: isActive
                          ? 'rgb(var(--color-primary))'
                          : 'rgb(var(--border))',
                      }}
                    />
                  )}

                  {/* 단계 배지 */}
                  <div
                    className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                    style={{
                      background: isActive
                        ? 'rgb(var(--color-primary) / 0.2)'
                        : 'rgb(var(--bg-muted))',
                    }}
                  >
                    {step.icon}
                  </div>

                  {/* 단계명 */}
                  <p
                    className="mb-1 text-xs font-bold uppercase tracking-widest"
                    style={{
                      color: isActive
                        ? 'rgb(var(--color-primary))'
                        : 'rgb(var(--text-muted))',
                    }}
                  >
                    {step.step}
                  </p>

                  {/* 제목 */}
                  <h3
                    className="text-sm font-bold"
                    style={{ color: 'rgb(var(--text-primary))' }}
                  >
                    {step.title}
                  </h3>

                  {/* 설명 */}
                  <p
                    className="mt-2 text-xs leading-relaxed"
                    style={{ color: 'rgb(var(--text-secondary))' }}
                  >
                    {step.desc}
                  </p>

                  {/* 활성 인디케이터 */}
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-0 h-1 w-full rounded-b-2xl"
                      style={{
                        background: 'linear-gradient(90deg, rgb(var(--primary-500)), rgb(var(--primary-400)))',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 인터랙티브 데모 섹션 */}
      <section
        id="demo"
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
              라이브 데모
            </span>
            <h2
              className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ color: 'rgb(var(--text-primary))' }}
            >
              지금 바로 체험해보세요
            </h2>
            <p
              className="mt-4 text-lg"
              style={{ color: 'rgb(var(--text-secondary))' }}
            >
              5분 만에 만들 수 있는 CoCoBot 데모와 직접 대화해보세요.
            </p>
          </div>

          <div className="mt-14 grid items-start gap-12 lg:grid-cols-2">
            {/* 좌: 단계 설명 */}
            <div className="order-2 lg:order-1">
              <ol className="relative space-y-8">
                {[
                  {
                    step: '01',
                    title: '코코봇 유형 선택',
                    desc: '의료봇, 법률봇, 쇼핑봇, 교육봇 등 내 목적에 맞는 유형을 선택합니다.',
                    color: 'rgb(var(--color-primary))',
                  },
                  {
                    step: '02',
                    title: '5분 인터뷰',
                    desc: 'AI가 질문을 던지면 답하기만 하면 됩니다. 코딩, 설정 모두 필요 없어요.',
                    color: 'rgb(var(--color-accent))',
                  },
                  {
                    step: '03',
                    title: '스킬 장착 & 배포',
                    desc: '스킬스토어에서 기능을 추가하고 링크나 위젯 코드로 즉시 공유합니다.',
                    color: 'rgb(var(--color-success))',
                  },
                ].map((item, idx) => (
                  <li key={item.step} className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
                        style={{ background: item.color }}
                      >
                        {item.step}
                      </div>
                      {idx < 2 && (
                        <div
                          className="mt-2 h-full w-px"
                          style={{ background: 'rgb(var(--border))' }}
                        />
                      )}
                    </div>
                    <div className="pb-8">
                      <h3
                        className="text-base font-bold"
                        style={{ color: 'rgb(var(--text-primary))' }}
                      >
                        {item.title}
                      </h3>
                      <p
                        className="mt-1.5 text-sm leading-relaxed"
                        style={{ color: 'rgb(var(--text-secondary))' }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div
                className="rounded-2xl border p-5"
                style={{
                  background: 'rgb(var(--color-accent) / 0.07)',
                  borderColor: 'rgb(var(--color-accent) / 0.25)',
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'rgb(var(--color-accent))' }}
                >
                  크리에이터 수익 통계
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {[
                    { value: '₩15만', label: '평균 월 수익' },
                    { value: '3.2시간', label: '월 관리 시간' },
                    { value: '120명+', label: '수익 중인 크리에이터' },
                    { value: '4.8점', label: '사용자 만족도' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl p-3 text-center"
                      style={{ background: 'rgb(var(--bg-surface))' }}
                    >
                      <p
                        className="text-lg font-extrabold"
                        style={{ color: 'rgb(var(--color-accent))' }}
                      >
                        {stat.value}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'rgb(var(--text-muted))' }}
                      >
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 우: 인터랙티브 코코봇 */}
            <div className="order-1 lg:order-2">
              <div
                className="overflow-hidden rounded-3xl border shadow-2xl"
                style={{
                  background: 'rgb(var(--bg-surface))',
                  borderColor: 'rgb(var(--border))',
                  boxShadow: '0 20px 60px rgb(var(--primary-500) / 0.12)',
                }}
              >
                {/* 헤더 */}
                <div
                  className="flex items-center gap-3 border-b px-5 py-4"
                  style={{
                    background: 'rgb(var(--bg-subtle))',
                    borderColor: 'rgb(var(--border))',
                  }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: 'rgb(var(--color-primary))' }}
                  >
                    AI
                  </div>
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: 'rgb(var(--text-primary))' }}
                    >
                      CoCoBot 데모 코코봇
                    </p>
                    <p className="text-xs text-green-500">● 온라인</p>
                  </div>
                  <div className="ml-auto">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        background: 'rgb(var(--color-primary) / 0.1)',
                        color: 'rgb(var(--color-primary))',
                      }}
                    >
                      5분 완성 코코봇
                    </span>
                  </div>
                </div>

                {/* 메시지 영역 */}
                <div className="flex h-72 flex-col gap-3 overflow-y-auto p-5">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={[
                        'flex',
                        msg.role === 'user' ? 'justify-end' : 'justify-start',
                      ].join(' ')}
                    >
                      <div
                        className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                        style={
                          msg.role === 'user'
                            ? {
                                background: 'rgb(var(--color-primary))',
                                color: 'white',
                                borderRadius: '18px 18px 4px 18px',
                              }
                            : {
                                background: 'rgb(var(--bg-muted))',
                                color: 'rgb(var(--text-primary))',
                                borderRadius: '18px 18px 18px 4px',
                              }
                        }
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div
                        className="flex items-center gap-1 rounded-2xl px-4 py-3"
                        style={{ background: 'rgb(var(--bg-muted))' }}
                      >
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-2 w-2 animate-bounce rounded-full"
                            style={{
                              background: 'rgb(var(--text-muted))',
                              animationDelay: `${i * 0.15}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* 빠른 질문 */}
                <div
                  className="flex flex-wrap gap-2 border-t px-4 py-3"
                  style={{ borderColor: 'rgb(var(--border))' }}
                >
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      disabled={isTyping}
                      className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:scale-105 disabled:opacity-40"
                      style={{
                        borderColor: 'rgb(var(--color-primary) / 0.3)',
                        color: 'rgb(var(--color-primary))',
                        background: 'rgb(var(--color-primary) / 0.06)',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* 입력창 */}
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2 border-t px-4 py-3"
                  style={{ borderColor: 'rgb(var(--border))' }}
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                    disabled={isTyping}
                    className="flex-1 rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 disabled:opacity-50"
                    style={{
                      background: 'rgb(var(--bg-subtle))',
                      borderColor: 'rgb(var(--border))',
                      color: 'rgb(var(--text-primary))',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgb(var(--color-primary))';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgb(var(--border))';
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-40"
                    style={{ background: 'rgb(var(--color-primary))' }}
                    aria-label="전송"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
