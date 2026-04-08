// @task S3BA8
/**
 * Learning Progress Sync API - Vercel Serverless Function
 * GET  /api/Backend_APIs/learning-progress?botId=xxx
 * POST /api/Backend_APIs/learning-progress
 *
 * Learning 진행률 Supabase 동기화 API
 * - bot_growth 테이블에서 해당 봇의 진행률 데이터 조회/업데이트
 * - GET: 진행률 조회 (basic, intermediate, advanced, master), 학습 이력, 통계
 * - POST: 진행률 저장 (max 전략: 서버 vs 로컬 중 더 높은 값 유지)
 * - 레벨 1: 0-99 exp, 레벨 2: 100-299 exp, 레벨 3: 300+ exp
 * - Authorization: Bearer <supabase_access_token> 헤더 필수
 * - 본인 봇만 조회/수정 가능 (403 Forbidden)
 */
import { createClient } from '@supabase/supabase-js';

/**
 * 경험치를 기반으로 레벨을 계산한다.
 * @param {number} experience - 경험치
 * @returns {number} 레벨 (1~3)
 */
function calculateLevel(experience) {
  if (experience >= 300) return 3;
  if (experience >= 100) return 2;
  return 1;
}

/**
 * 두 진행률 객체를 max 전략으로 병합한다.
 * 각 커리큘럼 항목에 대해 서버값과 클라이언트값 중 더 높은 값을 유지한다.
 * @param {Object} serverProgress - 서버에 저장된 진행률 객체
 * @param {Object} clientProgress - 클라이언트에서 전달된 진행률 객체
 * @returns {Object} 병합된 진행률 객체
 */
function mergeProgressWithMaxStrategy(serverProgress, clientProgress) {
  const server = serverProgress || {};
  const client = clientProgress || {};
  const allKeys = new Set([...Object.keys(server), ...Object.keys(client)]);
  const merged = {};

  for (const key of allKeys) {
    const serverVal = typeof server[key] === 'number' ? server[key] : 0;
    const clientVal = typeof client[key] === 'number' ? client[key] : 0;
    merged[key] = Math.max(serverVal, clientVal);
  }

  return merged;
}

/**
 * 진행률 객체에서 overall progress(0~100)를 계산한다.
 * basic, intermediate, advanced, master 4개 카테고리의 평균값을 반환한다.
 * @param {Object} progress - 진행률 객체 { basic, intermediate, advanced, master }
 * @returns {number} 0~100 사이의 전체 진행률
 */
function calculateOverallProgress(progress) {
  const keys = ['basic', 'intermediate', 'advanced', 'master'];
  const values = keys.map(k => (typeof progress[k] === 'number' ? progress[k] : 0));
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round(sum / keys.length);
}

/**
 * 공통 인증 + 봇 소유권 검증 헬퍼
 * @param {object} supabase - Supabase 클라이언트
 * @param {string} token - Bearer 토큰
 * @param {string} botId - 봇 ID
 * @returns {{ userId: string, error: { status: number, message: string } | null }}
 */
async function authenticateAndVerifyBot(supabase, token, botId) {
  // 사용자 인증
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) {
    console.warn('[learning-progress] Auth error:', authError?.message);
    return { userId: null, error: { status: 401, message: 'Unauthorized: invalid or expired token' } };
  }

  const userId = userData.user.id;

  // 봇 존재 여부 + 소유권 확인
  const { data: botData, error: botError } = await supabase
    .from('mcw_bots')
    .select('id, user_id')
    .eq('id', botId)
    .single();

  if (botError) {
    if (botError.code === 'PGRST116') {
      return { userId: null, error: { status: 404, message: 'Bot not found' } };
    }
    console.error('[learning-progress] Bot query error:', botError.message);
    return { userId: null, error: { status: 500, message: 'Failed to fetch bot data', detail: botError.message } };
  }

  if (!botData) {
    return { userId: null, error: { status: 404, message: 'Bot not found' } };
  }

  if (botData.user_id !== userId) {
    return { userId: null, error: { status: 403, message: 'Forbidden: you do not own this bot' } };
  }

  return { userId, error: null };
}

/**
 * GET /api/Backend_APIs/learning-progress?botId={botId}
 * 학습 진행률 조회
 */
async function handleGet(req, res, supabase) {
  const { botId } = req.query;

  if (!botId) {
    return res.status(400).json({ error: 'Missing required query parameter: botId' });
  }

  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: missing Bearer token' });
  }

  const { userId, error: authErr } = await authenticateAndVerifyBot(supabase, token, botId);
  if (authErr) {
    return res.status(authErr.status).json({ error: authErr.message, ...(authErr.detail ? { detail: authErr.detail } : {}) });
  }

  // bot_growth 테이블에서 진행률 데이터 조회
  const { data: growthData, error: growthError } = await supabase
    .from('bot_growth')
    .select(
      'school_sessions_completed, experience, learning_progress, learning_history'
    )
    .eq('bot_id', botId)
    .single();

  if (growthError && growthError.code !== 'PGRST116') {
    console.error('[learning-progress] Growth data query error:', growthError.message);
    return res.status(500).json({ error: 'Failed to fetch growth data', detail: growthError.message });
  }

  // bot_growth 레코드가 없거나 learning_progress 컬럼이 없으면 기본값 반환
  const rawProgress = growthData?.learning_progress ?? {};
  const rawHistory = growthData?.learning_history ?? [];
  const completedSessions = growthData?.school_sessions_completed ?? 0;
  const experience = growthData?.experience ?? 0;

  // 카테고리별 진행률 (없으면 0)
  const progress = {
    basic: typeof rawProgress.basic === 'number' ? rawProgress.basic : 0,
    intermediate: typeof rawProgress.intermediate === 'number' ? rawProgress.intermediate : 0,
    advanced: typeof rawProgress.advanced === 'number' ? rawProgress.advanced : 0,
    master: typeof rawProgress.master === 'number' ? rawProgress.master : 0,
  };

  const overallProgress = calculateOverallProgress(progress);
  const level = calculateLevel(experience);

  // 이력: 배열 형태, 최신 50개만 반환
  const history = Array.isArray(rawHistory) ? rawHistory.slice(-50) : [];

  // 완료 코스 수 계산 (progress 100인 카테고리 수)
  const completedCourses = Object.values(progress).filter(v => v >= 100).length;

  return res.status(200).json({
    botId,
    level,
    experience,
    progress,
    history,
    stats: {
      completedCourses,
      overallProgress,
      totalSessions: completedSessions,
    },
  });
}

/**
 * POST /api/Backend_APIs/learning-progress
 * 학습 진행률 저장 및 경험치/레벨 업데이트
 */
async function handlePost(req, res, supabase) {
  const { botId, curriculumId, progress: clientProgress, historyEntry } = req.body || {};

  if (!botId) {
    return res.status(400).json({ error: 'Missing required body field: botId' });
  }
  if (!curriculumId) {
    return res.status(400).json({ error: 'Missing required body field: curriculumId' });
  }
  if (!clientProgress || typeof clientProgress !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid body field: progress (must be an object)' });
  }

  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: missing Bearer token' });
  }

  const { userId, error: authErr } = await authenticateAndVerifyBot(supabase, token, botId);
  if (authErr) {
    return res.status(authErr.status).json({ error: authErr.message, ...(authErr.detail ? { detail: authErr.detail } : {}) });
  }

  // 기존 bot_growth 레코드 조회 (없으면 생성)
  const { data: existingGrowth, error: fetchError } = await supabase
    .from('bot_growth')
    .select(
      'school_sessions_completed, experience, learning_progress, learning_history'
    )
    .eq('bot_id', botId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[learning-progress] Fetch growth error:', fetchError.message);
    return res.status(500).json({ error: 'Failed to fetch existing growth data', detail: fetchError.message });
  }

  const isNewRecord = !existingGrowth;

  const currentProgress = existingGrowth?.learning_progress ?? {};
  const currentHistory = Array.isArray(existingGrowth?.learning_history) ? existingGrowth.learning_history : [];
  const currentSessions = existingGrowth?.school_sessions_completed ?? 0;
  const currentExperience = existingGrowth?.experience ?? 0;

  // max 전략으로 진행률 병합
  const mergedProgress = mergeProgressWithMaxStrategy(currentProgress, clientProgress);

  // 세션 완료 수 증가 (1회 학습 세션 = +1)
  const newSessions = currentSessions + 1;

  // XP 추가: 진행률 업데이트가 있을 때마다 +10 XP 기본, curriculum 완료(100) 시 +50 XP 추가
  let xpGain = 10;
  const curriculumKey = curriculumId.toLowerCase().replace(/[^a-z]/g, '');
  if (mergedProgress[curriculumKey] >= 100 && (currentProgress[curriculumKey] ?? 0) < 100) {
    xpGain += 50; // 커리큘럼 최초 완료 보너스
  }
  const newExperience = currentExperience + xpGain;
  const newLevel = calculateLevel(newExperience);

  // 학습 이력 항목 추가
  const historyTimestamp = new Date().toISOString();
  const newEntry = {
    curriculumId,
    progress: clientProgress,
    timestamp: historyTimestamp,
    xpGained: xpGain,
    ...(historyEntry && typeof historyEntry === 'object' ? historyEntry : {}),
  };

  // 이력은 최근 200개 유지
  const updatedHistory = [...currentHistory, newEntry].slice(-200);

  // bot_growth 테이블 upsert
  const upsertPayload = {
    bot_id: botId,
    school_sessions_completed: newSessions,
    experience: newExperience,
    learning_progress: mergedProgress,
    learning_history: updatedHistory,
    updated_at: historyTimestamp,
  };

  let upsertError;

  if (isNewRecord) {
    // 신규 레코드 INSERT
    const { error: insertError } = await supabase
      .from('bot_growth')
      .insert(upsertPayload);
    upsertError = insertError;
  } else {
    // 기존 레코드 UPDATE
    const { error: updateError } = await supabase
      .from('bot_growth')
      .update({
        school_sessions_completed: newSessions,
        experience: newExperience,
        learning_progress: mergedProgress,
        learning_history: updatedHistory,
        updated_at: historyTimestamp,
      })
      .eq('bot_id', botId);
    upsertError = updateError;
  }

  if (upsertError) {
    // learning_progress / learning_history 컬럼이 없을 경우 폴백: 지원 컬럼만으로 재시도
    if (upsertError.code === '42703' || (upsertError.message && upsertError.message.includes('column'))) {
      console.warn('[learning-progress] Column missing, retrying with fallback payload:', upsertError.message);
      const fallbackPayload = {
        school_sessions_completed: newSessions,
        experience: newExperience,
        updated_at: historyTimestamp,
      };

      const { error: fallbackError } = isNewRecord
        ? await supabase.from('bot_growth').insert({ bot_id: botId, ...fallbackPayload })
        : await supabase.from('bot_growth').update(fallbackPayload).eq('bot_id', botId);

      if (fallbackError) {
        console.error('[learning-progress] Fallback upsert error:', fallbackError.message);
        return res.status(500).json({ error: 'Failed to save learning progress (fallback)', detail: fallbackError.message });
      }

      return res.status(200).json({
        botId,
        level: newLevel,
        experience: newExperience,
        xpGained: xpGain,
        sessions: newSessions,
        progress: mergedProgress,
        warning: 'learning_progress column not found; only sessions/experience were updated.',
      });
    }

    console.error('[learning-progress] Upsert error:', upsertError.message);
    return res.status(500).json({ error: 'Failed to save learning progress', detail: upsertError.message });
  }

  const overallProgress = calculateOverallProgress(mergedProgress);
  const completedCourses = Object.values(mergedProgress).filter(v => v >= 100).length;

  return res.status(200).json({
    botId,
    level: newLevel,
    experience: newExperience,
    xpGained: xpGain,
    sessions: newSessions,
    progress: mergedProgress,
    stats: {
      completedCourses,
      overallProgress,
      totalSessions: newSessions,
    },
  });
}

export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server configuration error: missing Supabase credentials' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (req.method === 'GET') {
      return await handleGet(req, res, supabase);
    }
    if (req.method === 'POST') {
      return await handlePost(req, res, supabase);
    }
  } catch (err) {
    console.error('[learning-progress] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
