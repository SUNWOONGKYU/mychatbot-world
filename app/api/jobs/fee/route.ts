/**
 * @task S3BA6 (React 전환)
 * @description 구봇구직 수수료 계산 API
 *
 * Vanilla 원본: api/Backend_APIs/job-fee.js
 *
 * POST /api/jobs/fee
 *   요청: { amount: number, currency?: 'KRW' | 'USD' }
 *   응답: { amount, currency, feeRate, feeRatePercent, feeAmount, netAmount, tier }
 *
 * 수수료 구간:
 *   기본(standard) : 거래액 100만원 미만 → 10%
 *   실버(silver)   : 100만원 이상         →  8%
 *   골드(gold)     : 500만원 이상         →  5%
 *
 * 인증 불필요 (공개 계산 엔드포인트)
 */

import { NextRequest, NextResponse } from 'next/server';

const USD_TO_KRW = 1350;

interface FeeTier {
  name: string;
  label: string;
  minAmount: number; // KRW 기준
  rate: number;
  description: string;
}

const FEE_TIERS: FeeTier[] = [
  { name: 'standard', label: '기본', minAmount: 0,         rate: 0.10, description: '거래액 100만원 미만' },
  { name: 'silver',   label: '실버', minAmount: 1_000_000, rate: 0.08, description: '거래액 100만원 이상' },
  { name: 'gold',     label: '골드', minAmount: 5_000_000, rate: 0.05, description: '거래액 500만원 이상' },
];

function getTier(amountKrw: number): FeeTier {
  let tier = FEE_TIERS[0];
  for (const t of FEE_TIERS) {
    if (amountKrw >= t.minAmount) tier = t;
  }
  return tier;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { amount?: unknown; currency?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const rawAmount = Number(body.amount);
  if (!Number.isFinite(rawAmount) || rawAmount < 0) {
    return NextResponse.json({ error: 'amount는 0 이상의 숫자여야 합니다.' }, { status: 400 });
  }

  const currency = String(body.currency ?? 'KRW').toUpperCase();
  if (currency !== 'KRW' && currency !== 'USD') {
    return NextResponse.json({ error: "currency는 'KRW' 또는 'USD'만 허용됩니다." }, { status: 400 });
  }

  const amountKrw = currency === 'USD' ? rawAmount * USD_TO_KRW : rawAmount;
  const tier = getTier(amountKrw);

  const feeAmount = Math.round(rawAmount * tier.rate);
  const netAmount = rawAmount - feeAmount;

  return NextResponse.json({
    amount:         rawAmount,
    currency,
    feeRate:        tier.rate,
    feeRatePercent: `${Math.round(tier.rate * 100)}%`,
    feeAmount,
    netAmount,
    tier: {
      name:        tier.name,
      label:       tier.label,
      description: tier.description,
    },
  });
}
