/**
 * @task S3BA2
 * @description 프롬프트 스킬 런타임 실행 API
 *
 * POST /api/skills/execute
 *
 * 요청: { skill_id, user_input, parameters? }
 * 응답: { result, execution_id, tokens_used, cost_usd }
 *
 * 처리 순서:
 * 1. Supabase Auth 세션 확인
 * 2. skill_installations에서 설치 여부 확인 (미설치 → 403)
 * 3. skill-market/prompt-skills/{skill_id}.json 로드
 * 4. OpenRouter API 호출 (스킬 systemPrompt + 사용자 입력)
 * 5. skill_executions 테이블에 실행 로그 기록
 * 6. 결과 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================
// 타입 정의
// ============================

interface ExecuteRequest {
  skill_id: string;
  user_input: string;
  /** 스킬별 추가 파라미터 (옵션) */
  parameters?: Record<string, unknown>;
}

interface PromptSkillDef {
  id: string;
  name: string;
  type: 'prompt';
  systemPrompt: string;
  isFree: boolean;
  price: number;
}

interface ExecuteResponse {
  result: string;
  execution_id: string;
  tokens_used: { input: number; output: number; total: number };
  cost_usd: number;
}

// ============================
// 비용 계산 상수
// ============================

/** 기본 모델: OpenRouter claude-haiku (비용 절약형) */
const DEFAULT_SKILL_MODEL = 'anthropic/claude-haiku-4-5';

/**
 * 토큰 비용 계산 (USD)
 * claude-haiku 기준: input $0.25/1M, output $1.25/1M
 */
const COST_PER_INPUT_TOKEN = 0.25 / 1_000_000;
const COST_PER_OUTPUT_TOKEN = 1.25 / 1_000_000;

function calculateCost(inputTokens: number, outputTokens: number): number {
  return (
    inputTokens * COST_PER_INPUT_TOKEN + outputTokens * COST_PER_OUTPUT_TOKEN
  );
}

// ============================
// Supabase 클라이언트
// ============================

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

function getSupabaseUser(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

// ============================
// 스킬 정의 로더
// ============================

async function loadSkillDef(skillId: string): Promise<PromptSkillDef | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('mcw_skills')
    .select('id, name, price, skill_content, metadata, is_active')
    .eq('metadata->>legacy_id', skillId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: skillId,
    name: data.name,
    type: 'prompt',
    systemPrompt: data.skill_content ?? '',
    isFree: data.metadata?.isFree ?? (Number(data.price) === 0),
    price: Number(data.price) ?? 0,
  };
}

// ============================
// OpenRouter API 호출
// ============================

interface OpenRouterResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function callOpenRouter(
  systemPrompt: string,
  userMessage: string
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }

  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        'X-Title': process.env.NEXT_PUBLIC_APP_NAME ?? 'MyChatbot',
      },
      body: JSON.stringify({
        model: DEFAULT_SKILL_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        stream: false,
        max_tokens: 2048,
      }),
    }
  );

  if (!response.ok) {
    let errMsg = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      errMsg = errBody?.error?.message ?? errMsg;
    } catch {
      // ignore
    }
    throw new Error(`OpenRouter error: ${errMsg}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content ?? '';
  const inputTokens = data.usage?.prompt_tokens ?? 0;
  const outputTokens = data.usage?.completion_tokens ?? 0;

  return { content, inputTokens, outputTokens };
}

// ============================
// POST /api/skills/execute
// ============================

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExecuteRequest;
    const { skill_id, user_input, parameters } = body;

    // 입력 검증
    if (!skill_id?.trim()) {
      return NextResponse.json(
        { error: 'skill_id가 필요합니다.' },
        { status: 400 }
      );
    }
    if (!user_input?.trim()) {
      return NextResponse.json(
        { error: 'user_input이 필요합니다.' },
        { status: 400 }
      );
    }

    // 1. 인증 확인
    const supabaseUser = getSupabaseUser(req);
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    // 2. 설치 여부 확인
    const { data: installation } = await supabase
      .from('skill_installations')
      .select('id')
      .eq('user_id', user.id)
      .eq('skill_id', skill_id)
      .eq('status', 'active')
      .maybeSingle();

    if (!installation) {
      return NextResponse.json(
        { error: '스킬이 설치되지 않았습니다.' },
        { status: 403 }
      );
    }

    // 3. 스킬 정의 로드
    const skillDef = await loadSkillDef(skill_id);
    if (!skillDef) {
      return NextResponse.json(
        { error: '스킬 정의 파일을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 4. systemPrompt 조합 (파라미터 치환)
    let systemPrompt = skillDef.systemPrompt;
    if (parameters && Object.keys(parameters).length > 0) {
      for (const [key, value] of Object.entries(parameters)) {
        systemPrompt = systemPrompt.replace(
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          String(value)
        );
      }
    }

    // 5. AI API 호출
    const { content, inputTokens, outputTokens } = await callOpenRouter(
      systemPrompt,
      user_input
    );

    const costUsd = calculateCost(inputTokens, outputTokens);

    // 6. 실행 로그 기록
    const { data: execRecord, error: execError } = await supabase
      .from('skill_executions')
      .insert({
        user_id: user.id,
        skill_id,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: costUsd,
        status: 'success',
      })
      .select('id')
      .single();

    if (execError) {
      // 로그 실패는 응답 차단하지 않음 (best-effort)
      console.error('[POST /api/skills/execute] exec log error:', execError);
    }

    // 7. 결과 반환
    const responseBody: ExecuteResponse = {
      result: content,
      execution_id: execRecord?.id ?? 'unknown',
      tokens_used: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
      },
      cost_usd: Math.round(costUsd * 1_000_000) / 1_000_000,
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('[POST /api/skills/execute] error:', error);

    // AI 호출 실패 시 실행 로그에 failed 기록 (best-effort)
    // Note: body는 이미 위에서 파싱됨 — req.json() 재호출 금지
    // skill_id는 outer try 블록에서 유실될 수 있으므로 로그 생략 처리

    return NextResponse.json(
      { error: '스킬 실행 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
