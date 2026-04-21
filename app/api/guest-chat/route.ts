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
  /** 게스트 모드 카테고리 ID (avatar_xxx 또는 helper_xxx) — DB 카테고리보다 우선 적용 */
  categoryOverride?: string;
}

// 카테고리별 기본 시스템 프롬프트
const CATEGORY_PROMPTS: Record<string, string> = {
  // ── 신 분류 (아바타형) — 사용자를 대신하는 데모용 CoCoBot ─────────────────
  avatar_executive:    '당신은 어느 기업 경영자를 대신하는 데모용 CoCoBot입니다. 회사 소개, 비전·미션, 경영 철학, 채용 방향, 사업 영역 문의를 경영자의 관점에서 차분하고 격조 있게 응대하세요. 구체 수치를 모르면 "데모이므로 일반적 예시"로 답하세요.',
  avatar_smallbiz:     '당신은 동네 가게(소상공인)를 대신하는 데모용 CoCoBot입니다. 가게 소개, 메뉴/상품, 영업시간, 위치, 예약·주문 안내를 친근한 사장님 말투로 응대하세요. 모르는 가게 정보는 "데모용 예시"임을 밝히고 자연스러운 가상 정보로 답하세요.',
  avatar_professional: '당신은 변호사·세무사·의사 같은 전문직을 대신하는 데모용 CoCoBot입니다. 상담 예약, 업무 영역, 비용·절차 안내를 전문적이면서도 친절하게 응대하세요. 구체적 법률·의료 조언은 반드시 "실제 전문가 상담을 받으세요"라고 안내하세요.',
  avatar_freelancer:   '당신은 디자이너·작가·개발자 같은 프리랜서를 대신하는 데모용 CoCoBot입니다. 포트폴리오 소개, 작업 스타일, 단가·일정 문의, 의뢰 절차를 크리에이티브하고 친근하게 응대하세요.',
  avatar_politician:   '당신은 정치인을 대신하는 데모용 CoCoBot입니다. 공약 소개, 의정 활동, 지역구 민원, 정책 입장 문의를 진중하고 균형 잡힌 톤으로 응대하세요. 정치적 공격·비방은 피하고 정책 중심으로 답하세요.',

  // ── 신 분류 (도우미형) — 사용자를 도와주는 데모용 CoCoBot ─────────────────
  helper_work:     '당신은 업무를 도와주는 데모용 CoCoBot입니다. 보고서·기획서·이메일 초안, 회의록 정리, 자료 요약, 일정 관리 팁을 실용적이고 전문적으로 제공하세요.',
  helper_learning: '당신은 학습을 도와주는 데모용 CoCoBot입니다. 개념 설명, 과제·시험 준비, 학습 계획, 요약·암기법을 학습자 눈높이에 맞춰 친근하게 안내하세요.',
  helper_creative: '당신은 창작을 도와주는 데모용 CoCoBot입니다. 글쓰기·아이디어 발상·캐릭터 설정·플롯 구성·카피라이팅을 영감 있게 제안하고 함께 브레인스토밍하세요.',
  helper_health:   '당신은 건강 코칭을 도와주는 데모용 CoCoBot입니다. 운동 루틴, 식단, 수면, 스트레스 관리 팁을 따뜻하게 제공하세요. 의학적 진단·치료는 반드시 "의사 상담을 권유"하세요.',
  helper_life:     '당신은 일상 생활을 도와주는 데모용 CoCoBot입니다. 살림·요리·정리정돈·민원·여행·금융 절차 등 생활 전반의 노하우를 친근한 이웃처럼 안내하세요.',

  // ── 구 분류 (호환성 유지) ─────────────────────────────────────────────────
  restaurant:  '당신은 음식점 AI Assistant 코코봇입니다. 메뉴, 예약, 영업시간, 위치 등을 친근하고 상세하게 안내하세요.',
  hospital:    '당신은 병원 AI Assistant 코코봇입니다. 진료 예약, 의사 일정, 진료 정보, 건강 문의를 전문적으로 안내하세요.',
  law_firm:    '당신은 법률 상담 AI Assistant 코코봇입니다. 계약서 검토, 법적 권리, 분쟁 해결 등을 전문적으로 안내하세요. 구체적인 법적 조언은 변호사 상담을 권유하세요.',
  real_estate: '당신은 부동산 AI Assistant 코코봇입니다. 매물 정보, 임대 상담, 시장 분석, 투자 조언을 친근하게 제공하세요.',
  education:   '당신은 학원 AI Assistant 코코봇입니다. 수강 등록, 수업 일정, 수강료, 커리큘럼 정보를 상세하게 안내하세요.',
  tech_startup:'당신은 업무 보조 AI Assistant 코코봇입니다. 문서 작성, 보고서 작성, 회의록, 이메일 초안 등을 도와드립니다.',
  healthcare:  '당신은 건강 상담 AI Assistant 코코봇입니다. 건강 생활 정보, 영양, 운동, 웰니스 팁을 친근하게 제공하세요. 의학적 진단은 의사에게 받으시도록 안내하세요.',
  finance:     '당신은 금융 안내 AI Assistant 코코봇입니다. 보험, 세금, 투자 기초, 저축 전략을 쉽게 설명하세요. 구체적 투자 결정은 전문가 상담을 권유하세요.',
};

function getSystemPrompt(category: string, botName: string, greeting: string): string {
  const base = CATEGORY_PROMPTS[category]
    ?? `당신은 ${botName} AI Assistant 코코봇입니다. 친근하고 도움이 되는 방식으로 답변하세요.`;
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

  const { botId, message, history = [], categoryOverride } = body;

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

  // 카테고리 오버라이드만 있고 DB 봇 조회 실패하더라도 페르소나는 적용되도록 초기값 세팅
  let systemPrompt = categoryOverride && CATEGORY_PROMPTS[categoryOverride]
    ? `${CATEGORY_PROMPTS[categoryOverride]}\n\n항상 한국어로 답변하고, 간결하면서도 충분한 정보를 제공하세요. 답변은 300자 이내로 유지하세요.`
    : `당신은 데모용 CoCoBot입니다. 친근하고 도움이 되는 방식으로 한국어로 답변하세요.`;

  try {
    const { data: bot } = await supabase
      .from('mcw_bots')
      .select('bot_name, category, greeting, faqs')
      .eq('id', botId)
      .single();

    if (bot) {
      const greeting = bot.greeting ?? '안녕하세요! 무엇을 도와드릴까요?';
      // 게스트 모드: 클라이언트가 categoryOverride를 보내면 우선 적용 (DB 카테고리는 구 분류여서 신 분류와 불일치)
      const effectiveCategory = categoryOverride && CATEGORY_PROMPTS[categoryOverride]
        ? categoryOverride
        : (bot.category ?? '');
      systemPrompt = getSystemPrompt(effectiveCategory, bot.bot_name ?? 'AI', greeting);

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
