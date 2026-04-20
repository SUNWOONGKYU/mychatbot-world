# 번들 분석 리포트

> @task S9FE2
> 목표: First Load JS **≤ 200 KB** (gzip)

## 실행

```bash
# 분석 빌드 (Linux/Mac)
pnpm analyze

# Windows PowerShell
$env:ANALYZE='true'; pnpm build; Remove-Item Env:\ANALYZE

# 결과
# - .next/analyze/client.html   (브라우저 번들 시각화)
# - .next/analyze/edge.html     (edge runtime)
# - .next/analyze/nodejs.html   (server)
```

## 기준

- `next build` 출력에 각 route의 First Load JS 표시
- Target: **root (`/`) First Load ≤ 200 KB**
- 관리 페이지(`/admin/*`)는 300 KB 까지 허용 (사용 빈도 낮음)

## 감시 라이브러리 (의심 후보)

| 라이브러리 | 크기 영향 | 최적화 |
|-----------|----------|--------|
| `@supabase/supabase-js` | 중간 | 서버 전용 코드 분리 (이미 lib/supabase-server) |
| `qrcode` | 중간 | 결제 페이지에서만 dynamic import |
| `@sentry/nextjs` | 중간 | lazy load (이미 dynamic import 적용 — lib/observability/sentry.ts) |
| `web-vitals` | 소 | dynamic import (이미 적용 — lib/report-vitals.ts) |
| `react-markdown` (있다면) | 대 | 채팅 페이지만 로드 |

## 코드 스플리팅 체크리스트

- [ ] `next/dynamic` 으로 무거운 컴포넌트 lazy load
- [ ] 관리자 페이지 전용 코드는 `app/(admin)/` 그룹에 격리 (이미 구조적 분리)
- [ ] 3rd-party 스크립트는 `next/script` + `strategy="lazyOnload"`
- [ ] 아이콘은 개별 import (`lucide-react` 쓴다면 `import Foo from 'lucide-react/dist/...'`)
- [ ] 챠트 라이브러리는 필요 페이지에서만

## 측정 결과 (PO 실행 대기)

| Route | First Load JS | 상태 |
|-------|--------------:|------|
| `/` | | |
| `/skills` | | |
| `/community` | | |
| `/support` | | |
| `/chat/[id]` | | |
| `/admin/payments` | | |

## 개선 이력

- 2026-04-20: bundle-analyzer 스크립트 활성화, 리포트 템플릿 생성
- 2026-__-__: 1차 실측 + 개선 (PO 실행 후 기록)
