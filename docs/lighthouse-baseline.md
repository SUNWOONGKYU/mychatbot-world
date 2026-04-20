# Lighthouse Baseline — CoCoBot World

> @task S8FE1 — Lighthouse 실측 + 개선 기준선

## 목표

| 카테고리 | 목표 | 임계 (CI fail) |
|---------|------|---------------|
| Performance | ≥ 90 | < 90 |
| Accessibility | ≥ 90 | < 90 |
| Best Practices | ≥ 90 | < 90 |
| SEO | ≥ 90 | < 90 |

## 측정 대상 URL

1. `/` — 랜딩 / 홈
2. `/skills` — 스킬 카탈로그 (CollectionPage)
3. `/community` — 커뮤니티 (CollectionPage)
4. `/support` — 고객센터 (ContactPage)

측정 설정: desktop preset, `simulate` throttling, 3 runs per URL (median).

## 실행 방법

### 로컬 (개발자 PC)

```bash
npm install -g @lhci/cli@0.14.x
lhci autorun --config=lighthouserc.json
```

결과는 `.lighthouseci/` 에 저장, 임시 공개 스토리지에 업로드되어 URL 확인 가능.

### CI (GitHub Actions)

```
Actions → "Lighthouse CI" → Run workflow → (선택) target_url 입력
```

- 매주 월요일 01:00 UTC 자동 실행 (주간 회귀 감지).
- 결과 artifact: `lighthouse-report` (30일 보관).

## Baseline 기록

### 2026-04-20 최초 기록 (S7 MBO 완료 시점 추정)

> 실 측정은 CI 최초 실행 후 본 문서에 기록. 초기 추정값은 S5/S6/S7 단계에서 적용한 다음 최적화로부터:

| URL | Perf | A11y | BP | SEO | 비고 |
|-----|:----:|:----:|:--:|:---:|------|
| `/` | ~88 | ~92 | ~95 | ~100 | OG 이미지, JSON-LD 반영 후 |
| `/skills` | ~90 | ~93 | ~95 | ~100 | CollectionPage JSON-LD |
| `/community` | ~87 | ~90 | ~95 | ~100 | 이미지 지연로딩 필요 |
| `/support` | ~91 | ~94 | ~100 | ~100 | ContactPage JSON-LD |

> 위 값은 **예측값**. 정확한 수치는 첫 CI 실행 후 본 섹션을 업데이트한다.

## 개선 가이드 (재측정 시 90 미만이면)

### Performance < 90

1. **LCP 개선** — 히어로 이미지 `priority` + `next/image` + WebP/AVIF
2. **JS 줄이기** — `next/dynamic` 로 사용자 상호작용 이전엔 비로드
3. **폰트** — `display=swap` + 로컬 호스팅 + subset
4. **Third-party script** — Vercel Analytics 외 제거/지연

### Accessibility < 90

1. `button`/`a` 텍스트 누락 → aria-label
2. 콘트라스트 비율 4.5:1 미만 → Tailwind 색상 토큰 재검토
3. form label 연결 누락 → `htmlFor` 일관성
4. heading 순서 오류 → h1 1개 원칙, 단계 스킵 금지

### Best Practices < 90

1. Mixed content — 모든 외부 리소스 HTTPS
2. `console.error` 노출 → 개발 전용 가드
3. 취약한 라이브러리 — `npm audit fix`
4. 이미지 원본 크기 > 표시 크기 초과 → `next/image` width/height 정확히

### SEO < 90

1. `<meta name="description">` 누락 → 각 페이지 metadata export
2. `robots.txt` / `sitemap.xml` 누락 → S5FE8 이미 완료됨 (검증)
3. link text "click here" → 의미 있는 앵커

## 리그레션 가드

CI 가 `error` 임계(< 90)에 걸리면 자동으로 실패 → merge 차단.
일시적 외부 원인(OpenRouter 느림 등)일 경우 재실행으로 해소.
지속 실패는 원인 분석 후 상한 완화 대신 개선으로 대응.

## 관련

- 번들 크기 모니터링은 Vercel Deploy Summary 참조.
- Core Web Vitals 실 사용자 값은 Vercel Analytics `Web Vitals` 탭 확인.
- 후속 개선은 S8FE1 종료 후 `docs/perf-log.md` 에 누적 기록.
