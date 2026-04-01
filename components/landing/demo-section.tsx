/**
 * @task S2FE4 - Landing 페이지 React 전환
 * @component DemoSection
 * @description 데모 체험 섹션 — 인터랙티브 챗봇 미리보기
 *              실제 챗봇 연결 전 정적 UI Demo
 */
'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

/** 데모용 사전 정의 대화 스크립트 */
const DEMO_SCRIPT: { trigger: string; response: string }[] = [
  {
    trigger: '안녕',
    response: '안녕하세요! 저는 MCW 쇼핑 어시스턴트입니다. 원하시는 상품을 찾아드릴게요 😊',
  },
  {
    trigger: '추천',
    response: '물론이죠! 어떤 카테고리의 상품을 원하시나요? 패션, 전자기기, 뷰티 중 선택해 주세요.',
  },
  {
    trigger: '가격',
    response: '예산은 어느 정도 생각하고 계신가요? 예산에 맞는 최적의 상품을 추천해드릴게요.',
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'init-1',
    role: 'bot',
    text: '안녕하세요! My Chatbot World 데모 봇입니다. 아래에서 직접 채팅해보세요 👋',
  },
];

const DEMO_QUESTIONS = [
  '안녕하세요!',
  '상품 추천해줘',
  '가격은 얼마예요?',
];

/**
 * DemoSection
 * - id="demo" 앵커 (히어로 CTA 링크 대상)
 * - 좌: 설명 + 단계 목록 / 우: 인터랙티브 챗 UI
 */
export function DemoSection() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  /** 메시지 추가 후 스크롤 */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /** 봇 응답 생성 (데모 스크립트 매칭 or 기본 응답) */
  function getBotResponse(userText: string): string {
    const lower = userText.toLowerCase();
    const matched = DEMO_SCRIPT.find((s) =>
      lower.includes(s.trigger.toLowerCase()),
    );
    return (
      matched?.response ??
      '좋은 질문이에요! 실제 챗봇으로 전환하면 더 정확한 답변을 드릴 수 있습니다. 지금 바로 만들어보세요!'
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

    // 봇 응답 지연 (자연스러운 타이핑 효과)
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
    <section id="demo" className="bg-bg-subtle py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* 헤더 */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            라이브 데모
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            지금 바로 체험해보세요
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            아래 챗봇은 5분 만에 만들 수 있는 MCW 챗봇의 실제 예시입니다.
          </p>
        </div>

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-2">
          {/* 좌: 단계별 설명 */}
          <div className="order-2 lg:order-1">
            <ol className="relative space-y-8">
              {[
                {
                  step: '01',
                  title: '유형 선택',
                  desc: '6대 챗봇 유형 중 내 목적에 맞는 유형을 선택합니다. 고객 상담, 쇼핑 도우미, 수익형 등.',
                },
                {
                  step: '02',
                  title: '지식 입력',
                  desc: '내 제품 정보, FAQ, 문서를 업로드하거나 URL을 연결해 챗봇의 지식베이스를 구성합니다.',
                },
                {
                  step: '03',
                  title: '배포 & 공유',
                  desc: '위젯 코드 한 줄로 내 웹사이트에 삽입하거나, 링크로 바로 공유합니다.',
                },
              ].map((item, idx) => (
                <li key={item.step} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      {item.step}
                    </div>
                    {idx < 2 && (
                      <div className="mt-2 h-full w-px bg-border" />
                    )}
                  </div>
                  <div className="pb-8">
                    <h3 className="text-base font-semibold text-text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* 우: 인터랙티브 챗봇 */}
          <div className="order-1 lg:order-2">
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
              {/* 챗봇 헤더 */}
              <div className="flex items-center gap-3 border-b border-border bg-bg-subtle px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  AI
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    쇼핑 어시스턴트
                  </p>
                  <p className="text-xs text-success">온라인</p>
                </div>
              </div>

              {/* 메시지 영역 */}
              <div className="flex h-72 flex-col gap-3 overflow-y-auto p-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={[
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                        msg.role === 'user'
                          ? 'rounded-tr-none bg-primary text-white'
                          : 'rounded-tl-none bg-bg-muted text-text-primary',
                      ].join(' ')}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* 타이핑 인디케이터 */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-2xl rounded-tl-none bg-bg-muted px-4 py-3">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* 빠른 질문 버튼 */}
              <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
                {DEMO_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    disabled={isTyping}
                    className="rounded-full border border-border bg-bg-subtle px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-muted disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* 입력창 */}
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 border-t border-border px-4 py-3"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  disabled={isTyping}
                  className="flex-1 rounded-lg border border-border bg-bg-subtle px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
                  aria-label="전송"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
