// @task S3BA5
/**
 * Growth Metrics & Level API - Vercel Serverless Function
 * GET /api/Backend_APIs/growth?botId=xxx
 *
 * 챗봇 성장 지표 및 레벨 계산 API
 * - bot_growth 테이블에서 해당 봇의 성장 데이터 조회
 * - 경험치 = (총 대화 수 × 10) + (FAQ 등록 수 × 5) + (긍정 피드백 수 × 2)
 * - 레벨 1: 0-99 exp, 레벨 2: 100-299 exp, 레벨 3: 300+ exp
 * - Authorization: Bearer <supabase_access_token> 헤더 필수
 * - 본인 봇만 조회 가능 (403 Forbidden)
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
 * 다음 레벨에 필요한 경험치를 반환한다.
 * @param {number} level - 현재 레벨
 * @returns {number|null} 다음 레벨 필요 경험치 (레벨 3이면 null)
 */
function getNextLevelExp(level) {
  if (level === 1) return 100;
  if (level === 2) return 300;
  return null; // 최고 레벨
}

/**
 * 경험치를 계산한다.
 * 경험치 = (총 대화 수 × 10) + (FAQ 등록 수 × 5) + (긍정 피드백 수 × 2)
 * @param {number} totalConversations
 * @param {number} faqCount
 * @param {number} positiveFeedback
 * @returns {number} 경험치
 */
function calculateExperience(totalConversations, faqCount, positiveFeedback) {
  return (totalConversations * 10) + (faqCount * 5) + (positiveFeedback * 2);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server configuration error: missing Supabase credentials' });
  }

  // Authorization 헤더에서 Bearer 토큰 추출
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: missing Bearer token' });
  }

  // botId 쿼리 파라미터 확인
  const { botId } = req.query;
  if (!botId) {
    return res.status(400).json({ error: 'Missing required query parameter: botId' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Supabase Auth로 사용자 확인
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
      console.warn('[growth] Auth error:', authError?.message);
      return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
    }

    const userId = userData.user.id;

    // 봇이 존재하는지, 그리고 본인 봇인지 확인
    const { data: botData, error: botError } = await supabase
      .from('mcw_bots')
      .select('id, user_id')
      .eq('id', botId)
      .single();

    if (botError) {
      if (botError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Bot not found' });
      }
      console.error('[growth] Bot query error:', botError.message);
      return res.status(500).json({ error: 'Failed to fetch bot data', detail: botError.message });
    }

    if (!botData) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    // 본인 봇인지 권한 확인
    if (botData.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden: you do not own this bot' });
    }

    // bot_growth 테이블에서 성장 데이터 조회
    const { data: growthData, error: growthError } = await supabase
      .from('bot_growth')
      .select('total_conversations, total_messages, faq_count, positive_feedback, negative_feedback, avg_rating')
      .eq('bot_id', botId)
      .single();

    if (growthError && growthError.code !== 'PGRST116') {
      console.error('[growth] Growth data query error:', growthError.message);
      return res.status(500).json({ error: 'Failed to fetch growth data', detail: growthError.message });
    }

    // bot_growth 레코드가 없으면 초기값으로 응답 (레벨1, 경험치0)
    const totalConversations = growthData?.total_conversations ?? 0;
    const totalMessages = growthData?.total_messages ?? 0;
    const faqCount = growthData?.faq_count ?? 0;
    const positiveFeedback = growthData?.positive_feedback ?? 0;
    const avgRating = growthData?.avg_rating != null ? parseFloat(growthData.avg_rating) : 0;

    const experience = calculateExperience(totalConversations, faqCount, positiveFeedback);
    const level = calculateLevel(experience);
    const nextLevelExp = getNextLevelExp(level);

    return res.status(200).json({
      botId,
      level,
      experience,
      nextLevelExp,
      stats: {
        totalConversations,
        totalMessages,
        faqCount,
        avgRating,
      },
    });
  } catch (err) {
    console.error('[growth] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
