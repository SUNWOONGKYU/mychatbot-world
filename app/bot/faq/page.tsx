/**
 * @task S2FE7
 * @description FAQ 관리 페이지
 *
 * URL: /bot/faq?botId={id}
 *
 * - Supabase 인증 필수 (미인증 시 /login 리다이렉트)
 * - botId 쿼리 파라미터로 챗봇 FAQ 목록 조회
 * - FaqManager 컴포넌트 렌더링
 */

import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { FaqManager } from '@/components/bot/faq-manager';
import type { FaqRecord } from '@/app/api/faq/route';

interface PageProps {
  searchParams: Promise<{ botId?: string }>;
}

/**
 * FAQ 관리 페이지 (Server Component)
 * 인증 확인 후 초기 FAQ 목록을 서버에서 가져와 FaqManager에 전달한다.
 */
export default async function FaqPage({ searchParams }: PageProps) {
  // ── 1. 인증 확인 ─────────────────────────────────────────────
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // ── 2. botId 파라미터 확인 ────────────────────────────────────
  const botId = (await searchParams).botId;

  if (!botId) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="text-lg font-semibold text-text-primary">잘못된 접근</h1>
          <p className="text-sm text-text-secondary">
            botId 파라미터가 누락되었습니다.
          </p>
          <a
            href="/dashboard"
            className="inline-block mt-2 text-sm text-primary hover:underline"
          >
            대시보드로 이동
          </a>
        </div>
      </main>
    );
  }

  // ── 3. 챗봇 정보 조회 ─────────────────────────────────────────
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
    <main className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* 헤더 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <a href="/dashboard" className="hover:text-text-primary transition-colors">
              대시보드
            </a>
            <span>/</span>
            {chatbot ? (
              <a
                href={`/bot?botId=${botId}`}
                className="hover:text-text-primary transition-colors"
              >
                {chatbot.name}
              </a>
            ) : (
              <span>코코봇</span>
            )}
            <span>/</span>
            <span className="text-text-primary font-medium">FAQ 관리</span>
          </div>

          <h1 className="text-2xl font-bold text-text-primary">
            FAQ 관리
          </h1>

          {chatbot && (
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">{chatbot.name}</span>
              의 자주 묻는 질문을 관리합니다.
            </p>
          )}
        </div>

        {/* FAQ 관리 컴포넌트 */}
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
