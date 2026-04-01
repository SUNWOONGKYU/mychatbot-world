/**
 * @task S3BA1
 * @description AI 시나리오 생성 API
 *
 * POST /api/school/scenario — AI 기반 학습 시나리오 생성
 *   요청: { curriculum_id, topic, difficulty_level, session_id? }
 *   응답: { scenario_text, session_id, model_used }
 *
 * 시나리오 타입: 'roleplay' | 'interview' | 'debate' | 'presentation'
 * 생성된 시나리오는 learning_sessions 메타데이터에 저장됩니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { chatCompletion } from '@/lib/openrouter-client';
import type { OpenRouterMessage } from '@/types/ai';

// ============================
// 타입 정의
// ============================

type ScenarioType = 'roleplay' | 'interview' | 'debate' | 'presentation';
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

interface ScenarioRequestBody {
  /** 커리큘럼 ID */
  curriculum_id: string;
  /** 학습 주제 */
  topic: string;
  /** 난이도 */
  difficulty_level: DifficultyLevel;
  /** 시나리오 유형 (기본: roleplay) */
  scenario_type?: ScenarioType;
  /** 기존 세션 ID (없으면 새로 생성) */
  session_id?: string;
}

interface ScenarioMetadata {
  scenario_text: string;
  topic: string;
  difficulty_level: DifficultyLevel;
  scenario_type: ScenarioType;
  generated_at: string;
  model_used: string;
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
// 시나리오 생성 프롬프트
// ============================

function buildScenarioPrompt(
  topic: string,
  difficulty_level: DifficultyLevel,
  scenario_type: ScenarioType
): string {
  const difficultyLabels: Record<DifficultyLevel, string> = {
    beginner: '초급 (기초 개념 중심, 쉬운 어휘)',
    intermediate: '중급 (개념 응용, 실무 연결)',
    advanced: '고급 (심화 분석, 비판적 사고)',
  };

  const typeInstructions: Record<ScenarioType, string> = {
    roleplay: `롤플레이 시나리오: 구체적인 상황을 설정하고 학습자가 특정 역할을 맡아 연습할 수 있도록 구성하세요.
- 상황 설명 (2~3문장)
- 학습자의 역할 정의
- 수행 과제 (3~5가지 구체적 미션)
- 평가 포인트`,

    interview: `인터뷰 시나리오: 실제 인터뷰 상황을 시뮬레이션합니다.
- 인터뷰 상황 설명
- 면접관 역할 설명
- 예상 질문 5개 (난이도 순서대로)
- 좋은 답변의 핵심 요소`,

    debate: `토론 시나리오: 찬반 토론 구조로 구성합니다.
- 토론 주제 제시
- 찬성 측 핵심 논거 3가지
- 반대 측 핵심 논거 3가지
- 토론 진행 방식 안내`,

    presentation: `발표 시나리오: 구조화된 발표 미션을 제공합니다.
- 발표 상황 및 청중 설명
- 발표 목적 및 목표
- 필수 포함 내용 (4~6가지)
- 시간 배분 가이드`,
  };

  return `다음 학습 시나리오를 한국어로 생성해주세요.

[주제]
${topic}

[난이도]
${difficultyLabels[difficulty_level]}

[시나리오 유형]
${typeInstructions[scenario_type]}

마크다운 형식으로 깔끔하게 작성하고, 학습자가 즉시 실습할 수 있도록 구체적으로 작성하세요.`;
}

// ============================
// POST — 시나리오 생성
// ============================

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ScenarioRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const {
    curriculum_id,
    topic,
    difficulty_level,
    scenario_type = 'roleplay',
    session_id,
  } = body;

  // 입력 검증
  if (!curriculum_id || !topic || !difficulty_level) {
    return NextResponse.json(
      { error: 'curriculum_id, topic, and difficulty_level are required' },
      { status: 400 }
    );
  }

  const validDifficulties: DifficultyLevel[] = [
    'beginner',
    'intermediate',
    'advanced',
  ];
  if (!validDifficulties.includes(difficulty_level)) {
    return NextResponse.json(
      {
        error: `Invalid difficulty_level. Must be one of: ${validDifficulties.join(', ')}`,
      },
      { status: 400 }
    );
  }

  const validScenarioTypes: ScenarioType[] = [
    'roleplay',
    'interview',
    'debate',
    'presentation',
  ];
  if (!validScenarioTypes.includes(scenario_type)) {
    return NextResponse.json(
      {
        error: `Invalid scenario_type. Must be one of: ${validScenarioTypes.join(', ')}`,
      },
      { status: 400 }
    );
  }

  // AI 시나리오 생성
  const MODEL_ID = 'anthropic/claude-sonnet-4-5' as const;
  const prompt = buildScenarioPrompt(topic, difficulty_level, scenario_type);

  const messages: OpenRouterMessage[] = [
    { role: 'user', content: prompt },
  ];

  let scenarioText: string;
  try {
    const aiResponse = await chatCompletion(MODEL_ID, messages, {
      max_tokens: 1500,
      temperature: 0.7,
    });
    scenarioText =
      aiResponse.choices[0]?.message?.content ??
      '시나리오 생성에 실패했습니다.';
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // 세션 메타데이터 업데이트 (session_id가 제공된 경우)
  const supabase = getSupabaseServer();
  const scenarioMetadata: ScenarioMetadata = {
    scenario_text: scenarioText,
    topic,
    difficulty_level,
    scenario_type,
    generated_at: new Date().toISOString(),
    model_used: MODEL_ID,
  };

  let targetSessionId = session_id;

  if (session_id) {
    // 기존 세션에 시나리오 저장
    const { error: updateError } = await supabase
      .from('learning_sessions')
      .update({ metadata: scenarioMetadata })
      .eq('id', session_id)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update session: ${updateError.message}` },
        { status: 500 }
      );
    }
  } else {
    // 새 세션 생성 후 시나리오 저장
    const { data: newSession, error: insertError } = await supabase
      .from('learning_sessions')
      .insert({
        user_id: user.id,
        curriculum_id,
        scenario_type,
        status: 'active',
        metadata: scenarioMetadata,
      })
      .select('id')
      .single();

    if (insertError || !newSession) {
      return NextResponse.json(
        { error: `Failed to create session: ${insertError?.message}` },
        { status: 500 }
      );
    }
    targetSessionId = (newSession as { id: string }).id;
  }

  return NextResponse.json({
    scenario_text: scenarioText,
    session_id: targetSessionId,
    scenario_type,
    difficulty_level,
    topic,
    model_used: MODEL_ID,
  });
}
