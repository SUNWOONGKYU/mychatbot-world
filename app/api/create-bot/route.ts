/**
 * @task S2BA1
 * @description 코코봇 생성 메인 오케스트레이션 API (위저드 v2 호환)
 *
 * POST /api/create-bot
 * Request (위저드 v2):
 *   {
 *     botName, botDesc, botUsername?,
 *     persona?:   { name, role, iqEq, model, type, presetId? },
 *     interviewText?,
 *     greeting?, faqs?: [{ q, a }],
 *     voice?, avatarEmoji?,
 *   }
 *   (구버전 호환: { name, description, audioUrl? } — 자동 매핑)
 *
 * Response:
 *   { success, data: { botId, deployUrl, qrSvg, qrDataUrl, faqs, businessType, tone, greeting } }
 *
 * 파이프라인:
 *   1. Supabase auth 인증 검증
 *   2. AI 분석 (사용자 인사말·FAQ 미제공 시에만)
 *   3. mcw_bots INSERT
 *   4. mcw_personas INSERT
 *   5. 배포 URL + QR코드 발급
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { generateQR } from '@/lib/qr-generator';
import { generateText } from '@xsai/generate-text';
import { createOpenAI } from '@xsai/providers';

// ── 타입 정의 ─────────────────────────────────────────────────────────────────

interface WizardPersona {
  name?: string;
  userTitle?: string;
  role?: string;
  iqEq?: number;
  model?: 'logic' | 'emotion' | 'fast' | 'creative';
  type?: 'avatar' | 'helper';
  presetId?: string;
}

interface WizardFaq {
  q?: string;
  a?: string;
  // 구버전 키 호환
  question?: string;
  answer?: string;
}

interface CreateBotRequest {
  // 위저드 v2 필드
  botName?: string;
  botDesc?: string;
  botUsername?: string;
  persona?: WizardPersona;
  interviewText?: string;
  greeting?: string;
  faqs?: WizardFaq[];
  voice?: string;
  avatarEmoji?: string;
  // 구버전 호환
  name?: string;
  description?: string;
  audioUrl?: string;
}

interface NormalizedFaq {
  question: string;
  answer: string;
}

interface AnalyzeResult {
  businessType: string;
  tone: string;
  keywords: string[];
  suggestedEmoji: string;
  suggestedGreeting: string;
}

interface CreateBotData {
  botId: string;
  deployUrl: string;
  qrSvg: string;
  qrDataUrl: string;
  faqs: NormalizedFaq[];
  businessType: string;
  tone: string;
  greeting: string;
}

// ── 헬퍼: 입력 정규화 ─────────────────────────────────────────────────────────

function normalizeFaqs(input: unknown): NormalizedFaq[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const obj = item as WizardFaq;
      const q = (obj.q ?? obj.question ?? '').trim();
      const a = (obj.a ?? obj.answer ?? '').trim();
      if (!q || !a) return null;
      return { question: q, answer: a };
    })
    .filter((x): x is NormalizedFaq => x !== null)
    .slice(0, 20);
}

function generateBotId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `bot_${ts}_${rand}`;
}

function sanitizeUsername(input: string, suffix: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  return base || `bot-${suffix}`;
}

// ── AI 분석 (인사말/FAQ 미제공 시 fallback) ──────────────────────────────────

async function analyzeWithAI(
  apiKey: string,
  name: string,
  description: string,
): Promise<AnalyzeResult> {
  const openai = createOpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' });

  const systemPrompt = `당신은 비즈니스 분석 전문가입니다.
코코봇의 이름과 설명을 분석하여 JSON 형식으로만 응답하세요.

응답 형식:
{
  "businessType": "영문 소문자 카테고리 (예: restaurant, law_firm, retail, education)",
  "tone": "friendly | professional | casual | authoritative | warm 중 하나",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "suggestedEmoji": "단일 이모지",
  "suggestedGreeting": "코코봇 첫 인사말 (한국어, 50자 이내)"
}`;

  const result = await generateText({
    ...openai.chat('openai/gpt-4o-mini'),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `코코봇 이름: ${name}\n설명: ${description}` },
    ],
    temperature: 0.3,
  });

  let raw = (result.text ?? '{}').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  const parsed = JSON.parse(raw) as Partial<AnalyzeResult>;

  return {
    businessType: parsed.businessType ?? 'general',
    tone: parsed.tone ?? 'friendly',
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
    suggestedEmoji: parsed.suggestedEmoji ?? '🤖',
    suggestedGreeting: parsed.suggestedGreeting ?? `안녕하세요! ${name} 코코봇입니다. 무엇을 도와드릴까요?`,
  };
}

async function generateFaqsWithAI(
  apiKey: string,
  name: string,
  description: string,
  analysis: AnalyzeResult,
): Promise<NormalizedFaq[]> {
  const openai = createOpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' });

  const systemPrompt = `코코봇 FAQ 10개를 JSON 배열로 반환하세요.
형식: [{ "question": "질문", "answer": "답변" }]
규칙: 질문 50자, 답변 200자, 한국어, ${analysis.tone} 톤`;

  const result = await generateText({
    ...openai.chat('openai/gpt-4o-mini'),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `이름: ${name}\n설명: ${description}\n유형: ${analysis.businessType}` },
    ],
    temperature: 0.7,
    maxTokens: 2000,
  });

  let raw = (result.text ?? '[]').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  return normalizeFaqs(JSON.parse(raw));
}

// ── 메인 핸들러 ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1) 인증 검증
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
  }
  const userId = user.id;

  // 2) 요청 파싱 + 정규화
  let body: CreateBotRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: '요청 바디 파싱 실패.' }, { status: 400 });
  }

  // 위저드 v2 필드 우선, 없으면 구버전 필드 fallback
  const botName = (body.botName ?? body.name ?? '').trim();
  const botDesc = (body.botDesc ?? body.description ?? '').trim();
  const userGreeting = (body.greeting ?? '').trim();
  const userFaqs = normalizeFaqs(body.faqs);
  const voice = (body.voice ?? 'fable').trim();
  const avatarEmoji = (body.avatarEmoji ?? '').trim();
  const interviewText = (body.interviewText ?? '').trim();
  const requestedUsername = (body.botUsername ?? '').trim();

  if (!botName) {
    return NextResponse.json({ success: false, error: '코코봇 이름은 필수 항목입니다.' }, { status: 400 });
  }
  if (!botDesc) {
    return NextResponse.json({ success: false, error: '코코봇 설명은 필수 항목입니다.' }, { status: 400 });
  }
  if (botName.length > 100) {
    return NextResponse.json({ success: false, error: 'botName은 100자 이내여야 합니다.' }, { status: 400 });
  }
  if (botDesc.length > 2000) {
    return NextResponse.json({ success: false, error: 'botDesc은 2000자 이내여야 합니다.' }, { status: 400 });
  }

  const openAiApiKey = process.env.OPENROUTER_API_KEY;

  // 3) AI 분석 — 사용자 인사말/FAQ 모두 있으면 스킵
  let analysis: AnalyzeResult;
  const needAi = !userGreeting || userFaqs.length === 0;
  if (needAi && openAiApiKey) {
    try {
      analysis = await analyzeWithAI(openAiApiKey, botName, botDesc);
    } catch (e) {
      console.error('[create-bot] AI 분석 실패, 기본값 사용:', e);
      analysis = {
        businessType: 'general',
        tone: 'friendly',
        keywords: [],
        suggestedEmoji: avatarEmoji || '🤖',
        suggestedGreeting: `안녕하세요! ${botName} 코코봇입니다. 무엇을 도와드릴까요?`,
      };
    }
  } else {
    analysis = {
      businessType: 'general',
      tone: 'friendly',
      keywords: [],
      suggestedEmoji: avatarEmoji || '🤖',
      suggestedGreeting: `안녕하세요! ${botName} 코코봇입니다.`,
    };
  }

  // 4) FAQ — 사용자 제공 우선, 없을 때만 AI 생성
  let finalFaqs: NormalizedFaq[] = userFaqs;
  if (finalFaqs.length === 0 && openAiApiKey) {
    try {
      finalFaqs = await generateFaqsWithAI(openAiApiKey, botName, botDesc, analysis);
    } catch (e) {
      console.error('[create-bot] FAQ 생성 실패, 빈 배열로 진행:', e);
      finalFaqs = [];
    }
  }

  // 5) 인사말 결정 (사용자 제공 우선)
  const finalGreeting = userGreeting || analysis.suggestedGreeting;
  const finalEmoji = avatarEmoji || analysis.suggestedEmoji;

  // 6) username 결정 + 중복 체크
  const botId = generateBotId();
  const idSuffix = botId.split('_').pop() ?? 'xxx';
  let username = requestedUsername
    ? sanitizeUsername(requestedUsername, idSuffix)
    : sanitizeUsername(botName, idSuffix);

  // username 중복 체크 — 충돌 시 suffix 추가
  const { data: existing } = await supabase.from('mcw_bots').select('id').eq('username', username).maybeSingle();
  if (existing) {
    username = `${username}-${idSuffix}`;
  }

  // 7) mcw_bots INSERT
  const botInsertData = {
    id: botId,
    username,
    owner_id: userId,
    bot_name: botName,
    bot_desc: botDesc,
    emoji: finalEmoji,
    greeting: finalGreeting,
    faqs: finalFaqs,
    input_text: interviewText || botDesc,
    category: analysis.businessType,
    voice,
  };

  const { error: botInsertError } = await supabase.from('mcw_bots').insert(botInsertData);
  if (botInsertError) {
    console.error('[create-bot] Bot INSERT 오류:', botInsertError);
    return NextResponse.json(
      { success: false, error: `코코봇 등록 실패: ${botInsertError.message}` },
      { status: 500 },
    );
  }

  // 8) mcw_personas INSERT (위저드 페르소나 데이터 반영)
  const personaInsertData = {
    id: `persona_${botId}`,
    bot_id: botId,
    name: body.persona?.name?.trim() || botName,
    role: body.persona?.role?.trim() || analysis.businessType,
    category: body.persona?.type === 'helper' ? 'helper' : 'avatar',
    template_id: body.persona?.presetId ?? null,
    model: body.persona?.model || 'logic',
    iq_eq: typeof body.persona?.iqEq === 'number' ? body.persona.iqEq : 70,
    is_visible: true,
    is_public: true,
    greeting: finalGreeting,
    faqs: finalFaqs,
  };

  const { error: personaInsertError } = await supabase.from('mcw_personas').insert(personaInsertData);
  if (personaInsertError) {
    console.warn('[create-bot] Persona INSERT 경고 (봇은 이미 등록됨):', personaInsertError);
  }

  // 9) 배포 URL + QR
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
    console.error('[create-bot] QR 생성 오류 (URL은 반환):', qrError);
  }

  // 10) 응답
  const responseData: CreateBotData = {
    botId,
    deployUrl,
    qrSvg,
    qrDataUrl,
    faqs: finalFaqs,
    businessType: analysis.businessType,
    tone: analysis.tone,
    greeting: finalGreeting,
  };

  return NextResponse.json({ success: true, data: responseData });
}
