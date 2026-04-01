/**
 * @task S3BA1
 * @description AI 멘토링 피드백 API
 *
 * POST /api/school/mentor — 커리큘럼 맥락 기반 멘토링 응답 생성
 *   요청: { session_id, question }
 *   응답: { hint, guidance, follow_up_questions }
 *
 * 멘토링 원칙:
 * - 직접 답변 제공 금지 (힌트와 가이드 방식)
 * - 소크라테스식 질문으로 스스로 생각하도록 유도
 * - 커리큘럼 맥락에 맞는 관련 개념 제시
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { chatCompletion } from '@/lib/openrouter-client';
import type { OpenRouterMessage } from '@/types/ai';

// ============================
// 타입 정의
// ============================

interface MentorRequestBody {
  /** 학습 세션 ID */
  session_id: string;
  /** 학습자 질문 */
  question: string;
}

interface SessionWithMetadata {
  id: string;
  user_id: string;
  curriculum_id: string;
  scenario_type: string;
  metadata: {
    topic?: string;
    difficulty_level?: string;
    scenario_text?: string;
  } | null;
}

interface MentorResponse {
  hint: string;
  guidance: string;
  follow_up_questions: string[];
  session_id: string;
}

// ============================
// Supabase 서버 클라이언트
// ============================

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, serviceKey);
}

// ============================
// 인증 헬퍼
// ============================

async function getAuthenticatedUser(req: NextRequest) {
  const supabase = getSupabaseServer();
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// ============================
// 멘토링 시스템 프롬프트
// ============================

function buildMentoringSystemPrompt(session: SessionWithMetadata): string {
  const topic = session.metadata?.topic ?? '학습 주제';
  const difficulty = session.metadata?.difficulty_level ?? 'intermediate';
  const scenario = session.metadata?.scenario_text
    ? `\n\n현재 학습 시나리오:\n${session.metadata.scenario_text.substring(0, 500)}`
    : '';

  return `당신은 경험 많은 학습 멘토입니다.
학습자가 "${topic}" 주제를 공부하고 있으며, 현재 난이도는 ${difficulty}입니다.${scenario}

중요한 멘토링 원칙:
1. 절대로 직접적인 답변을 제공하지 마세요.
2. 힌트와 유도 질문으로 학습자 스스로 답을 찾도록 도와주세요.
3. 소크라테스식 대화법을 활용하세요.
4. 관련 개념이나 원리를 예시와 함께 제시하세요.
5. 긍정적이고 격려하는 톤을 유지하세요.

응답은 반드시 다음 JSON 형식으로만 제공하세요:
{
  "hint": "핵심 방향을 제시하는 힌트 (2~3문장)",
  "guidance": "개념 이해를 돕는 가이드 설명 (3~5문장, 직접 답변 금지)",
  "follow_up_questions": ["스스로 생각해볼 질문 1", "스스로 생각해볼 질문 2", "스스로 생각해볼 질문 3"]
}`;
}

// ============================
// AI 응답 파싱
// ============================

interface ParsedMentorResult {
  hint: string;
  guidance: string;
  follow_up_questions: string[];
}

function parseMentorResponse(content: string): ParsedMentorResult | null {
  const jsonMatch = content.match(/\{[\s\S]*"hint"[\s\S]*"guidance"[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      hint: unknown;
      guidance: unknown;
      follow_up_questions: unknown;
    };

    if (
      typeof parsed.hint !== 'string' ||
      typeof parsed.guidance !== 'string' ||
      !Array.isArray(parsed.follow_up_questions)
    ) {
      return null;
    }

    return {
      hint: parsed.hint,
      guidance: parsed.guidance,
      follow_up_questions: (parsed.follow_up_questions as unknown[])
        .filter((q): q is string => typeof q === 'string')
        .slice(0, 3),
    };
  } catch {
    return null;
  }
}

// ============================
// POST — 멘토링 응답 생성
// ============================

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: MentorRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const { session_id, question } = body;

  if (!session_id || !question) {
    return NextResponse.json(
      { error: 'session_id and question are required' },
      { status: 400 }
    );
  }

  if (question.trim().length < 5) {
    return NextResponse.json(
      { error: 'question must be at least 5 characters' },
      { status: 400 }
    );
  }

  // 세션 조회 (커리큘럼 맥락 로드)
  const supabase = getSupabaseServer();
  const { data: sessionData, error: sessionError } = await supabase
    .from('learning_sessions')
    .select('id, user_id, curriculum_id, scenario_type, metadata')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !sessionData) {
    return NextResponse.json(
      { error: 'Session not found or access denied' },
      { status: 404 }
    );
  }

  const session = sessionData as SessionWithMetadata;

  // AI 멘토링 응답 생성 — system prompt를 user 메시지에 포함하여 단일 호출
  const MODEL_ID = 'anthropic/claude-sonnet-4-5' as const;
  const systemPrompt = buildMentoringSystemPrompt(session);

  const fullMessages: OpenRouterMessage[] = [
    { role: 'user', content: `${systemPrompt}\n\n학습자 질문: ${question}` },
  ];

  let mentorResult: ParsedMentorResult;
  try {
    const fullResponse = await chatCompletion(MODEL_ID, fullMessages, {
      max_tokens: 800,
      temperature: 0.6,
    });

    const content = fullResponse.choices[0]?.message?.content ?? '';
    const parsed = parseMentorResponse(content);

    if (!parsed) {
      // 파싱 실패 시 원문 텍스트로 폴백
      mentorResult = {
        hint: content.substring(0, 200),
        guidance: content,
        follow_up_questions: [],
      };
    } else {
      mentorResult = parsed;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const response: MentorResponse = {
    ...mentorResult,
    session_id,
  };

  return NextResponse.json(response);
}
