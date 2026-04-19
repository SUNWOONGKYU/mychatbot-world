// @task S3CS1
/**
 * School Session API - Vercel Serverless Function
 * POST /api/Backend_APIs/school-session
 *
 * 코코봇스쿨 세션 API: 시나리오 기반 학습 세션 처리
 * - 시나리오 JSON 로드 → 컨텍스트 구성
 * - OpenAI/OpenRouter API로 시나리오 기반 AI 응답 생성
 * - 세션 진행률 추적 (현재 step / 전체 steps)
 * - 시나리오 완료 시 bot_growth 테이블 경험치 업데이트
 * - Supabase Bearer 토큰 인증 확인
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── 시나리오 로더 ───
/**
 * scenarioId에 해당하는 JSON 시나리오를 로드합니다.
 * 파일 경로: templates/school/{scenarioId}.json
 *
 * @param {string} scenarioId - 시나리오 식별자
 * @returns {Object} 시나리오 JSON 객체
 * @throws {Error} 파일이 없거나 JSON 파싱 실패 시
 */
function loadScenario(scenarioId) {
  // 경로 순회 공격 방지: 알파벳, 숫자, 하이픈만 허용
  if (!/^[a-z0-9-]+$/.test(scenarioId)) {
    throw new Error('Invalid scenarioId format');
  }

  // Vercel 서버리스에서 process.cwd()는 프로젝트 루트
  const scenarioPath = path.join(process.cwd(), 'templates', 'school', `${scenarioId}.json`);
  const raw = readFileSync(scenarioPath, 'utf-8');
  return JSON.parse(raw);
}

// ─── 시나리오 컨텍스트 시스템 프롬프트 빌더 ───
/**
 * 시나리오 정보를 기반으로 AI에게 전달할 시스템 프롬프트를 구성합니다.
 *
 * @param {Object} scenario - 로드된 시나리오 JSON
 * @param {number} currentStep - 현재 step 인덱스 (0-based)
 * @returns {string} 시스템 프롬프트 문자열
 */
function buildScenarioSystemPrompt(scenario, currentStep) {
  const step = scenario.steps[currentStep] || scenario.steps[scenario.steps.length - 1];
  const expectedTopics = (step.expectedTopics || []).join(', ');

  return `당신은 코코봇 훈련 시뮬레이터입니다. 아래 시나리오를 기반으로 고객 역할을 맡아 대화를 진행하세요.

[시나리오 정보]
- 시나리오: ${scenario.scenarioName}
- 설명: ${scenario.description}
- 현재 단계: ${currentStep + 1} / ${scenario.steps.length}
- 이 단계의 기대 주제: ${expectedTopics}

[진행 규칙]
- 사용자(코코봇)의 응답에 대해 고객으로서 자연스럽게 반응하세요
- 응답이 기대 주제(${expectedTopics})를 잘 다루고 있으면 긍정적으로 반응하고 다음 자연스러운 질문이나 반응을 이어가세요
- 응답이 기대 주제에서 벗어나거나 부족하다면, 고객으로서 실망하거나 다시 묻는 식으로 반응하세요
- 응답은 1~3문장으로 간결하게 유지하세요
- 한국어로 응답하세요`;
}

// ─── 다음 힌트 생성 ───
/**
 * 다음 step의 기대 주제를 기반으로 힌트 메시지를 생성합니다.
 *
 * @param {Object} scenario - 시나리오 JSON
 * @param {number} nextStepIndex - 다음 step 인덱스 (0-based)
 * @returns {string|null} 힌트 문자열 또는 null(완료 시)
 */
function buildNextHint(scenario, nextStepIndex) {
  if (nextStepIndex >= scenario.steps.length) {
    return null; // 시나리오 완료
  }
  const nextStep = scenario.steps[nextStepIndex];
  const topics = (nextStep.expectedTopics || []).join(', ');
  return `다음 단계 힌트: "${nextStep.userPrompt}" 에 대해 [${topics}] 관련 내용을 포함해 답해보세요.`;
}

// ─── OpenRouter API 호출 ───
/**
 * OpenRouter API를 통해 AI 응답을 생성합니다.
 * MODEL_STACK 순서로 폴백합니다.
 *
 * @param {Array} messages - 메시지 배열 ({role, content})
 * @param {string} apiKey - OpenRouter API 키
 * @returns {Promise<{content: string, model: string}>}
 */
async function callOpenRouter(messages, apiKey) {
  const MODEL_STACK = [
    'google/gemini-2.0-flash-exp:free',
    'google/gemini-2.5-flash',
    'openai/gpt-4o-mini',
    'anthropic/claude-sonnet-4.5',
  ];

  for (const model of MODEL_STACK) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.75,
          max_tokens: 300,
        }),
      });

      if (!resp.ok) {
        console.warn(`[school-session] ${model} failed: ${resp.status}`);
        continue;
      }

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return { content, model: data.model || model };
      }
    } catch (e) {
      console.warn(`[school-session] ${model} error:`, e.message);
    }
  }

  throw new Error('All AI models failed to respond');
}

// ─── 경험치 업데이트 ───
/**
 * 시나리오 완료 시 bot_growth 테이블의 experience를 업데이트합니다.
 * 실패 시 에러를 throw하지 않고 경고만 출력합니다 (비필수 사이드 이펙트).
 *
 * @param {Object} supabase - Supabase 클라이언트 인스턴스
 * @param {string} botId - 봇 ID
 * @param {number} xpReward - 획득할 경험치 (기본 10)
 */
async function updateBotExperience(supabase, botId, xpReward = 10) {
  try {
    // 현재 경험치 조회
    const { data: growth, error: fetchError } = await supabase
      .from('bot_growth')
      .select('experience')
      .eq('bot_id', botId)
      .single();

    if (fetchError) {
      console.warn('[school-session] bot_growth fetch error:', fetchError.message);
      return;
    }

    const currentXp = growth?.experience ?? 0;

    // 경험치 += xpReward
    const { error: updateError } = await supabase
      .from('bot_growth')
      .update({ experience: currentXp + xpReward })
      .eq('bot_id', botId);

    if (updateError) {
      console.warn('[school-session] bot_growth update error:', updateError.message);
    } else {
      console.info(`[school-session] bot_growth updated: bot=${botId}, xp+${xpReward}`);
    }
  } catch (e) {
    console.warn('[school-session] updateBotExperience unexpected error:', e.message);
  }
}

// ─── 메인 핸들러 ───
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 환경 변수 확인 ──
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').split(',')[0].trim();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server configuration error: missing Supabase credentials' });
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: missing AI API key' });
  }

  // ── Supabase 인증 확인 ──
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: missing Bearer token' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) {
    console.warn('[school-session] Auth error:', authError?.message);
    return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }

  // ── 요청 파싱 ──
  const { botId, scenarioId, userMessage, currentStep: rawStep } = req.body;

  if (!botId || !scenarioId || !userMessage) {
    return res.status(400).json({ error: 'botId, scenarioId, userMessage are required' });
  }

  // currentStep: 클라이언트가 전달하거나 0으로 시작
  const currentStep = typeof rawStep === 'number' && rawStep >= 0 ? Math.floor(rawStep) : 0;

  try {
    // ── 시나리오 로드 ──
    let scenario;
    try {
      scenario = loadScenario(scenarioId);
    } catch (e) {
      console.error('[school-session] scenario load error:', e.message);
      return res.status(404).json({ error: `Scenario not found: ${scenarioId}` });
    }

    const totalSteps = scenario.steps.length;

    // step 범위 검증
    if (currentStep >= totalSteps) {
      return res.status(400).json({ error: `currentStep (${currentStep}) exceeds total steps (${totalSteps})` });
    }

    // ── 시스템 프롬프트 + 메시지 구성 ──
    const systemPrompt = buildScenarioSystemPrompt(scenario, currentStep);
    const currentStepData = scenario.steps[currentStep];

    const messages = [
      { role: 'system', content: systemPrompt },
      // 현재 단계의 고객 질문을 user로, 코코봇 응답을 평가하는 구조
      { role: 'user', content: `[고객 발화] ${currentStepData.userPrompt}` },
      { role: 'assistant', content: '[코코봇이 답변하려 합니다. 아래 실제 코코봇 응답을 평가해주세요]' },
      { role: 'user', content: `[코코봇 응답] ${userMessage}\n\n위 코코봇 응답에 대해 고객 입장에서 자연스럽게 반응해주세요.` },
    ];

    // ── AI 응답 생성 ──
    const { content: aiResponse, model } = await callOpenRouter(messages, OPENROUTER_API_KEY);

    // ── 진행률 계산 ──
    const nextStep = currentStep + 1;
    const isCompleted = nextStep >= totalSteps;

    const sessionProgress = {
      currentStep: currentStep + 1,   // 1-based (표시용)
      totalSteps,
      percentage: Math.round(((currentStep + 1) / totalSteps) * 100),
      isCompleted,
    };

    // ── 다음 힌트 ──
    const nextHint = isCompleted
      ? `시나리오 "${scenario.scenarioName}" 완료! 수고하셨습니다.`
      : buildNextHint(scenario, nextStep);

    // ── 시나리오 완료 시 경험치 업데이트 ──
    if (isCompleted) {
      const xpReward = scenario.xpReward ?? 10;
      await updateBotExperience(supabase, botId, xpReward);
    }

    // ── 응답 ──
    return res.status(200).json({
      response: aiResponse,
      sessionProgress,
      nextHint,
      model,
      scenarioName: scenario.scenarioName,
    });

  } catch (error) {
    console.error('[school-session] error:', error.message);
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
}
