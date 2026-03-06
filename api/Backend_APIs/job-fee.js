// @task S3BA6
/**
 * Job Fee Calculator API - Vercel Serverless Function
 * POST /api/Backend_APIs/job-fee
 *
 * 구봇구직 수수료 계산 API
 * - 거래액 입력 → 수수료율 및 수수료 금액 산정
 * - 기본 수수료율: 10%
 * - 단계별 할인:
 *   - 100만원 이상: 8%
 *   - 500만원 이상: 5%
 * - 수수료 = 거래액 × 수수료율
 * - 인증 불필요 (공개 계산 엔드포인트)
 *
 * 요청 바디:
 *   { amount: number, currency?: 'KRW'|'USD' }
 *
 * 응답:
 *   {
 *     amount: number,          — 거래액
 *     currency: string,        — 통화 (기본 KRW)
 *     feeRate: number,         — 수수료율 (0~1)
 *     feeRatePercent: string,  — "10%", "8%", "5%"
 *     feeAmount: number,       — 수수료 금액
 *     netAmount: number,       — 실수령액 (거래액 - 수수료)
 *     tier: string,            — 적용 구간 이름
 *   }
 */

/** 수수료 구간 정의 (오름차순 정렬, amount 기준 원화 KRW) */
const FEE_TIERS = [
  {
    name: 'standard',
    label: '기본',
    minAmount: 0,
    rate: 0.10,
    description: '거래액 100만원 미만',
  },
  {
    name: 'silver',
    label: '실버',
    minAmount: 1_000_000,
    rate: 0.08,
    description: '거래액 100만원 이상',
  },
  {
    name: 'gold',
    label: '골드',
    minAmount: 5_000_000,
    rate: 0.05,
    description: '거래액 500만원 이상',
  },
];

/** USD → KRW 기준 환율 (정적 기준값, 실시간 연동은 별도 서비스 필요) */
const USD_TO_KRW = 1350;

/**
 * 거래액(KRW 기준)에 해당하는 수수료 구간을 반환합니다.
 * 가장 높은 minAmount를 초과하는 구간 중 조건을 만족하는 마지막 구간 선택.
 * @param {number} amountKrw - KRW 기준 거래액
 * @returns {Object} 해당 수수료 구간 객체
 */
function getFeeТier(amountKrw) {
  let tier = FEE_TIERS[0];
  for (const t of FEE_TIERS) {
    if (amountKrw >= t.minAmount) {
      tier = t;
    }
  }
  return tier;
}

/**
 * 수수료를 계산하여 결과 객체를 반환합니다.
 * @param {number} amount - 거래액
 * @param {string} currency - 통화 코드 ('KRW' 또는 'USD')
 * @returns {Object} 수수료 계산 결과
 */
function calculateFee(amount, currency) {
  // KRW 기준으로 구간 결정
  const amountKrw = currency === 'USD' ? amount * USD_TO_KRW : amount;

  const tier = getFeeТier(amountKrw);
  const feeAmount = Math.round(amount * tier.rate);
  const netAmount = amount - feeAmount;

  return {
    amount,
    currency,
    feeRate: tier.rate,
    feeRatePercent: `${(tier.rate * 100).toFixed(0)}%`,
    feeAmount,
    netAmount,
    tier: tier.name,
    tierLabel: tier.label,
    tierDescription: tier.description,
  };
}

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

  try {
    const { amount: rawAmount, currency: rawCurrency = 'KRW' } = req.body || {};

    // 거래액 유효성 검증
    if (rawAmount === undefined || rawAmount === null) {
      return res.status(400).json({ error: 'amount is required' });
    }

    const amount = parseFloat(rawAmount);

    if (isNaN(amount)) {
      return res.status(400).json({ error: 'amount must be a valid number' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'amount must be greater than 0' });
    }

    // 최대 거래액 제한 (1조 KRW / 약 7.4억 USD)
    const MAX_AMOUNT_KRW = 1_000_000_000_000;
    const currency = (rawCurrency || 'KRW').toUpperCase();

    if (!['KRW', 'USD'].includes(currency)) {
      return res.status(400).json({ error: 'currency must be KRW or USD' });
    }

    const amountKrw = currency === 'USD' ? amount * USD_TO_KRW : amount;

    if (amountKrw > MAX_AMOUNT_KRW) {
      return res.status(400).json({ error: 'amount exceeds maximum allowed limit' });
    }

    const result = calculateFee(amount, currency);

    // 전체 구간 참고 정보도 함께 제공
    const allTiers = FEE_TIERS.map(t => ({
      name: t.name,
      label: t.label,
      minAmount: t.minAmount,
      rate: t.rate,
      ratePercent: `${(t.rate * 100).toFixed(0)}%`,
      description: t.description,
    }));

    return res.status(200).json({
      ...result,
      allTiers,
    });
  } catch (err) {
    console.error('[job-fee] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
