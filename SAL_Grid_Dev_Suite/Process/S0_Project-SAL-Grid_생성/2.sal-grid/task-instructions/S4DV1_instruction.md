# Task Instruction - S4DV1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## ⚠️ SAL Grid 데이터 작성 필수 규칙

### Stage 명칭
- **S4** = 개발 3차 (Advanced Development)

### Area 명칭
- **DV** = DevOps (데브옵스)

---

# Task Instruction - S4DV1

## Task ID
S4DV1

## Task Name
프로덕션 배포 최적화 (성능, SEO, PWA)

## Task Goal
Next.js 빌드 최적화 설정, SEO 메타태그, PWA 매니페스트, 이미지 최적화를 적용하여 Lighthouse 점수 90+ 달성을 목표로 프로덕션 배포 준비를 완료한다.

## Prerequisites (Dependencies)
- S4TS1 — E2E 테스트 통과
- S4TS2 — API 단위 테스트 통과

## Specific Instructions

### 1. Next.js 빌드 최적화 (`next.config.js`)
- `images.domains` — 허용 이미지 도메인 설정
- `experimental.optimizeCss: true` — CSS 최적화
- `compress: true` — gzip 압축 활성화
- Bundle Analyzer 설정 (`@next/bundle-analyzer`)
  - `ANALYZE=true npm run build` 로 번들 분석
- `swcMinify: true` — SWC 최소화
- `headers()` — 보안 헤더 설정
  ```
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  ```
- 환경 변수 검증: `env` 섹션에 필수 환경 변수 명시

### 2. SEO 메타태그 컴포넌트 (`components/seo/meta.tsx`)
- `<SEOMeta>` 컴포넌트 구현
  - props: `title`, `description`, `ogImage`, `canonicalUrl`, `noIndex`
- Open Graph 태그: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- Twitter Card 태그: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- 기본값: 서비스 이름, 기본 설명, 기본 OG 이미지
- 각 주요 페이지 (home, marketplace, business)에 `<SEOMeta>` 적용

### 3. PWA 매니페스트 (`app/manifest.ts`)
- `name`, `short_name`, `description`
- `start_url: '/'`
- `display: 'standalone'`
- `background_color`, `theme_color`
- 아이콘 정의 (192x192, 512x512 PNG)
- `categories: ['utilities', 'lifestyle']`

### 4. Service Worker (`public/sw.js`)
- 오프라인 폴백 페이지 캐싱
- 정적 자원(CSS, JS, 이미지) 캐시 전략 (Cache First)
- API 요청 캐시 전략 (Network First, 5분 만료)
- 캐시 버전 관리 (빌드 시 버전 업)

### 5. 이미지 최적화
- `next/image` 컴포넌트 전면 적용 확인
- `placeholder="blur"` 적용 (LCP 개선)
- 아바타 이미지: 96x96, quality 80
- OG 이미지: 1200x630 형식으로 생성

### 6. Lighthouse 점수 목표
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

## Expected Output Files
- `Process/S4_개발_마무리/DevOps/next.config.js` (최적화)
- `Process/S4_개발_마무리/DevOps/app/manifest.ts`
- `Process/S4_개발_마무리/DevOps/public/sw.js`
- `Process/S4_개발_마무리/DevOps/components/seo/meta.tsx`

## Completion Criteria
- [ ] `npm run build` 가 에러 없이 완료된다
- [ ] 빌드 번들 크기 확인 및 200KB 이하로 최적화된다 (First Load JS)
- [ ] `<SEOMeta>` 컴포넌트가 모든 주요 페이지에 적용된다
- [ ] PWA 매니페스트가 올바르게 생성된다
- [ ] Service Worker가 등록된다
- [ ] 보안 헤더가 응답에 포함된다
- [ ] Lighthouse Performance 점수 90+ (목표)

## Tech Stack
- TypeScript, Next.js
- Workbox 또는 직접 Service Worker 구현

## Tools
- npm (`@next/bundle-analyzer`, `lighthouse` CLI)
- vercel-cli (배포 전 빌드 검증)

## Execution Type
AI-Only

## Remarks
- Service Worker는 개발 환경에서 비활성화 (NODE_ENV 체크)
- 이미지 최적화는 기존 `<img>` 태그를 `<Image>`로 점진적 교체
- DV Area는 Production 자동 복사 대상 아님 (DevOps 설정 파일)

---

## ⚠️ 작업 결과물 저장 규칙

### Stage + Area 폴더에 저장
- S4DV1 → `Process/S4_개발_마무리/DevOps/`
- DevOps Area는 Production 자동 복사 대상 아님

---

## 📝 파일 명명 규칙
- Next.js 규칙 준수: `next.config.js`, `manifest.ts`
- Service Worker: `sw.js` (표준 명칭)
