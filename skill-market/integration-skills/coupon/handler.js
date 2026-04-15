/**
 * Coupon Skill Handler
 * 쿠폰 발급 스킬 — 쿠폰 코드 생성, 유효기간 설정, 유효성 검증
 *
 * Actions:
 *   issue    — 새 쿠폰 발급 (코드 생성 + Supabase 저장)
 *   validate — 쿠폰 유효성 검증 (만료/사용 여부 확인)
 *
 * [FIX] handleCoupon 시그니처가 skill-integrations.js 호출과 불일치: (req, res, action, payload, botId) → 래퍼 추가
 * [FIX] expiryDays 입력값 범위 검증 추가 (음수/비정상 값 방지)
 * [FIX] validateCoupon: botId null 가드 추가
 * [FIX] coupon 객체 전체를 응답에 반환하지 않도록 민감 필드 노출 최소화
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * 쿠폰 스킬 메인 핸들러 (내부 직접 호출용 — 순수 객체 반환)
 * @param {string} action - 'issue' | 'validate'
 * @param {object} payload - 요청 파라미터
 * @param {string} botId - 봇 ID (쿠폰 소유 식별용)
 * @returns {object} 처리 결과 (success, error 등)
 */
export async function handleCoupon(action, payload, botId) {
  switch (action) {
    case 'issue':
      return issueCoupon(payload, botId);
    case 'validate':
      return validateCoupon(payload, botId);
    default:
      return { error: `Unknown action: ${action}`, status: 400 };
  }
}

/**
 * skill-integrations.js 라우터 호환 래퍼 (req, res 시그니처)
 * skill-integrations.js: case 'coupon': return await handleCoupon(req, res, action, payload, botId);
 */
export async function routeCoupon(req, res, action, payload, botId) {
  const result = await handleCoupon(action, payload, botId);
  if (result.status === 400 || (result.error && !result.success)) {
    const statusCode = result.status || 400;
    return res.status(statusCode).json({ error: result.error });
  }
  return res.status(200).json(result);
}

/**
 * 쿠폰 발급
 * - 암호학적으로 안전한 랜덤 코드 생성 (MCW-XXXXXX)
 * - 유효기간 계산 (기본 30일)
 * - Supabase skill_coupons 테이블에 저장 (실패 시 폴백)
 *
 * @param {object} payload
 * @param {string} [payload.recipientName] - 수령인 이름 (없으면 '고객')
 * @param {number} [payload.expiryDays=30] - 유효기간 일수
 * @param {string} [payload.discountLabel] - 할인 설명 (예: '10% 할인')
 * @param {string} botId
 */
async function issueCoupon(payload, botId) {
  const { recipientName, expiryDays, discountLabel } = payload || {};
  const rawExpiry = parseInt(expiryDays);
  // expiryDays 범위 검증: 1~365일
  const expiry = (!isNaN(rawExpiry) && rawExpiry >= 1 && rawExpiry <= 365) ? rawExpiry : 30;
  const recipient = (recipientName && typeof recipientName === 'string')
    ? recipientName.trim().slice(0, 100)
    : '고객';

  // 암호학적으로 안전한 쿠폰 코드 생성
  const code = await generateCouponCode();

  // 유효기간 계산
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiry);
  const expiryStr = expiryDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Supabase 저장 시도
  const saved = await saveCoupon({
    bot_id: botId,
    code,
    recipient_name: recipient,
    expiry_date: expiryDate.toISOString(),
    discount_label: discountLabel || '',
    is_used: false
  });

  if (!saved) {
    // DB 저장 실패 시에도 쿠폰 코드는 반환 (MVP 폴백)
    console.warn('[Coupon] DB save failed, returning code without persistence:', code);
  }

  const discountInfo = discountLabel ? ` (${discountLabel})` : '';

  return {
    success: true,
    code,
    expiryDate: expiryStr,
    expiryDays: expiry,
    recipientName: recipient,
    persisted: saved,
    message: `${recipient}님께 쿠폰이 발급되었습니다!\n쿠폰 코드: **${code}**${discountInfo}\n유효기간: ${expiryStr}까지`
  };
}

/**
 * 쿠폰 유효성 검증
 * - DB에서 쿠폰 존재 여부 확인
 * - 만료 여부 확인 (expiry_date < now)
 * - 사용 여부 확인 (is_used)
 *
 * @param {object} payload
 * @param {string} payload.code - 검증할 쿠폰 코드
 * @param {string} botId
 */
async function validateCoupon(payload, botId) {
  const { code } = payload || {};
  if (!code) {
    return { error: 'code is required', status: 400 };
  }
  if (!botId) {
    return { error: 'botId is required', status: 400 };
  }

  const normalizedCode = code.trim().toUpperCase();

  // DB 조회: 해당 봇의 미사용 쿠폰 중 코드 일치 여부
  const resp = await sbSelect(
    'skill_coupons',
    `bot_id=eq.${encodeURIComponent(botId)}&code=eq.${encodeURIComponent(normalizedCode)}`
  );

  if (!resp || !resp.ok) {
    return {
      valid: false,
      message: '쿠폰 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    };
  }

  const data = await resp.json();

  // 쿠폰 미존재
  if (!Array.isArray(data) || data.length === 0) {
    return {
      valid: false,
      code: normalizedCode,
      message: `입력하신 쿠폰 코드(${normalizedCode})를 찾을 수 없습니다.`
    };
  }

  const coupon = data[0];

  // 이미 사용된 쿠폰
  if (coupon.is_used) {
    return {
      valid: false,
      code: normalizedCode,
      usedAt: coupon.used_at,
      message: `이미 사용된 쿠폰입니다. (코드: ${normalizedCode})`
    };
  }

  // 만료 여부 확인
  const now = new Date();
  const expiryDate = new Date(coupon.expiry_date);
  if (expiryDate < now) {
    const expiryStr = expiryDate.toLocaleDateString('ko-KR');
    return {
      valid: false,
      code: normalizedCode,
      expiryDate: expiryStr,
      message: `만료된 쿠폰입니다. (유효기간: ${expiryStr}까지)`
    };
  }

  // 유효한 쿠폰
  const remainingDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  const expiryStr = expiryDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const discountInfo = coupon.discount_label ? ` — ${coupon.discount_label}` : '';

  // 민감 필드 노출 최소화: 쿠폰 원본 객체 대신 안전한 필드만 반환
  return {
    valid: true,
    code: normalizedCode,
    couponId: coupon.id,
    discountLabel: coupon.discount_label || null,
    recipientName: coupon.recipient_name || null,
    expiryDate: expiryStr,
    remainingDays,
    message: `유효한 쿠폰입니다!${discountInfo}\n유효기간: ${expiryStr}까지 (${remainingDays}일 남음)`
  };
}

/**
 * 쿠폰 사용 처리 (is_used = true 업데이트)
 * validateCoupon 후 실제 사용 처리에 호출
 *
 * @param {string} code - 사용 처리할 쿠폰 코드
 * @param {string} botId
 */
export async function markCouponUsed(code, botId) {
  const normalizedCode = code.trim().toUpperCase();

  const resp = await sbUpdate(
    'skill_coupons',
    `bot_id=eq.${encodeURIComponent(botId)}&code=eq.${encodeURIComponent(normalizedCode)}`,
    { is_used: true, used_at: new Date().toISOString() }
  );

  return resp && resp.ok;
}

// ─── 쿠폰 코드 생성 (MCW-XXXXXX) ───────────────────────────────────────────

/**
 * 암호학적으로 안전한 쿠폰 코드 생성
 * 형식: MCW-[6자리 대문자 16진수] (예: MCW-A3F9C2)
 * crypto.randomBytes 사용으로 예측 불가능
 */
async function generateCouponCode() {
  const { randomBytes } = await import('crypto');
  const hex = randomBytes(4).toString('hex').toUpperCase();
  return `MCW-${hex.slice(0, 6)}`;
}

// ─── Supabase Helpers ────────────────────────────────────────────────────────

async function saveCoupon(data) {
  try {
    const resp = await sbInsert('skill_coupons', data);
    return resp && resp.ok;
  } catch {
    return false;
  }
}

function sbInsert(table, data) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
}

function sbSelect(table, query) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  });
}

function sbUpdate(table, query, data) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
}
