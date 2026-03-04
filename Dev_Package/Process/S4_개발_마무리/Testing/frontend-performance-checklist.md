# 프론트엔드 성능 체크리스트
<!-- @task S4T3 -->

## 목표 점수 (Lighthouse)

| 카테고리       | 목표 점수 | 권고 기준 |
|--------------|---------|---------|
| Performance  | 80+     | 90+ 이상적 |
| Accessibility| 90+     | 100 목표 |
| Best Practices| 90+    | - |
| SEO          | 80+     | - |

---

## 1. Core Web Vitals

### FCP (First Contentful Paint) — 목표: 1.8초 이하
- [ ] 첫 번째 텍스트/이미지가 1.8초 내 렌더링되는지 확인
- **측정 방법**: Chrome DevTools > Lighthouse 탭 > 분석 실행
- **개선 방법**:
  - `<link rel="preload">` 로 주요 리소스 선로딩
  - 렌더 블로킹 CSS/JS 제거 (`defer`, `async` 속성 활용)
  - 서버 응답 시간(TTFB) 200ms 이하 유지

### LCP (Largest Contentful Paint) — 목표: 2.5초 이하
- [ ] 가장 큰 콘텐츠 요소(주로 Hero 이미지 또는 제목)가 2.5초 내 렌더링
- **측정 방법**: DevTools > Performance 탭 > LCP 마커 확인
- **개선 방법**:
  - 히어로 이미지에 `fetchpriority="high"` 속성 추가
  - 중요 이미지는 lazy loading 제외 (`loading="eager"`)
  - 폰트 로딩 최적화: `font-display: swap`

### CLS (Cumulative Layout Shift) — 목표: 0.1 이하
- [ ] 페이지 로딩 중 레이아웃 이동이 최소화되어 있는지 확인
- **측정 방법**: DevTools > Performance > Layout Shift 이벤트 확인
- **개선 방법**:
  - 이미지/비디오에 명시적 `width`, `height` 속성 지정
  - 동적으로 삽입되는 콘텐츠(광고, 배너)에 공간 예약
  - 웹폰트 FOUT 방지 (`font-display: optional` 또는 preload)

### TTI (Time to Interactive) — 목표: 3.8초 이하
- [ ] 사용자가 페이지와 완전히 상호작용 가능한 시점이 3.8초 이하
- **측정 방법**: Lighthouse > Performance > TTI 항목
- **개선 방법**:
  - 메인 스레드 블로킹 작업(Long Task) 50ms 이하로 분할
  - 불필요한 서드파티 스크립트 제거 또는 지연 로딩
  - Code Splitting 적용 (필요할 때만 로딩)

---

## 2. 이미지 최적화

- [ ] **WebP 형식 사용**: JPEG/PNG 대비 25~35% 용량 절감
  - 확인: DevTools > Network > 이미지 필터 > Content-Type 컬럼
  - 변환: `cwebp input.png -o output.webp`
- [ ] **Lazy Loading 적용**: 화면 밖 이미지에 `loading="lazy"` 속성
  ```html
  <img src="image.webp" loading="lazy" alt="설명" width="800" height="600">
  ```
- [ ] **적절한 이미지 크기**: srcset으로 화면 크기별 이미지 제공
  ```html
  <img srcset="img-480.webp 480w, img-800.webp 800w"
       sizes="(max-width: 600px) 480px, 800px"
       src="img-800.webp" alt="설명">
  ```
- [ ] **이미지 CDN 활용**: Vercel은 자동으로 정적 이미지를 CDN 배포
- [ ] **SVG 최적화**: SVGO 도구로 불필요한 메타데이터 제거

---

## 3. JavaScript 번들 크기

- [ ] **번들 총 크기 확인**: 압축 후 200KB 이하 권장
  - 확인: DevTools > Network > JS 필터 > Size 컬럼 합산
- [ ] **미사용 코드 제거 (Tree Shaking)**:
  - 사용하지 않는 import 제거
  - lodash 전체 대신 `lodash/get` 등 개별 함수 import
- [ ] **코드 분할**: 페이지별 또는 기능별 청크 분리
- [ ] **minify 확인**: 프로덕션 빌드 시 난독화+압축 적용 여부
- [ ] **Gzip/Brotli 압축**: Vercel 기본 지원 — 응답 헤더 `Content-Encoding` 확인
  ```
  Content-Encoding: br  (Brotli)
  Content-Encoding: gzip
  ```

---

## 4. CSS 최적화

- [ ] **미사용 CSS 제거**:
  - DevTools > Coverage 탭 > CSS 항목 미사용률 확인
  - PurgeCSS 또는 UnCSS 도구 활용
- [ ] **CSS 크기 확인**: 압축 후 50KB 이하 권장
- [ ] **Critical CSS 인라인화**: 초기 렌더에 필요한 CSS를 `<head>` 내 `<style>` 태그로 인라인
- [ ] **CSS 로딩 순서**: `<link rel="stylesheet">` 는 `<head>` 최상단 배치
- [ ] **애니메이션 최적화**: `transform`, `opacity` 속성만 사용 (레이아웃 재계산 방지)

---

## 5. 캐시 헤더 확인

- [ ] **정적 자산 장기 캐시**: JS, CSS, 이미지에 `Cache-Control: public, max-age=31536000, immutable`
  ```
  # Vercel vercel.json 예시
  {
    "headers": [
      {
        "source": "/_next/static/(.*)",
        "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]
      }
    ]
  }
  ```
- [ ] **HTML은 단기 캐시**: `Cache-Control: no-cache` 또는 `max-age=0, must-revalidate`
- [ ] **API 응답 캐시**: 변경이 적은 데이터(bot-profile, faq)에 `Cache-Control: public, s-maxage=60`
- [ ] **ETag 또는 Last-Modified**: 조건부 요청으로 불필요한 재전송 방지
  - 확인: DevTools > Network > 응답 헤더 확인

---

## 6. 네트워크 최적화

- [ ] **HTTP/2 또는 HTTP/3 사용**: Vercel 기본 지원
  - 확인: DevTools > Network > Protocol 컬럼 (`h2` 또는 `h3`)
- [ ] **DNS Prefetch**: 외부 도메인 연결 미리 준비
  ```html
  <link rel="dns-prefetch" href="//fonts.googleapis.com">
  <link rel="preconnect" href="https://supabase.co">
  ```
- [ ] **요청 수 최소화**: 가능한 파일 병합, 스프라이트 이미지 활용
- [ ] **Third-party 스크립트 감사**: Google Analytics 등 비동기 로딩 여부 확인

---

## 7. 측정 도구 및 실행 방법

### Lighthouse (Chrome DevTools)
1. Chrome에서 테스트 페이지 열기
2. F12 > Lighthouse 탭
3. "Analyze page load" 클릭
4. 모바일/데스크톱 각각 측정

### PageSpeed Insights
- URL: https://pagespeed.web.dev/
- 실제 사용자 데이터(CrUX) + 실험실 데이터 동시 제공

### WebPageTest
- URL: https://www.webpagetest.org/
- 다양한 위치/기기/네트워크 조건에서 측정 가능

### Chrome DevTools Coverage
1. F12 > 점 세 개 메뉴 > More tools > Coverage
2. Record 버튼 클릭 후 페이지 조작
3. JS/CSS 미사용 비율 확인

---

## 8. 성능 회귀 방지

- [ ] CI/CD 파이프라인에 Lighthouse CI 통합
- [ ] 성능 예산(Performance Budget) 설정: JS 200KB, 이미지 500KB 등
- [ ] 주요 릴리스마다 성능 측정 결과를 문서로 기록

---

*생성일: 2026-03-05 | Task: S4T3 | Stage: S4 개발 마무리*
