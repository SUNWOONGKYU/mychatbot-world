// @task S4BA2
/**
 * Revenue API — 봇 수익 조회 및 정산 요청
 * Stage: S4 — 개발 마무리 · Area: BA — Backend APIs
 *
 * Actions:
 *   GET  ?botId=XXX          — 봇 수익 집계 조회 (본인 봇만)
 *   POST ?action=settle      — 정산 요청 (최소 10,000 크레딧)
 *
 * Auth: Supabase Auth JWT (Authorization: Bearer <token>)
 * Hosting: Vercel Serverless Functions
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** 최소 정산 가능 크레딧 */
const MIN_SETTLE_CREDITS = 10000;

// ─── 헬퍼: Supabase REST 요청 ───────────────────────────────────────────────

/**
 * Supabase REST API 공통 요청 래퍼
 * @param {string} path     - /rest/v1/... 경로 (쿼리스트링 포함 가능)
 * @param {Object} options  - fetch options (method, headers, body 등)
 * @returns {Promise<{data: any, error: string|null, status: number}>}
 */
async function supabaseRequest(path, options = {}) {
  const url = `${SUPABASE_URL}${path}`;
  const headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...(options.headers || {}),
  };

  const resp = await fetch(url, { ...options, headers });
  let data = null;
  try {
    data = await resp.json();
  } catch {
    data = null;
  }

  if (!resp.ok) {
    const errMsg = data?.message || data?.error || `HTTP ${resp.status}`;
    return { data: null, error: errMsg, status: resp.status };
  }
  return { data, error: null, status: resp.status };
}

// ─── 헬퍼: 인증 토큰 검증 ────────────────────────────────────────────────────

/**
 * Authorization 헤더에서 JWT를 추출하고 Supabase Auth로 검증합니다.
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
async function verifyAuth(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return { user: null, error: '인증 토큰이 없습니다.' };
  }

  const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    return { user: null, error: '유효하지 않은 인증 토큰입니다.' };
  }

  const user = await resp.json();
  return { user, error: null };
}

// ─── 헬퍼: 봇 소유권 확인 ────────────────────────────────────────────────────

/**
 * 해당 botId가 인증된 사용자의 봇인지 확인합니다.
 * @param {string} botId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function isBotOwner(botId, userId) {
  const { data, error } = await supabaseRequest(
    `/rest/v1/bots?id=eq.${botId}&owner_id=eq.${userId}&select=id`,
    { method: 'GET' }
  );
  return !error && Array.isArray(data) && data.length > 0;
}

// ─── 액션 핸들러 ─────────────────────────────────────────────────────────────

/**
 * GET ?botId=XXX — 봇의 수익 집계를 반환합니다.
 * bot_revenue_events 테이블에서 집계합니다.
 * 응답: { total, thisMonth, byEventType, unsettled }
 */
async function handleGetRevenue(req, res) {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) {
    return res.status(401).json({ error: authError });
  }

  const { botId } = req.query;
  if (!botId) {
    return res.status(400).json({ error: 'botId 쿼리 파라미터가 필요합니다.' });
  }

  // 봇 소유권 확인
  const ownerCheck = await isBotOwner(botId, user.id);
  if (!ownerCheck) {
    return res.status(403).json({ error: '본인 소유의 봇만 조회할 수 있습니다.' });
  }

  // 이번 달 시작 날짜
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  try {
    // 전체 수익 조회
    const { data: allEvents, error: allError } = await supabaseRequest(
      `/rest/v1/bot_revenue_events?bot_id=eq.${botId}&select=amount,event_type,settled,created_at`,
      { method: 'GET' }
    );

    if (allError) {
      console.error('[revenue/get] DB error:', allError);
      return res.status(500).json({ error: '수익 조회에 실패했습니다.', detail: allError });
    }

    const events = allEvents || [];

    // 집계 계산
    const total = events.reduce((sum, e) => sum + (e.amount || 0), 0);

    const thisMonth = events
      .filter(e => e.created_at >= monthStart)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const unsettled = events
      .filter(e => !e.settled)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // event_type별 집계
    const byEventType = events.reduce((acc, e) => {
      const type = e.event_type || 'unknown';
      acc[type] = (acc[type] || 0) + (e.amount || 0);
      return acc;
    }, {});

    return res.status(200).json({
      botId,
      total,
      thisMonth,
      byEventType,
      unsettled,
    });
  } catch (err) {
    console.error('[revenue/get] Unexpected error:', err);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.', detail: err.message });
  }
}

/**
 * POST ?action=settle — 미정산 수익의 정산을 요청합니다.
 * body: { botId }
 * - 최소 10,000 크레딧 이상일 때만 정산 가능
 * - 미정산(settled=false) 이벤트를 settled=true로 업데이트
 */
async function handleSettle(req, res) {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) {
    return res.status(401).json({ error: authError });
  }

  const { botId } = req.body || {};
  if (!botId) {
    return res.status(400).json({ error: 'botId는 필수입니다.' });
  }

  // 봇 소유권 확인
  const ownerCheck = await isBotOwner(botId, user.id);
  if (!ownerCheck) {
    return res.status(403).json({ error: '본인 소유의 봇만 정산 요청할 수 있습니다.' });
  }

  // 미정산 이벤트 합계 조회
  const { data: unsettledEvents, error: unsettledError } = await supabaseRequest(
    `/rest/v1/bot_revenue_events?bot_id=eq.${botId}&settled=eq.false&select=id,amount`,
    { method: 'GET' }
  );

  if (unsettledError) {
    console.error('[revenue/settle] DB error:', unsettledError);
    return res.status(500).json({ error: '미정산 수익 조회에 실패했습니다.', detail: unsettledError });
  }

  const events = unsettledEvents || [];
  const unsettledTotal = events.reduce((sum, e) => sum + (e.amount || 0), 0);

  if (unsettledTotal < MIN_SETTLE_CREDITS) {
    return res.status(400).json({
      error: `정산 최소 금액은 ${MIN_SETTLE_CREDITS.toLocaleString()} 크레딧입니다.`,
      unsettled: unsettledTotal,
      required: MIN_SETTLE_CREDITS,
      shortage: MIN_SETTLE_CREDITS - unsettledTotal,
    });
  }

  // 미정산 이벤트 전체를 settled=true로 업데이트
  const { error: settleError } = await supabaseRequest(
    `/rest/v1/bot_revenue_events?bot_id=eq.${botId}&settled=eq.false`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        settled: true,
        settled_at: new Date().toISOString(),
      }),
    }
  );

  if (settleError) {
    console.error('[revenue/settle] Update error:', settleError);
    return res.status(500).json({ error: '정산 처리에 실패했습니다.', detail: settleError });
  }

  return res.status(200).json({
    success: true,
    botId,
    settledAmount: unsettledTotal,
    settledCount: events.length,
    settledAt: new Date().toISOString(),
    message: `${unsettledTotal.toLocaleString()} 크레딧 정산이 요청되었습니다.`,
  });
}

// ─── 메인 핸들러 ─────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 환경변수 확인
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[revenue] Missing env: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({ error: '서버 설정 오류입니다.' });
  }

  const action = req.query.action;

  try {
    // GET ?botId=XXX — 수익 조회
    if (req.method === 'GET' && req.query.botId) {
      return await handleGetRevenue(req, res);
    }

    // POST ?action=settle — 정산 요청
    if (req.method === 'POST' && action === 'settle') {
      return await handleSettle(req, res);
    }

    return res.status(400).json({
      error: '알 수 없는 요청입니다.',
      available: ['GET ?botId=XXX (수익 조회)', 'POST ?action=settle (정산 요청)'],
    });
  } catch (err) {
    console.error('[revenue] Unhandled error:', err);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.', detail: err.message });
  }
};
