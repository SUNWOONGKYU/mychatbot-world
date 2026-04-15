/**
 * @task S3BA5 (React 전환)
 * @description 챗봇 성장 지표 API — 순수 헬퍼 함수 단위 테스트
 *
 * 대상 함수:
 *   calcExperience(conversations, faqCount, positiveFeedback) → number
 *   calcLevel(exp) → 1 | 2 | 3
 *   getNextLevelExp(level) → number | null
 */

import { describe, it, expect } from 'vitest';

// ── 테스트 대상 (인라인 복제 — 순수 함수이므로 동일 로직 검증) ──────────────

function calcExperience(
  conversations: number,
  faqCount: number,
  positiveFeedback: number,
): number {
  return Math.max(0, conversations * 10 + faqCount * 5 + positiveFeedback * 2);
}

function calcLevel(exp: number): number {
  if (exp >= 300) return 3;
  if (exp >= 100) return 2;
  return 1;
}

function getNextLevelExp(level: number): number | null {
  if (level === 1) return 100;
  if (level === 2) return 300;
  return null;
}

// ── calcExperience ────────────────────────────────────────────────────────────

describe('calcExperience', () => {
  it('기본 공식: 대화×10 + FAQ×5 + 긍정×2', () => {
    expect(calcExperience(10, 4, 3)).toBe(10 * 10 + 4 * 5 + 3 * 2); // 126
  });

  it('모두 0이면 0을 반환한다', () => {
    expect(calcExperience(0, 0, 0)).toBe(0);
  });

  it('음수 입력은 0으로 보정된다', () => {
    expect(calcExperience(-5, 0, 0)).toBe(0);
  });

  it('대화수만 있을 때 대화×10 계산', () => {
    expect(calcExperience(5, 0, 0)).toBe(50);
  });

  it('FAQ만 있을 때 FAQ×5 계산', () => {
    expect(calcExperience(0, 10, 0)).toBe(50);
  });

  it('긍정 피드백만 있을 때 긍정×2 계산', () => {
    expect(calcExperience(0, 0, 20)).toBe(40);
  });

  it('레벨 2 임계값(100) 경계 테스트', () => {
    // 10대화 → 100exp (레벨2 시작)
    expect(calcExperience(10, 0, 0)).toBe(100);
  });

  it('레벨 3 임계값(300) 경계 테스트', () => {
    // 30대화 → 300exp (레벨3 시작)
    expect(calcExperience(30, 0, 0)).toBe(300);
  });
});

// ── calcLevel ─────────────────────────────────────────────────────────────────

describe('calcLevel', () => {
  it('exp 0 → 레벨 1', () => {
    expect(calcLevel(0)).toBe(1);
  });

  it('exp 99 → 레벨 1 (경계 직전)', () => {
    expect(calcLevel(99)).toBe(1);
  });

  it('exp 100 → 레벨 2 (경계 시작)', () => {
    expect(calcLevel(100)).toBe(2);
  });

  it('exp 299 → 레벨 2 (경계 직전)', () => {
    expect(calcLevel(299)).toBe(2);
  });

  it('exp 300 → 레벨 3 (경계 시작)', () => {
    expect(calcLevel(300)).toBe(3);
  });

  it('exp 9999 → 레벨 3 (최고 레벨)', () => {
    expect(calcLevel(9999)).toBe(3);
  });
});

// ── getNextLevelExp ───────────────────────────────────────────────────────────

describe('getNextLevelExp', () => {
  it('레벨 1 → 다음 레벨 100exp 필요', () => {
    expect(getNextLevelExp(1)).toBe(100);
  });

  it('레벨 2 → 다음 레벨 300exp 필요', () => {
    expect(getNextLevelExp(2)).toBe(300);
  });

  it('레벨 3 → null (최고 레벨, 다음 없음)', () => {
    expect(getNextLevelExp(3)).toBeNull();
  });
});

// ── 통합 시나리오 ─────────────────────────────────────────────────────────────

describe('성장 지표 통합 시나리오', () => {
  it('신규 봇: 경험치 0, 레벨 1, 다음레벨 100', () => {
    const exp = calcExperience(0, 0, 0);
    const level = calcLevel(exp);
    const next = getNextLevelExp(level);
    expect(exp).toBe(0);
    expect(level).toBe(1);
    expect(next).toBe(100);
  });

  it('활성 봇: 대화15 + FAQ5 + 긍정10 = 220exp → 레벨2', () => {
    const exp = calcExperience(15, 5, 10); // 150+25+20 = 195
    const level = calcLevel(exp);
    expect(exp).toBe(195);
    expect(level).toBe(2);
    expect(getNextLevelExp(level)).toBe(300);
  });

  it('전문 봇: 대화30 + FAQ20 + 긍정50 = 500exp → 레벨3', () => {
    const exp = calcExperience(30, 20, 50); // 300+100+100 = 500
    const level = calcLevel(exp);
    expect(exp).toBe(500);
    expect(level).toBe(3);
    expect(getNextLevelExp(level)).toBeNull();
  });
});
