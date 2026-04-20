# S7TS1 Lighthouse 대체 정적 분석

**작성일**: 2026-04-20
**목적**: 한글 경로 환경 제약으로 Lighthouse 런타임 실행 불가 → 정적 코드 분석 기반 예상 점수 근거 제공
**실측 환경**: Vercel 배포 후 PO가 직접 수행 필요

---

## 1. Performance 예상 점수 (목표: 85+)

### 1-1. 이미지 최적화
- **Next.js `<Image>` 미사용 현황**: `app/` 내 `<img>` 사용 7건, `<Image>` 사용 7건 (커뮤니티/마이페이지 등)
- **alt 속성**: 전건 보유 (누락 0건 확인)
- **lazy loading**: Next.js `<Image>` 기본 lazy + `priority` prop 미지정 시 LCP 이미지에 지연 가능성
  - **권고**: HeroSection h1 영역 배경 이미지에 priority 확인 필요 (현재 CSS background 사용 — 자동 최적화)
- **SVG inline 사용**: GoogleIcon, LoadingSpinner 등 SVG inline — 번들 크기 최소화

### 1-2. 폰트 최적화
- **Pretendard(font-sans)**: `app/layout.tsx` 또는 `globals.css` 에서 정의 — subset 여부는 런타임 확인 필요
- **권고**: `font-display: swap` 적용 여부 Vercel 배포 후 Network 탭 확인

### 1-3. Bundle 크기 추정
- **Radix UI 의존성**: `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-toast`, `@radix-ui/react-popover`, `@radix-ui/react-tooltip` — 트리쉐이킹 지원
- **TanStack Table**: `@tanstack/react-table` — DataTable에서만 사용, 코드스플리팅 적용 여부 확인 필요
- **CVA (class-variance-authority)**: 경량 (~1.5KB gzipped)
- **Next.js App Router**: 페이지별 서버/클라이언트 분리 — 초기 번들 최적화

### 1-4. Core Web Vitals 예상
| 지표 | 예상 | 근거 |
|------|------|------|
| LCP | GOOD 가능 | HeroSection h1이 CSS background 사용 (이미지 LCP 아님), 텍스트 LCP |
| CLS | GOOD 가능 | Semantic 토큰 CSS 변수 기반, 폰트 로드 시 CLS 위험 있음 |
| INP | 측정 필요 | 클라이언트 컴포넌트 hydration 지연 가능성 |

---

## 2. A11y 예상 점수 (목표: 95+)

### 정적 체크리스트 기반 근거

| Lighthouse A11y 항목 | 정적 분석 결과 |
|----------------------|----------------|
| `button-name` | PASS — 모든 아이콘 버튼 `aria-label` 한국어 명시 |
| `color-contrast` | PENDING — Semantic 토큰(S7FE1 팔레트 WCAG AA 설계) 기반이므로 PASS 추정, 실측 필요 |
| `document-title` | PASS — Next.js `<title>` 메타 각 페이지 관리 |
| `duplicate-id-aria` | PASS — `useId()` 전역 사용, 중복 없음 |
| `form-field-multiple-labels` | PASS — Field 컴포넌트 단일 label 연결 |
| `heading-order` | PASS (페이지 구조: h1→h2→h3) — admin 섹션 h1 다중은 MINOR |
| `html-has-lang` | PASS 추정 — `app/layout.tsx` lang 속성 필요 (런타임 확인) |
| `image-alt` | PASS — `<img>` alt 누락 0건 |
| `input-image-alt` | N/A |
| `label` | PASS — form label 연결 확인 |
| `link-name` | PASS — CTA 링크 텍스트 의미 있음 |
| `tabindex` | PASS 추정 — 비정상 tabindex 없음 |

**예상 A11y 점수**: 90~96점 (런타임에서 color-contrast 실측 전 단언 불가)

---

## 3. Best Practices 예상 점수 (목표: 95+)

| 항목 | 정적 분석 결과 |
|------|----------------|
| HTTPS | PASS — Vercel 기본 HTTPS |
| Deprecated API | PASS 추정 — `document.write`, `alert()` 등 미사용 |
| Console errors | PENDING — 런타임 확인 필요 |
| `<script>` 외부 리소스 | PASS — Next.js 번들링 관리 |
| Cross-Origin Isolation | PENDING |
| Doctype | PASS — Next.js 기본 HTML 구조 |

---

## 4. SEO 예상 점수 (목표: 90+)

| 항목 | 정적 분석 결과 |
|------|----------------|
| Meta description | PASS — `app/manifest.ts` + Next.js metadata API |
| `robots.txt` | PASS — `app/robots.ts` 존재 |
| `sitemap.xml` | PASS — `app/sitemap.ts` 존재 |
| 구조화 데이터 | PENDING |
| `hreflang` | N/A (한국어 단일) |

---

## 5. PO 실측 체크리스트 (Vercel 배포 후)

### Step 1: Lighthouse 실행 (Chrome DevTools)
```
1. https://{vercel-domain}/ 접속
2. Chrome DevTools → Lighthouse 탭 → Mode: Navigation, Device: Mobile
3. Categories: Performance / Accessibility / Best Practices / SEO 전체 선택
4. Analyze page load 클릭
5. 결과 저장 (HTML 또는 JSON export)
```

### Step 2: axe DevTools (Chrome 확장)
```
1. Chrome 확장 → axe DevTools 설치
2. 검증 대상 각 페이지에서 실행
3. Results → Violations 탭 확인
4. Critical / Serious 건수 0건 목표
5. 각 페이지: /, /login, /signup, /marketplace, /skills, /mypage 최소 6개 페이지 검증
```

### Step 3: 키보드 접근성 수동 테스트
```
1. Tab 키로 모든 인터랙티브 요소 순회 가능 여부
2. Shift+Tab 역방향 이동 가능 여부
3. Enter/Space로 버튼/링크 활성화 가능 여부
4. Dialog 열림 시 focus trap 작동 여부 (Radix Portal)
5. Dialog 닫힘 후 trigger 요소로 focus 복귀 여부
6. / (랜딩) → "본문으로 건너뛰기" 링크 Tab 1회 시 노출 여부
```

### Step 4: 스크린리더 테스트 (선택)
```
Windows (NVDA):
  - nvda.nonvisual.org 에서 무료 설치
  - 주요 페이지 읽기 순서 확인
  - Form 레이블 음성 출력 확인
  - 에러 메시지 role="alert" 즉시 읽기 확인

Mac (VoiceOver):
  - Command+F5 활성화
  - Web Accessibility Inspector와 병행
```

### Step 5: 색상 대비 실측
```
Chrome DevTools → Elements → Computed → Accessibility
또는
axe DevTools color-contrast 자동 감지
목표: WCAG AA (일반 텍스트 4.5:1, 큰 텍스트 3:1)
```

---

## 6. 예상 Lighthouse 점수 요약

| 카테고리 | 목표 | 정적 분석 예상 | 실측 필요 |
|---------|------|--------------|-----------|
| Performance | 85+ | 75~88 (CLS/LCP 폰트 로드 변수) | YES |
| Accessibility | 95+ | 90~96 (color-contrast 실측 전 단언 불가) | YES |
| Best Practices | 95+ | 90~95 | YES |
| SEO | 90+ | 88~95 | YES |

---

## 7. 성능 개선 권고 (사전 조치 가능)

1. **Next.js `<Image>` 전환**: `app/jobs/[id]/page.tsx` 등 `<img>` 사용처 7건 → `next/image`로 전환 시 LCP/CLS 개선
2. **폰트 subset**: Pretendard subset URL 사용 여부 확인 (현재 불명확)
3. **`priority` prop**: LandingPage HeroSection이 첫 화면 — 현재 CSS gradient 배경 사용으로 이미지 LCP 없음. 텍스트 LCP에 집중
4. **코드스플리팅**: TanStack Table DataTable은 admin/marketplace 한정 사용 → dynamic import 고려
