/**
 * @task S2BA1
 * @description FAQ 자동생성 API — AI로 10개 FAQ 생성
 *
 * POST /api/create-bot/faq
 * Request: { name, description, businessType, tone, keywords }
 * Response: { faqs: Array<{ question, answer }> }
 *
 * - Supabase auth 인증 필수
 * - xsai generateText + OpenAI GPT-4o-mini 사용
 * - TypeScript strict 준수
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@xsai/generate-text';
import { createOpenAI } from '@xsai/providers';
import type { AnalyzeResult } from '../analyze/route';

/** FAQ 항목 */
export interface FaqItem {
  question: string;
  answer: string;
}

/** FAQ 생성 요청 바디 */
interface FaqRequest {
  name: string;
  description: string;
  businessType?: string;
  tone?: string;
  keywords?: string[];
}

/** FAQ 생성 응답 */
interface FaqResponse {
  success: boolean;
  data?: { faqs: FaqItem[] };
  error?: string;
}

/**
 * POST /api/create-bot/faq
 * 비즈니스 정보를 기반으로 AI가 10개의 FAQ를 자동 생성한다.
 */
export async function POST(request: NextRequest): Promise<NextResponse<FaqResponse>> {
  // ── 1. 인증 검증 ────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
  }

  // ── 2. 요청 파싱 및 유효성 검사 ────────────────────────────────────────────
  let body: FaqRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: '요청 바디를 파싱할 수 없습니다.' },
      { status: 400 }
    );
  }

  const { name, description, businessType = 'general', tone = 'friendly', keywords = [] } = body;

  if (!name?.trim() || !description?.trim()) {
    return NextResponse.json(
      { success: false, error: 'name과 description은 필수 항목입니다.' },
      { status: 400 }
    );
  }

  // ── 3. AI FAQ 생성 ──────────────────────────────────────────────────────────
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'AI 서비스 설정이 올바르지 않습니다.' },
      { status: 500 }
    );
  }

  const openai = createOpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' });

  const toneGuide: Record<string, string> = {
    friendly: '친근하고 따뜻한 말투로',
    professional: '전문적이고 격식 있는 말투로',
    casual: '편안하고 가벼운 말투로',
    authoritative: '권위 있고 신뢰감 있는 말투로',
    warm: '따뜻하고 공감 어린 말투로',
  };

  const toneDescription = toneGuide[tone] ?? '친근하고 자연스러운 말투로';
  const keywordContext = keywords.length > 0 ? `주요 키워드: ${keywords.join(', ')}` : '';

  const systemPrompt = `당신은 AI Assistant 코코봇의 FAQ를 작성하는 전문가입니다.
비즈니스 정보를 분석하여 고객이 가장 자주 묻는 질문 10개와 답변을 생성합니다.
${toneDescription} 작성하세요.

반드시 순수 JSON 배열로만 응답하세요. 다른 텍스트 없이.

응답 형식:
[
  { "question": "질문1", "answer": "답변1" },
  { "question": "질문2", "answer": "답변2" },
  ...
  { "question": "질문10", "answer": "답변10" }
]

규칙:
- 질문은 실제 고객이 궁금해할 만한 내용
- 답변은 구체적이고 유용한 정보 포함
- 질문 50자 이내, 답변 200자 이내
- 한국어로 작성
- 비즈니스 유형에 맞는 전문 용어 사용`;

  const userPrompt = `코코봇 이름: ${name}
비즈니스 설명: ${description}
비즈니스 유형: ${businessType}
${keywordContext}

위 비즈니스에 맞는 FAQ 10개를 생성해주세요.`;

  let faqs: FaqItem[] = [];

  try {
    const result = await generateText({
      ...openai.chat('openai/gpt-4o-mini'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    const rawText = result.text ?? '[]';

    // JSON 배열 파싱
    const parsed = JSON.parse(rawText) as Partial<FaqItem>[];

    if (!Array.isArray(parsed)) {
      throw new Error('AI 응답이 배열 형식이 아닙니다.');
    }

    // 유효한 FAQ 항목만 필터링 (최대 10개)
    faqs = parsed
      .filter(
        (item): item is FaqItem =>
          typeof item.question === 'string' &&
          item.question.trim().length > 0 &&
          typeof item.answer === 'string' &&
          item.answer.trim().length > 0
      )
      .slice(0, 10)
      .map((item: any) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      }));
  } catch (aiError) {
    console.error('[faq] AI FAQ 생성 오류:', aiError);
    // Graceful degradation — 기본 FAQ 반환
    faqs = [
      {
        question: `${name}은 어떤 서비스인가요?`,
        answer: description.slice(0, 200),
      },
      {
        question: '운영 시간이 어떻게 되나요?',
        answer: '평일 09:00~18:00 운영합니다. 자세한 사항은 문의해 주세요.',
      },
      {
        question: '어떻게 연락할 수 있나요?',
        answer: '이 코코봇을 통해 언제든지 문의해 주시면 빠르게 답변해 드리겠습니다.',
      },
    ];
  }

  // ── 4. 응답 반환 ────────────────────────────────────────────────────────────
  return NextResponse.json({
    success: true,
    data: { faqs },
  });
}
