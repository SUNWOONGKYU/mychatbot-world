/**
 * @task S2FE2
 * @description 감성 슬라이더 컴포넌트
 *
 * 기능:
 * - 1~100 범위의 range input
 * - 왼쪽: 이성적/간결 / 오른쪽: 감성적/풍부 레이블
 * - 슬라이더 값 변경 시 onChage 콜백으로 부모에 전달
 * - 현재 선택된 모델 계층 표시 (저비용/중간/고품질)
 * - ai-router (S2BI1) 기준: 1~33 concise / 34~66 balanced / 67~100 expressive
 */

'use client';

import { useCallback, useMemo } from 'react';

// ============================
// 타입 정의
// ============================

/** 감성 슬라이더 Props */
interface EmotionSliderProps {
  /** 현재 슬라이더 값 (1~100) */
  value: number;
  /** 값 변경 콜백 */
  onChange: (value: number) => void;
}

// ============================
// 모델 계층 레이블 (ai-router S2BI1 기준)
// ============================

/** 슬라이더 값에 따른 모델 계층 정보 */
interface EmotionTierInfo {
  /** 계층 레이블 */
  label: string;
  /** 설명 */
  description: string;
  /** 배지 색상 클래스 */
  badgeClass: string;
}

/**
 * emotionLevel → 모델 계층 매핑
 * ai-router 라우팅 로직과 동일한 경계값 사용
 */
function getEmotionTierInfo(value: number): EmotionTierInfo {
  if (value <= 33) {
    return {
      label: '저비용 모델',
      description: 'Claude Haiku / GPT-3.5',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (value <= 66) {
    return {
      label: '중간 모델',
      description: 'Claude Sonnet / GPT-4o mini',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    };
  }
  return {
    label: '고품질 모델',
    description: 'Claude Opus / GPT-4o',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
  };
}

/**
 * 슬라이더 트랙 fill 색상 (CSS linear-gradient)
 * 값에 따라 primary 색상 비율 변경
 */
function getTrackStyle(value: number): React.CSSProperties {
  const pct = ((value - 1) / 99) * 100;
  return {
    background: `linear-gradient(to right, var(--color-primary, #6366f1) 0%, var(--color-primary, #6366f1) ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
  };
}

// ============================
// 컴포넌트
// ============================

/**
 * EmotionSlider
 *
 * 감성 수준을 1~100 범위로 조절하는 슬라이더.
 * 현재 값에 따라 AI 모델 계층(저비용/중간/고품질)을 표시한다.
 */
export default function EmotionSlider({ value, onChange }: EmotionSliderProps) {
  const tierInfo = useMemo(() => getEmotionTierInfo(value), [value]);
  const trackStyle = useMemo(() => getTrackStyle(value), [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = Number(e.target.value);
      if (next >= 1 && next <= 100) onChange(next);
    },
    [onChange]
  );

  return (
    <div className="w-full select-none">
      {/* 레이블 행 */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-neutral-400 font-medium">
          이성적 · 간결
        </span>

        {/* 현재 모델 계층 배지 */}
        <span
          className={[
            'text-[11px] font-semibold px-2 py-0.5 rounded-full border',
            tierInfo.badgeClass,
          ].join(' ')}
          title={tierInfo.description}
        >
          {tierInfo.label}
        </span>

        <span className="text-[11px] text-neutral-400 font-medium">
          감성적 · 풍부
        </span>
      </div>

      {/* range input */}
      <input
        type="range"
        min={1}
        max={100}
        step={1}
        value={value}
        onChange={handleChange}
        style={trackStyle}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 emotion-range"
        aria-label={`감성 슬라이더: ${value}`}
      />

      {/* 하단 값 표시 */}
      <div className="flex justify-center mt-1">
        <span className="text-[10px] text-neutral-400">
          감성 수준 {value} · {tierInfo.description}
        </span>
      </div>

      {/* range thumb 스타일 (Tailwind JIT 미지원 → inline style tag) */}
      <style>{`
        .emotion-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-primary, #6366f1);
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          cursor: pointer;
          transition: transform 0.1s;
        }
        .emotion-range::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .emotion-range::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-primary, #6366f1);
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
