/**
 * @task S3BA1
 * @description AI 자동 채점 API
 *
 * POST /api/school/grade — 사용자 답변 자동 채점
 *   요청: { session_id, user_answer, criteria }
 *   응답: { score, feedback, session_id, certification_issued }
 *
 * 채점 결과:
 * - score: 0~100 정수
 * - feedback: 한국어 피드백 텍스트
 * - certification_issued: 85점 이상 시 true (learning_certifications에 INSERT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { chatCompletion } from '@/lib/openrouter-client';
import type { OpenRouterMessage } from '@/types/ai';

// ============================
// 타입 정의
// ============================

interface GradeRequestBody {
  /** 학습 세션 ID */
  session_id: string;
  /** 사용자 답변 */
  user_answer: string;
  /** 채점 기준 (자유 텍스트) */
  criteria: string;
}

interface GradeResult {
  score: number;
  feedback: string;
}

interface GradeResponse {
  score: number;
  feedback: string;
  session_id: string;
  certification_issued: boolean;
  certification_id?: string;
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
// AI 채점 프롬프트
// ============================

function buildGradingPrompt(criteria: string, userAnswer: string): string {
  return `다음 채점 기준에 따라 사용자의 답변을 0~100점으로 평가하세요.

[채점 기준]
${criteria}

[사용자 답변]
${userAnswer}

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{ "score": 숫자, "feedback": "피드백 텍스트" }

채점 기준:
- 내용의 정확성과 완성도를 중점으로 평가하세요.
- 피드백은 구체적이고 학습에 도움이 되도록 200자 이내로 작성하세요.
- 잘한 점과 개선할 점을 균형 있게 포함하세요.
- score는 반드시 0~100 사이의 정수로 입력하세요.`;
}

// ============================
// AI 응답 파싱
// ============================

function parseGradeResult(content: string): GradeResult | null {
  // JSON 블록 추출 (마크다운 코드 블록 포함 처리)
  const jsonMatch = content.match(/\{[\s\S]*"score"[\s\S]*"feedback"[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as { score: unknown; feedback: unknown };
    const score = Number(parsed.score);

    if (
      !Number.isFinite(score) ||
      score < 0 ||
      score > 100 ||
      typeof parsed.feedback !== 'string'
    ) {
      return null;
    }

    return {
      score: Math.round(score),
      feedback: parsed.feedback,
    };
  } catch {
    return null;
  }
}

// ============================
// 인증서 발급
// ============================

const CERTIFICATION_THRESHOLD = 85;

async function issueCertification(
  userId: string,
  sessionId: string,
  score: number
): Promise<string | null> {
  const supabase = getSupabaseServer();

  // 세션에서 curriculum_id 조회
  const { data: session, error: sessionError } = await supabase
    .from('learning_sessions')
    .select('curriculum_id, scenario_type')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) return null;

  const { data: cert, error: certError } = await supabase
    .from('learning_certifications')
    .insert({
      user_id: userId,
      session_id: sessionId,
      curriculum_id: (session as { curriculum_id: string }).curriculum_id,
      score,
      issued_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (certError || !cert) return null;
  return (cert as { id: string }).id;
}

// ============================
// POST — 자동 채점
// ============================

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: GradeRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const { session_id, user_answer, criteria } = body;

  if (!session_id || !user_answer || !criteria) {
    return NextResponse.json(
      { error: 'session_id, user_answer, and criteria are required' },
      { status: 400 }
    );
  }

  // 세션 소유권 확인
  const supabase = getSupabaseServer();
  const { data: sessionData, error: sessionError } = await supabase
    .from('learning_sessions')
    .select('id, user_id, status')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !sessionData) {
    return NextResponse.json(
      { error: 'Session not found or access denied' },
      { status: 404 }
    );
  }

  // AI 채점 수행
  const MODEL_ID = 'anthropic/claude-haiku-4-5' as const;
  const gradingPrompt = buildGradingPrompt(criteria, user_answer);
  const messages: OpenRouterMessage[] = [
    { role: 'user', content: gradingPrompt },
  ];

  let gradeResult: GradeResult;
  try {
    const aiResponse = await chatCompletion(MODEL_ID, messages, {
      max_tokens: 500,
      temperature: 0.2, // 채점은 일관성이 중요하므로 낮은 temperature
    });

    const content = aiResponse.choices[0]?.message?.content ?? '';
    const parsed = parseGradeResult(content);

    if (!parsed) {
      return NextResponse.json(
        { error: 'Failed to parse AI grading response' },
        { status: 502 }
      );
    }
    gradeResult = parsed;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // 세션 점수 업데이트 및 완료 처리
  const { error: updateError } = await supabase
    .from('learning_sessions')
    .update({
      score: gradeResult.score,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', session_id);

  if (updateError) {
    return NextResponse.json(
      { error: `Failed to update session: ${updateError.message}` },
      { status: 500 }
    );
  }

  // 85점 이상 시 인증서 발급
  let certificationIssued = false;
  let certificationId: string | undefined;

  if (gradeResult.score >= CERTIFICATION_THRESHOLD) {
    const certId = await issueCertification(user.id, session_id, gradeResult.score);
    if (certId) {
      certificationIssued = true;
      certificationId = certId;
    }
  }

  const response: GradeResponse = {
    score: gradeResult.score,
    feedback: gradeResult.feedback,
    session_id,
    certification_issued: certificationIssued,
    ...(certificationId && { certification_id: certificationId }),
  };

  return NextResponse.json(response);
}
