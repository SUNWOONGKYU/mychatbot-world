/**
 * @task S2BA1
 * @description 챗봇 생성 메인 오케스트레이션 API
 *
 * POST /api/create-bot
 * Request: { name, description, audioUrl? }
 * Response: { botId, deployUrl, qrSvg, qrDataUrl, persona, faqs }
 *
 * 파이프라인:
 *   1. Supabase auth 인증 검증
 *   2. AI 분석 (비즈니스 유형·톤·키워드·인삿말 추출)
 *   3. FAQ 자동생성 (10개)
 *   4. mcw_bots INSERT (봇 등록)
 *   5. mcw_personas INSERT (페르소나 등록)
 *   6. 배포 URL + QR코드 발급
 *
 * - TypeScript strict 준수
 * - 환경변수에서만 키 참조
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { generateQR } from '@/lib/qr-generator';
import { generateText } from '@xsai/generate-text';
import { createOpenAI } from '@xsai/providers';

// ── 타입 정의 ─────────────────────────────────────────────────────────────────

/** 챗봇 생성 요청 바디 */
interface CreateBotRequest {
  /** 챗봇 이름 (필수, 1~100자) */
  name: string;
  /** 챗봇 설명 (필수, 1~2000자) */
  description: string;
  /** 오디오 파일 URL (선택 — TTS 음성 사전 녹음 파일) */
  audioUrl?: string;
}

/** FAQ 항목 */
interface FaqItem {
  question: string;
  answer: string;
}

/** AI 분석 결과 */
interface AnalyzeResult {
  businessType: string;
  tone: string;
  keywords: string[];
  suggestedEmoji: string;
  suggestedGreeting: string;
}

/** 최종 응답 데이터 */
interface CreateBotData {
  botId: string;
  deployUrl: string;
  qrSvg: string;
  qrDataUrl: string;
  faqs: FaqItem[];
  businessType: string;
  tone: string;
  greeting: string;
}

// ── 내부 헬퍼: AI 분석 ────────────────────────────────────────────────────────

/**
 * 챗봇 이름·설명을 AI로 분석하여 비즈니스 유형·톤·키워드를 추출한다.
 * @internal
 */
async function analyzeWithAI(
  apiKey: string,
  name: string,
  description: string
): Promise<AnalyzeResult> {
  const openai = createOpenAI({ apiKey });

  const systemPrompt = `당신은 비즈니스 분석 전문가입니다.
챗봇의 이름과 설명을 분석하여 JSON 형식으로만 응답하세요.
다른 텍스트나 마크다운 없이 순수 JSON만 반환하세요.

응답 형식:
{
  "businessType": "business category (영어 소문자, underscore 구분, 예: restaurant, law_firm, hospital, retail, education, real_estate, beauty, fitness, tech_startup, etc.)",
  "tone": "톤앤매너 (friendly | professional | casual | authoritative | warm 중 하나)",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "suggestedEmoji": "단일 이모지",
  "suggestedGreeting": "챗봇의 첫 인사말 (한국어, 50자 이내)"
}`;

  const result = await generateText({
    ...openai.chat('gpt-4o-mini'),
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `챗봇 이름: ${name}\n설명: ${description}\n\n위 정보를 분석하여 JSON으로 응답해주세요.`,
      },
    ],
    temperature: 0.3,
  });

  const parsed = JSON.parse(result.text ?? '{}') as Partial<AnalyzeResult>;

  return {
    businessType: parsed.businessType ?? 'general',
    tone: parsed.tone ?? 'friendly',
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
    suggestedEmoji: parsed.suggestedEmoji ?? '🤖',
    suggestedGreeting:
      parsed.suggestedGreeting ?? `안녕하세요! ${name} 챗봇입니다. 무엇을 도와드릴까요?`,
  };
}

// ── 내부 헬퍼: FAQ 생성 ───────────────────────────────────────────────────────

/**
 * 비즈니스 정보를 기반으로 AI가 FAQ 10개를 생성한다.
 * @internal
 */
async function generateFaqsWithAI(
  apiKey: string,
  name: string,
  description: string,
  analysis: AnalyzeResult
): Promise<FaqItem[]> {
  const openai = createOpenAI({ apiKey });

  const toneGuide: Record<string, string> = {
    friendly: '친근하고 따뜻한 말투로',
    professional: '전문적이고 격식 있는 말투로',
    casual: '편안하고 가벼운 말투로',
    authoritative: '권위 있고 신뢰감 있는 말투로',
    warm: '따뜻하고 공감 어린 말투로',
  };

  const toneDescription = toneGuide[analysis.tone] ?? '친근하고 자연스러운 말투로';
  const keywordContext =
    analysis.keywords.length > 0 ? `주요 키워드: ${analysis.keywords.join(', ')}` : '';

  const systemPrompt = `당신은 AI 챗봇의 FAQ를 작성하는 전문가입니다.
비즈니스 정보를 분석하여 고객이 자주 묻는 질문 10개와 답변을 생성합니다.
${toneDescription} 작성하세요.
반드시 순수 JSON 배열로만 응답하세요.

응답 형식:
[
  { "question": "질문", "answer": "답변" },
  ...
]

규칙:
- 질문 50자 이내, 답변 200자 이내
- 한국어로 작성
- 실제 고객이 궁금해할 만한 내용`;

  const result = await generateText({
    ...openai.chat('gpt-4o-mini'),
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `챗봇 이름: ${name}\n비즈니스 설명: ${description}\n비즈니스 유형: ${analysis.businessType}\n${keywordContext}\n\nFAQ 10개를 생성해주세요.`,
      },
    ],
    temperature: 0.7,
    maxTokens: 2000,
  });

  const parsed = JSON.parse(result.text ?? '[]') as Partial<FaqItem>[];

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter(
      (item): item is FaqItem =>
        typeof item.question === 'string' &&
        item.question.trim().length > 0 &&
        typeof item.answer === 'string' &&
        item.answer.trim().length > 0
    )
    .slice(0, 10)
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }));
}

// ── 유니크 ID 생성 헬퍼 ───────────────────────────────────────────────────────

/**
 * 봇 ID 생성: bot_{timestamp}_{random6}
 * @internal
 */
function generateBotId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `bot_${ts}_${rand}`;
}

/**
 * 슬러그 생성: 이름을 URL-safe 형식으로 변환
 * @internal
 */
function generateSlug(name: string, suffix: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 20);
  return `${base}-${suffix}`.replace(/^-/, '');
}

// ── 메인 라우트 핸들러 ────────────────────────────────────────────────────────

/**
 * POST /api/create-bot
 * 챗봇 생성 전체 파이프라인을 오케스트레이션한다.
 *
 * @example
 * // Request
 * POST /api/create-bot
 * { "name": "해피 레스토랑", "description": "한식 전문 레스토랑..." }
 *
 * // Response
 * { "success": true, "data": { "botId": "bot_xxx", "deployUrl": "...", "qrSvg": "..." } }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── Step 1: 인증 검증 ───────────────────────────────────────────────────────
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // ── Step 2: 요청 파싱 및 유효성 검사 ───────────────────────────────────────
  let body: CreateBotRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: '요청 바디를 파싱할 수 없습니다.' },
      { status: 400 }
    );
  }

  const { name, description, audioUrl } = body;

  if (!name?.trim()) {
    return NextResponse.json(
      { success: false, error: '챗봇 이름(name)은 필수 항목입니다.' },
      { status: 400 }
    );
  }

  if (!description?.trim()) {
    return NextResponse.json(
      { success: false, error: '챗봇 설명(description)은 필수 항목입니다.' },
      { status: 400 }
    );
  }

  if (name.length > 100) {
    return NextResponse.json(
      { success: false, error: 'name은 100자 이내여야 합니다.' },
      { status: 400 }
    );
  }

  if (description.length > 2000) {
    return NextResponse.json(
      { success: false, error: 'description은 2000자 이내여야 합니다.' },
      { status: 400 }
    );
  }

  // OpenAI API 키 검증
  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (!openAiApiKey) {
    return NextResponse.json(
      { success: false, error: 'AI 서비스 설정이 올바르지 않습니다.' },
      { status: 500 }
    );
  }

  // ── Step 3: AI 분석 ─────────────────────────────────────────────────────────
  let analysis: AnalyzeResult;
  try {
    analysis = await analyzeWithAI(openAiApiKey, name.trim(), description.trim());
  } catch (analyzeError) {
    console.error('[create-bot] AI 분석 오류:', analyzeError);
    // 분석 실패 시 기본값으로 진행
    analysis = {
      businessType: 'general',
      tone: 'friendly',
      keywords: [],
      suggestedEmoji: '🤖',
      suggestedGreeting: `안녕하세요! ${name} 챗봇입니다. 무엇을 도와드릴까요?`,
    };
  }

  // ── Step 4: FAQ 자동생성 ────────────────────────────────────────────────────
  let faqs: FaqItem[] = [];
  try {
    faqs = await generateFaqsWithAI(openAiApiKey, name.trim(), description.trim(), analysis);
  } catch (faqError) {
    console.error('[create-bot] FAQ 생성 오류:', faqError);
    // FAQ 실패해도 계속 진행
  }

  // ── Step 5: mcw_bots INSERT ─────────────────────────────────────────────────
  const botId = generateBotId();
  const idSuffix = botId.split('_').pop() ?? 'xxx';
  const username = generateSlug(name.trim(), idSuffix);

  const botInsertData = {
    id: botId,
    username,
    owner_id: userId,
    bot_name: name.trim(),
    bot_desc: description.trim(),
    emoji: analysis.suggestedEmoji,
    greeting: analysis.suggestedGreeting,
    faqs: faqs,
    input_text: description.trim(),
    category: analysis.businessType,
  };

  const { error: botInsertError } = await supabase.from('mcw_bots').insert(botInsertData);

  if (botInsertError) {
    console.error('[create-bot] Bot INSERT 오류:', botInsertError);
    return NextResponse.json(
      {
        success: false,
        error: `챗봇 등록에 실패했습니다: ${botInsertError.message}`,
      },
      { status: 500 }
    );
  }

  // ── Step 6: mcw_personas INSERT ─────────────────────────────────────────────
  const personaInsertData = {
    id: `persona_${botId}`,
    bot_id: botId,
    name: name.trim(),
    role: analysis.businessType,
    category: 'avatar',
    model: 'logic',
    iq_eq: 70,
    is_visible: true,
    is_public: true,
    greeting: analysis.suggestedGreeting,
    faqs: faqs,
  };

  const { error: personaInsertError } = await supabase
    .from('mcw_personas')
    .insert(personaInsertData);

  if (personaInsertError) {
    // 페르소나 실패는 경고 처리 (봇은 이미 등록됨)
    console.warn('[create-bot] Persona INSERT 경고:', personaInsertError);
  }

  // audioUrl이 있으면 mcw_bots에 voice 정보 업데이트
  if (audioUrl) {
    const { error: voiceUpdateError } = await supabase
      .from('mcw_bots')
      .update({ input_text: audioUrl })
      .eq('id', botId);

    if (voiceUpdateError) {
      console.warn('[create-bot] 오디오 URL 업데이트 경고:', voiceUpdateError);
    }
  }

  // ── Step 7: 배포 URL + QR코드 발급 ─────────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mychatbot.world';
  const deployUrl = `${baseUrl}/bot/${username}`;

  let qrSvg = '';
  let qrDataUrl = '';

  try {
    const qrResult = await generateQR(deployUrl, {
      size: 300,
      margin: 4,
      errorCorrectionLevel: 'M',
      darkColor: '#1a1a2e',
      lightColor: '#ffffff',
    });
    qrSvg = qrResult.svg;
    qrDataUrl = qrResult.dataUrl;
  } catch (qrError) {
    console.error('[create-bot] QR 생성 오류:', qrError);
    // QR 실패해도 URL 반환
  }

  // ── Step 8: 최종 응답 ───────────────────────────────────────────────────────
  const responseData: CreateBotData = {
    botId,
    deployUrl,
    qrSvg,
    qrDataUrl,
    faqs,
    businessType: analysis.businessType,
    tone: analysis.tone,
    greeting: analysis.suggestedGreeting,
  };

  return NextResponse.json({
    success: true,
    data: responseData,
  });
}
