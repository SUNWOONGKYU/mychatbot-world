/**
 * @task S2BA1
 * @description AI 분석 API — 비즈니스 유형·톤앤매너 추출
 *
 * POST /api/create-bot/analyze
 * Request: { name: string, description: string }
 * Response: { businessType, tone, keywords, suggestedEmoji, suggestedGreeting }
 *
 * - Supabase auth 인증 필수
 * - xsai generateText + OpenAI GPT-4o-mini 사용
 * - TypeScript strict 준수
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@xsai/generate-text';
import { createOpenAI } from '@xsai/providers';

/** 분석 요청 바디 */
interface AnalyzeRequest {
  name: string;
  description: string;
}

/** 분석 결과 */
export interface AnalyzeResult {
  /** 비즈니스 유형 (예: restaurant, hospital, law_firm, retail, education, etc.) */
  businessType: string;
  /** 톤앤매너 (예: friendly, professional, casual, authoritative) */
  tone: string;
  /** 핵심 키워드 목록 (3~5개) */
  keywords: string[];
  /** 추천 이모지 */
  suggestedEmoji: string;
  /** 추천 인삿말 */
  suggestedGreeting: string;
}

/**
 * POST /api/create-bot/analyze
 * 코코봇 이름과 설명을 AI로 분석하여 비즈니스 유형·톤앤매너를 추출한다.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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
  let body: AnalyzeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: '요청 바디를 파싱할 수 없습니다.' },
      { status: 400 }
    );
  }

  const { name, description } = body;

  if (!name?.trim() || !description?.trim()) {
    return NextResponse.json(
      { success: false, error: 'name과 description은 필수 항목입니다.' },
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

  // ── 3. AI 분석 ─────────────────────────────────────────────────────────────
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'AI 서비스 설정이 올바르지 않습니다.' },
      { status: 500 }
    );
  }

  const openai = createOpenAI({ apiKey });

  const systemPrompt = `당신은 비즈니스 분석 전문가입니다.
코코봇의 이름과 설명을 분석하여 JSON 형식으로만 응답하세요.
다른 텍스트나 마크다운 없이 순수 JSON만 반환하세요.

응답 형식:
{
  "businessType": "business category (영어 소문자, underscore 구분, 예: restaurant, law_firm, hospital, retail, education, real_estate, beauty, fitness, tech_startup, etc.)",
  "tone": "톤앤매너 (friendly | professional | casual | authoritative | warm 중 하나)",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "suggestedEmoji": "단일 이모지",
  "suggestedGreeting": "코코봇의 첫 인사말 (한국어, 50자 이내)"
}`;

  const userPrompt = `코코봇 이름: ${name}
설명: ${description}

위 정보를 분석하여 JSON으로 응답해주세요.`;

  let analysisResult: AnalyzeResult;

  try {
    const result = await generateText({
      ...openai.chat('gpt-4o-mini'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    const rawText = result.text ?? '';

    // JSON 파싱
    const parsed = JSON.parse(rawText) as Partial<AnalyzeResult>;

    // 필수 필드 유효성 검사
    analysisResult = {
      businessType: parsed.businessType ?? 'general',
      tone: parsed.tone ?? 'friendly',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
      suggestedEmoji: parsed.suggestedEmoji ?? '🤖',
      suggestedGreeting:
        parsed.suggestedGreeting ?? `안녕하세요! ${name} 코코봇입니다. 무엇을 도와드릴까요?`,
    };
  } catch (aiError) {
    console.error('[analyze] AI 분석 오류:', aiError);
    // AI 실패 시 기본값 반환 (graceful degradation)
    analysisResult = {
      businessType: 'general',
      tone: 'friendly',
      keywords: [],
      suggestedEmoji: '🤖',
      suggestedGreeting: `안녕하세요! ${name} 코코봇입니다. 무엇을 도와드릴까요?`,
    };
  }

  // ── 4. 응답 반환 ────────────────────────────────────────────────────────────
  return NextResponse.json({
    success: true,
    data: analysisResult,
  });
}
