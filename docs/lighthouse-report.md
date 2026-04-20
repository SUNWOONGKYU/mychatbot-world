# Lighthouse CI 리포트

> @task S9FE1
> 측정 대상: `/`, `/skills`, `/community`, `/support` (프로덕션 기준)
> 설정: `lighthouserc.json` — desktop preset, 3 runs, 기준 ≥0.9

## 자동화

### CI 워크플로 (`.github/workflows/lighthouse.yml`)
- **주간 자동**: 월요일 10:00 KST
- **수동 실행**: workflow_dispatch + target_url 입력 가능
- **실패 조건**: 카테고리별 0.9 미만
- **산출물**: `.lighthouseci/` 30일 보관

### 실행 (로컬)

```bash
# 글로벌 설치
npm install -g @lhci/cli@0.14.x

# 프로덕션 실측
lhci autorun --config=lighthouserc.json

# 특정 URL 바꿔서
lhci autorun --collect.url=https://staging.mychatbot.world/
```

## 기준

| 카테고리 | 최소 점수 | Error/Warn |
|---------|----------|-----------|
| Performance | 0.90 | error |
| Accessibility | 0.90 | error |
| Best Practices | 0.90 | error |
| SEO | 0.90 | error |

## 미달 시 개선 우선순위

### Performance
1. **이미지 최적화**: next/image 사용 확인, WebP/AVIF 전환
2. **Preload critical fonts**: next/font 적용 상태 확인
3. **JS 번들**: 코드 스플리팅 (S9FE2)
4. **Third-party scripts**: Sentry/PostHog lazy load
5. **Cache headers**: `Cache-Control: public, max-age=31536000, immutable` for /_next/static

### Accessibility
1. **명시적 label**: form 요소 전수
2. **대비비**: 텍스트 4.5:1, 대형 3:1
3. **focus-visible**: 키보드 내비게이션
4. axe-core 전수 감사 → S9FE3

### Best Practices
1. HTTPS 강제, 보안 헤더 (S7PROD1 이미 설정)
2. 콘솔 에러 0건
3. deprecated API 사용 없음

### SEO
1. `<title>`, `<meta description>` 전 페이지 존재
2. robots.txt / sitemap.xml (S9FE8)
3. JSON-LD 구조화 데이터 (S9FE6)
4. OG 태그 (S9FE7)

## 실측 결과 (PO 실행 대기)

> CI 또는 `lhci autorun` 실행 후 아래 채움.

| URL | Perf | A11y | BP | SEO | 상태 |
|-----|-----:|-----:|---:|----:|------|
| `/` | _ | _ | _ | _ | |
| `/skills` | _ | _ | _ | _ | |
| `/community` | _ | _ | _ | _ | |
| `/support` | _ | _ | _ | _ | |

## 이력

- 2026-04-20: CI/설정 기반 구축 (S9FE1)
- 2026-__-__: 1차 실측 (PO 실행 후 기록)
