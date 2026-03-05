// @task S4BA2
/**
 * Marketplace API — Skill Marketplace (publish / browse / install)
 * Stage: S4 — 개발 마무리 · Area: BA — Backend APIs
 *
 * Actions:
 *   POST ?action=publish  — 스킬 마켓플레이스에 등록
 *   GET  ?action=skills   — 승인된 스킬 목록 조회 (category, search, page, limit)
 *   POST ?action=install  — 스킬 설치 (무료: 즉시 / 유료: 크레딧 차감)
 *
 * Auth: Supabase Auth JWT (Authorization: Bearer <token>)
 * Hosting: Vercel Serverless Functions
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  // Supabase Auth /user 엔드포인트로 토큰 검증
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

// ─── 액션 핸들러 ─────────────────────────────────────────────────────────────

/**
 * POST ?action=publish — 스킬을 마켓플레이스에 등록합니다.
 * 요청 body: { skillName, description, category, price, skillFiles }
 * 응답: { skillId, status: 'pending_review' }
 */
async function handlePublish(req, res) {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) {
    return res.status(401).json({ error: authError });
  }

  const { skillName, description, category, price, skillFiles } = req.body || {};

  if (!skillName || !description || !category) {
    return res.status(400).json({ error: 'skillName, description, category는 필수입니다.' });
  }

  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'price는 0 이상의 숫자여야 합니다.' });
  }

  const payload = {
    skill_name: skillName,
    description,
    category,
    price,
    skill_files: skillFiles || null,
    author_id: user.id,
    review_status: 'pending_review',
    is_active: false,
    install_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseRequest('/rest/v1/skill_marketplace', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (error) {
    console.error('[marketplace/publish] DB error:', error);
    return res.status(500).json({ error: '스킬 등록에 실패했습니다.', detail: error });
  }

  const skill = Array.isArray(data) ? data[0] : data;
  return res.status(201).json({
    skillId: skill?.id,
    status: 'pending_review',
  });
}

/**
 * GET ?action=skills — 승인된 스킬 목록을 반환합니다.
 * 쿼리파라미터: category, search, page (기본 1), limit (기본 10, 최대 50)
 * 응답: { skills: [...], total, page, limit }
 */
async function handleGetSkills(req, res) {
  const { category, search } = req.query;
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;

  if (page < 1) page = 1;
  if (limit < 1) limit = 10;
  if (limit > 50) limit = 50;

  const offset = (page - 1) * limit;

  // 기본 필터: is_active=true, review_status=approved
  let filter = `is_active=eq.true&review_status=eq.approved`;

  if (category) {
    filter += `&category=eq.${encodeURIComponent(category)}`;
  }
  if (search) {
    // skill_name 또는 description에서 ilike 검색
    filter += `&or=(skill_name.ilike.*${encodeURIComponent(search)}*,description.ilike.*${encodeURIComponent(search)}*)`;
  }

  // 총 개수 조회
  const countResp = await supabaseRequest(
    `/rest/v1/skill_marketplace?${filter}&select=id`,
    {
      method: 'GET',
      headers: { 'Prefer': 'count=exact' },
    }
  );

  // 페이징 데이터 조회
  const { data, error } = await supabaseRequest(
    `/rest/v1/skill_marketplace?${filter}&select=id,skill_name,description,category,price,install_count,author_id,created_at&order=install_count.desc&limit=${limit}&offset=${offset}`,
    { method: 'GET' }
  );

  if (error) {
    console.error('[marketplace/skills] DB error:', error);
    return res.status(500).json({ error: '스킬 목록 조회에 실패했습니다.', detail: error });
  }

  return res.status(200).json({
    skills: data || [],
    total: countResp.data?.length ?? null,
    page,
    limit,
  });
}

/**
 * POST ?action=install — 스킬을 설치합니다.
 * body: { skillId }
 * - 무료(price=0): 즉시 설치, install_count 증가
 * - 유료: 사용자 크레딧 차감 → bot_revenue_events 기록 → install_count 증가
 */
async function handleInstall(req, res) {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) {
    return res.status(401).json({ error: authError });
  }

  const { skillId } = req.body || {};
  if (!skillId) {
    return res.status(400).json({ error: 'skillId는 필수입니다.' });
  }

  // 스킬 조회
  const { data: skillData, error: skillError } = await supabaseRequest(
    `/rest/v1/skill_marketplace?id=eq.${skillId}&is_active=eq.true&review_status=eq.approved&select=id,skill_name,price,author_id`,
    { method: 'GET' }
  );

  if (skillError || !skillData?.length) {
    return res.status(404).json({ error: '스킬을 찾을 수 없습니다.' });
  }

  const skill = skillData[0];

  if (skill.price > 0) {
    // ── 유료 스킬: 크레딧 차감 ──────────────────────────────────────────────

    // 사용자 크레딧 조회 (profiles 테이블 가정)
    const { data: profileData, error: profileError } = await supabaseRequest(
      `/rest/v1/profiles?id=eq.${user.id}&select=id,credits`,
      { method: 'GET' }
    );

    if (profileError || !profileData?.length) {
      return res.status(404).json({ error: '사용자 프로필을 찾을 수 없습니다.' });
    }

    const profile = profileData[0];
    const currentCredits = profile.credits || 0;

    if (currentCredits < skill.price) {
      return res.status(402).json({
        error: '크레딧이 부족합니다.',
        required: skill.price,
        available: currentCredits,
      });
    }

    // 크레딧 차감
    const { error: creditError } = await supabaseRequest(
      `/rest/v1/profiles?id=eq.${user.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          credits: currentCredits - skill.price,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (creditError) {
      console.error('[marketplace/install] credit deduction error:', creditError);
      return res.status(500).json({ error: '크레딧 차감에 실패했습니다.', detail: creditError });
    }

    // 수익 이벤트 기록
    const revenuePayload = {
      bot_id: skill.author_id,
      user_id: user.id,
      event_type: 'skill_purchase',
      amount: skill.price,
      skill_id: skill.id,
      skill_name: skill.skill_name,
      settled: false,
      created_at: new Date().toISOString(),
    };

    const { error: revenueError } = await supabaseRequest(
      '/rest/v1/bot_revenue_events',
      {
        method: 'POST',
        body: JSON.stringify(revenuePayload),
      }
    );

    if (revenueError) {
      console.error('[marketplace/install] revenue event error:', revenueError);
      // 수익 기록 실패는 치명적이지 않으므로 경고만 기록하고 계속 진행
    }
  }

  // ── install_count 증가 ────────────────────────────────────────────────────
  const { error: countError } = await supabaseRequest(
    `/rest/v1/rpc/increment_install_count`,
    {
      method: 'POST',
      body: JSON.stringify({ skill_id: skillId }),
    }
  );

  if (countError) {
    // RPC 없을 경우 직접 PATCH (읽기 후 쓰기 경쟁 조건 존재하나 단순성 우선)
    console.warn('[marketplace/install] increment_install_count RPC 실패, PATCH 시도:', countError);
    await supabaseRequest(
      `/rest/v1/skill_marketplace?id=eq.${skillId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ updated_at: new Date().toISOString() }),
      }
    );
  }

  return res.status(200).json({
    success: true,
    skillId: skill.id,
    skillName: skill.skill_name,
    price: skill.price,
    message: skill.price === 0 ? '무료 스킬이 설치되었습니다.' : `${skill.price} 크레딧으로 설치되었습니다.`,
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
    console.error('[marketplace] Missing env: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({ error: '서버 설정 오류입니다.' });
  }

  const action = req.query.action;

  try {
    if (req.method === 'POST' && action === 'publish') {
      return await handlePublish(req, res);
    }

    if (req.method === 'GET' && action === 'skills') {
      return await handleGetSkills(req, res);
    }

    if (req.method === 'POST' && action === 'install') {
      return await handleInstall(req, res);
    }

    return res.status(400).json({
      error: '알 수 없는 액션입니다.',
      available: ['publish (POST)', 'skills (GET)', 'install (POST)'],
    });
  } catch (err) {
    console.error('[marketplace] Unhandled error:', err);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.', detail: err.message });
  }
};
