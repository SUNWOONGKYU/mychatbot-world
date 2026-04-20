/**
 * @component BrandLogo
 * @description CoCoBot 공식 브랜드 로고 (SVG 인라인)
 *
 * 근거: branding/BRAND_DEFINITION.md §3.2 구성 규칙
 * - 폰트: Pretendard Variable 800
 * - 자간: letter-spacing: -3
 * - o 3개: 앰버 #F59E0B 고정
 * - 자음 C·C·B·t: currentColor (부모 color 상속)
 *   · 다크 배경: #F8FAFC 권장
 *   · 라이트 배경: #0F172A 권장
 * - 파비콘 변형: 16~64px 구간에서만 Co 두 글자 축약
 */

interface BrandLogoProps {
  /** 로고 변형 — wordmark: 풀 CoCoBot / mark: Co 축약 (16~64px 구간 전용) */
  variant?: 'wordmark' | 'mark';
  /** 높이(px). 너비는 비율 유지하여 자동 계산 */
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function BrandLogo({
  variant = 'wordmark',
  height = 40,
  className,
  style,
}: BrandLogoProps) {
  if (variant === 'mark') {
    // Co 파비콘 마크 (16~64px 구간 전용)
    // 구조: 둥근 정사각 배경(currentColor) + Co 두 글자
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        width={height}
        height={height}
        role="img"
        aria-label="CoCoBot"
        className={className}
        style={style}
      >
        <title>CoCoBot</title>
        <rect x="0" y="0" width="200" height="200" rx="44" ry="44" fill="#0F172A" />
        <text
          x="100"
          y="138"
          textAnchor="middle"
          fontFamily="Pretendard, 'Pretendard Variable', 'Apple SD Gothic Neo', 'Segoe UI', system-ui, -apple-system, sans-serif"
          fontWeight={800}
          fontSize={120}
          letterSpacing={-4}
        >
          <tspan fill="#F8FAFC">C</tspan>
          <tspan fill="#F59E0B">o</tspan>
        </text>
      </svg>
    );
  }

  // wordmark: viewBox 620x140, 비율 ≈ 4.43:1
  const width = Math.round((height * 620) / 140);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 620 140"
      width={width}
      height={height}
      role="img"
      aria-label="CoCoBot"
      className={className}
      style={style}
    >
      <title>CoCoBot</title>
      <text
        x="310"
        y="105"
        textAnchor="middle"
        fontFamily="Pretendard, 'Pretendard Variable', 'Apple SD Gothic Neo', 'Segoe UI', system-ui, -apple-system, sans-serif"
        fontWeight={800}
        fontSize={108}
        letterSpacing={-3}
      >
        <tspan fill="currentColor">C</tspan>
        <tspan fill="#F59E0B">o</tspan>
        <tspan fill="currentColor">C</tspan>
        <tspan fill="#F59E0B">o</tspan>
        <tspan fill="currentColor">B</tspan>
        <tspan fill="#F59E0B">o</tspan>
        <tspan fill="currentColor">t</tspan>
      </text>
    </svg>
  );
}
