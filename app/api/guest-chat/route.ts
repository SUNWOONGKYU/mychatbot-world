/**
 * @task S3BA2 — 게스트 채팅 API
 * @description POST /api/guest-chat — 인증 없이 AI 답변 반환
 *
 * 요청: { botId, message, history?, guestSessionId? }
 * 응답: { reply: string }
 *
 * - 인증 불필요 (공개 엔드포인트)
 * - mcw_bots + mcw_personas로 시스템 프롬프트 구성
 * - OpenRouter API 호출 (economy 티어)
 * - DB 저장 없음 (게스트 세션은 localStorage 전용)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limiter';

interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface GuestChatRequest {
  botId: string;
  message: string;
  history?: HistoryItem[];
  guestSessionId?: string;
}

// 카테고리별 기본 시스템 프롬프트
const CATEGORY_PROMPTS: Record<string, string> = {
  restaurant:  '당신은 음식점 AI 챗봇입니다. 메뉴, 예약, 영업시간, 위치 등을 친근하고 상세하게 안내하세요.',
  hospital:    '당신은 병원 AI 챗봇입니다. 진료 예약, 의사 일정, 진료 정보, 건강 문의를 전문적으로 안내하세요.',
  law_firm:    '당신은 법률 상담 AI 챗봇입니다. 계약서 검토, 법적 권리, 분쟁 해결 등을 전문적으로 안내하세요. 구체적인 법적 조언은 변호사 상담을 권유하세요.',
  real_estate: '당신은 부동산 AI 챗봇입니다. 매물 정보, 임대 상담, 시장 분석, 투자 조언을 친근하게 제공하세요.',
  education:   '당신은 학원 AI 챗봇입니다. 수강 등록, 수업 일정, 수강료, 커리큘럼 정보를 상세하게 안내하세요.',
  tech_startup:'당신은 업무 보조 AI 챗봇입니다. 문서 작성, 보고서 작성, 회의록, 이메일 초안 등을 도와드립니다.',
  healthcare:  '당신은 건강 상담 AI 챗봇입니다. 건강 생활 정보, 영양, 운동, 웰니스 팁을 친근하게 제공하세요. 의학적 진단은 의사에게 받으시도록 안내하세요.',
  finance:     '당신은 금융 안내 AI 챗봇입니다. 보험, 세금, 투자 기초, 저축 전략을 쉽게 설명하세요. 구체적 투자 결정은 전문가 상담을 권유하세요.',
};

function getSystemPrompt(category: string, botName: string, greeting: string): string {
  const base = CATEGORY_PROMPTS[category]
    ?? `당신은 ${botName} AI 챗봇입니다. 친근하고 도움이 되는 방식으로 답변하세요.`;
  return `${base}\n\n인삿말: "${greeting}"\n\n항상 한국어로 답변하고, 간결하면서도 충분한 정보를 제공하세요. 답변은 300자 이내로 유지하세요.`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate limiting: 시간당 30회 per IP (공개 AI 엔드포인트 보호 — S2AP5)
  const rl = rateLimit(req, { limit: 30, windowMs: 3_600_000 }, 'guest-chat');
  if (!rl.allowed) {
    return NextResponse.json(
      { reply: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

  let body: GuestChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ reply: '요청을 처리할 수 없습니다.' }, { status: 400 });
  }

  const { botId, message, history = [] } = body;

  if (!botId || !message?.trim()) {
    return NextResponse.json({ reply: '봇 ID와 메시지가 필요합니다.' }, { status: 400 });
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    return NextResponse.json({ reply: 'AI 서비스 설정 오류입니다.' }, { status: 500 });
  }

  // ── 봇 정보 로딩 ────────────────────────────────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let systemPrompt = `당신은 AI 챗봇입니다. 친근하고 도움이 되는 방식으로 한국어로 답변하세요.`;

  try {
    const { data: bot } = await supabase
      .from('mcw_bots')
      .select('bot_name, category, greeting, faqs')
      .eq('id', botId)
      .single();

    if (bot) {
      const greeting = bot.greeting ?? '안녕하세요! 무엇을 도와드릴까요?';
      systemPrompt = getSystemPrompt(bot.category ?? '', bot.bot_name ?? 'AI', greeting);

      // FAQ 컨텍스트 추가
      const faqs = Array.isArray(bot.faqs) ? bot.faqs.slice(0, 5) : [];
      if (faqs.length > 0) {
        const faqText = faqs
          .map((f: { question: string; answer: string }) => `Q: ${f.question}\nA: ${f.answer}`)
          .join('\n\n');
        systemPrompt += `\n\n[자주 묻는 질문]\n${faqText}`;
      }
    }
  } catch {
    // 봇 로딩 실패 시 기본 프롬프트 사용
  }

  // ── OpenRouter 호출 ──────────────────────────────────────────────────────────
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8), // 최근 8개 히스토리
    { role: 'user', content: message.trim() },
  ];

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://mychatbot.world',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[guest-chat] OpenRouter error:', errText.slice(0, 200));
      return NextResponse.json({ reply: '잠시 문제가 생겼어요. 다시 시도해 주세요.' });
    }

    const data = await res.json() as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content ?? '죄송해요, 답변을 생성하지 못했어요.';

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[guest-chat] fetch error:', err);
    return NextResponse.json({ reply: '네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' });
  }
}
