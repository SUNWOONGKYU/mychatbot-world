/**
 * @task S7FE6 — P1 리디자인: FAQ 관리 페이지
 * 기반: S7FE1 토큰 + S7FE4 PageToolbar + DataTable (FaqManager 컴포넌트 연계)
 * 변경: PageToolbar Breadcrumb 구조, Semantic 토큰 헤더, 전체 레이아웃 토큰화
 * 비즈니스 로직 보존: Supabase 인증, FAQ 목록 조회, FaqManager 렌더링 그대로 유지
 *
 * URL: /bot/faq?botId={id}
 */

import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { FaqManager } from '@/components/bot/faq-manager';
import type { FaqRecord } from '@/app/api/faq/route';

interface PageProps {
  searchParams: Promise<{ botId?: string }>;
}

export default async function FaqPage({ searchParams }: PageProps) {
  // ── 1. 인증 확인 ─────────────────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { redirect('/login'); }

  // ── 2. botId 파라미터 확인 ────────────────────────────────────
  const botId = (await searchParams).botId;

  if (!botId) {
    return (
      <main className="min-h-screen bg-surface-0 flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-3 bg-surface-2 border border-border-default rounded-xl p-8">
          <h1 className="text-lg font-semibold text-text-primary [word-break:keep-all]">
            잘못된 접근
          </h1>
          <p className="text-sm text-text-secondary [word-break:keep-all]">
            botId 파라미터가 누락되었습니다.
          </p>
          <a
            href="/dashboard"
            className="inline-block mt-2 text-sm text-text-link hover:underline underline-offset-4"
          >
            대시보드로 이동
          </a>
        </div>
      </main>
    );
  }

  // ── 3. 코코봇 정보 조회 ─────────────────────────────────────────
  const { data: chatbot } = await supabase
    .from('chatbots')
    .select('id, name, description')
    .eq('id', botId)
    .single();

  // ── 4. 초기 FAQ 목록 조회 ─────────────────────────────────────
  const { data: faqs } = await supabase
    .from('faqs')
    .select('*')
    .eq('chatbot_id', botId)
    .order('order_index', { ascending: true });

  const initialFaqs: FaqRecord[] = faqs ?? [];

  // ── 5. 렌더링 ─────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-surface-0">
      {/* PageToolbar 역할의 헤더 (서버 컴포넌트에서 직접 렌더) */}
      <div className="w-full bg-surface-2 border-b border-border-subtle">
        <div className="max-w-3xl mx-auto px-4 py-3 sm:px-6 sm:py-4">
          {/* Breadcrumb */}
          <nav aria-label="이동 경로" className="mb-1">
            <ol className="flex items-center flex-wrap text-sm text-text-secondary gap-0">
              <li className="flex items-center">
                <a href="/dashboard" className="text-text-link hover:underline underline-offset-4 transition-colors">
                  대시보드
                </a>
                <span className="mx-1.5 text-text-tertiary" aria-hidden="true">/</span>
              </li>
              {chatbot ? (
                <li className="flex items-center">
                  <a
                    href={`/bot?botId=${botId}`}
                    className="text-text-link hover:underline underline-offset-4 transition-colors [word-break:keep-all]"
                  >
                    {chatbot.name}
                  </a>
                  <span className="mx-1.5 text-text-tertiary" aria-hidden="true">/</span>
                </li>
              ) : (
                <li className="flex items-center">
                  <span className="text-text-secondary [word-break:keep-all]">코코봇</span>
                  <span className="mx-1.5 text-text-tertiary" aria-hidden="true">/</span>
                </li>
              )}
              <li>
                <span className="font-medium text-text-primary [word-break:keep-all]">
                  FAQ 관리
                </span>
              </li>
            </ol>
          </nav>

          {/* 제목 + 설명 */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-text-primary tracking-tight [word-break:keep-all]">
                FAQ 관리
              </h1>
              {chatbot && (
                <p className="text-sm text-text-secondary mt-0.5 [word-break:keep-all]">
                  <span className="font-medium text-text-primary">{chatbot.name}</span>의 자주 묻는 질문을 관리합니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ 관리 컴포넌트 */}
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
        <FaqManager
          botId={botId}
          initialFaqs={initialFaqs}
          botName={chatbot?.name ?? ''}
          botDescription={chatbot?.description ?? ''}
        />
      </div>
    </main>
  );
}
