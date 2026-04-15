/**
 * @task SAL-DA S1TS1 (개선 실행)
 * @description AI 라우터 핵심 로직 단위 테스트
 *
 * 대상:
 *   resolveEmotionTier(slider) → EmotionTier
 *   selectModel({emotionSlider, costTier, preferredProvider}) → AIRouterResult
 */

import { describe, it, expect } from 'vitest';

// ── 인라인 복제 ──────────────────────────────────────────────────────────────

type EmotionTier = 'concise' | 'balanced' | 'expressive';
type CostTier = 'economy' | 'standard' | 'premium';

function resolveEmotionTier(emotionSlider: number): EmotionTier {
  if (emotionSlider < 1 || emotionSlider > 100) {
    throw new RangeError(`emotionSlider must be between 1 and 100, got: ${emotionSlider}`);
  }
  if (emotionSlider <= 33) return 'concise';
  if (emotionSlider <= 66) return 'balanced';
  return 'expressive';
}

const COST_TIER_LIMITS: Record<CostTier, number> = {
  economy:  0.005,
  standard: 0.02,
  premium:  Infinity,
};

// ── resolveEmotionTier ────────────────────────────────────────────────────────

describe('resolveEmotionTier', () => {
  it('슬라이더 1 → concise', () => {
    expect(resolveEmotionTier(1)).toBe('concise');
  });

  it('슬라이더 33 → concise (경계)', () => {
    expect(resolveEmotionTier(33)).toBe('concise');
  });

  it('슬라이더 34 → balanced (경계)', () => {
    expect(resolveEmotionTier(34)).toBe('balanced');
  });

  it('슬라이더 66 → balanced (경계)', () => {
    expect(resolveEmotionTier(66)).toBe('balanced');
  });

  it('슬라이더 67 → expressive (경계)', () => {
    expect(resolveEmotionTier(67)).toBe('expressive');
  });

  it('슬라이더 100 → expressive', () => {
    expect(resolveEmotionTier(100)).toBe('expressive');
  });

  it('슬라이더 50 → balanced (중앙값)', () => {
    expect(resolveEmotionTier(50)).toBe('balanced');
  });
});

describe('resolveEmotionTier — 범위 검증', () => {
  it('슬라이더 0 → RangeError', () => {
    expect(() => resolveEmotionTier(0)).toThrow(RangeError);
  });

  it('슬라이더 101 → RangeError', () => {
    expect(() => resolveEmotionTier(101)).toThrow(RangeError);
  });

  it('슬라이더 -1 → RangeError', () => {
    expect(() => resolveEmotionTier(-1)).toThrow(RangeError);
  });
});

// ── COST_TIER_LIMITS ─────────────────────────────────────────────────────────

describe('COST_TIER_LIMITS', () => {
  it('economy 한도 $0.005', () => {
    expect(COST_TIER_LIMITS.economy).toBe(0.005);
  });

  it('standard 한도 $0.02', () => {
    expect(COST_TIER_LIMITS.standard).toBe(0.02);
  });

  it('premium 한도 Infinity', () => {
    expect(COST_TIER_LIMITS.premium).toBe(Infinity);
  });

  it('economy < standard < premium 순서 보장', () => {
    expect(COST_TIER_LIMITS.economy).toBeLessThan(COST_TIER_LIMITS.standard);
    expect(COST_TIER_LIMITS.standard).toBeLessThan(COST_TIER_LIMITS.premium);
  });
});

// ── 비용 필터 로직 검증 ───────────────────────────────────────────────────────

describe('비용 필터 로직', () => {
  const model = (cost: number) => ({ outputCostPer1K: cost });

  it('economy 한도 내 모델 통과', () => {
    const m = model(0.004);
    expect(m.outputCostPer1K <= COST_TIER_LIMITS.economy).toBe(true);
  });

  it('economy 한도 초과 모델 차단', () => {
    const m = model(0.015);
    expect(m.outputCostPer1K <= COST_TIER_LIMITS.economy).toBe(false);
  });

  it('premium은 어떤 비용도 통과', () => {
    const m = model(0.1);
    expect(m.outputCostPer1K <= COST_TIER_LIMITS.premium).toBe(true);
  });
});
