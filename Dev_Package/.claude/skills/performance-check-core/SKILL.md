# /performance-check-core

> **이 스킬의 역할**: 성능 지표 측정 + 병목 지점 식별. 수정/디버깅은 `/troubleshoot-core` 사용

> **SAL Grid Dev Suite** — 프론트엔드/백엔드 성능 분석 및 최적화 스킬
>
> **사용 시점**: Core Web Vitals 측정, DB 쿼리 최적화, 번들 크기 분석, API 응답 시간 개선이 필요할 때
> **적용 대상**: Vanilla 및 React/Next.js 모두 적용 가능

---

## 프로젝트 컨텍스트

**프로젝트**: {PROJECT_NAME}
**기술 스택** (예시 — 실제 프로젝트에 맞게 조정):
- Frontend: React / Next.js 또는 Vanilla JS
- Backend: API Routes 또는 Express
- Database: Supabase (PostgreSQL) 또는 기타 DB
- Deployment: Vercel 또는 기타 플랫폼

---

## AI-only 개발 원칙 (필수 준수)

### 허용
- CLI 명령어로 성능 측정 도구 실행
- 코드 분석으로 성능 병목 탐지
- 벤치마크 결과를 파일로 저장

### 금지
- 웹 기반 성능 도구 수동 사용 (Lighthouse GUI)
- Dashboard에서 수동으로 메트릭 확인
- 사용자에게 수동 성능 테스트 요청

**위반 발견 시 즉시 작업 중단 및 대안 탐색**

---

## 역할 및 책임

당신은 이 프로젝트의 성능 분석가입니다:

1. **Frontend 성능**: Core Web Vitals, 렌더링 성능, 번들 크기
2. **Backend 성능**: API 응답 시간, 데이터베이스 쿼리 최적화
3. **네트워크 성능**: 리소스 로딩, 캐싱 전략
4. **사용자 경험**: 체감 성능, 인터랙션 지연
5. **성능 보고서**: 벤치마크 결과 및 개선 방안 제시

---

## 성능 분석 프로세스

### 1. 프론트엔드 성능 측정

#### Lighthouse CLI 실행
```bash
# 로컬 빌드 후 실행 (React/Next.js)
npm run build
npm run start

# Vanilla의 경우 로컬 서버 실행
npx serve .

# Lighthouse 실행 (별도 터미널)
npx lighthouse http://localhost:3000 \
  --output=json \
  --output=html \
  --output-path=./lighthouse-report \
  --chrome-flags="--headless" \
  --only-categories=performance
```

#### 번들 분석 (React/Next.js)
```bash
# @next/bundle-analyzer 설치
npm install -D @next/bundle-analyzer

# next.config.js 수정 후
ANALYZE=true npm run build
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // 기존 설정
});
```

#### Vanilla: webpack-bundle-analyzer 사용
```bash
npm install -D webpack-bundle-analyzer
npx webpack --profile --json > stats.json
npx webpack-bundle-analyzer stats.json
```

#### Core Web Vitals 목표

| 메트릭 | 좋음 | 개선 필요 | 나쁨 |
|--------|------|----------|------|
| LCP (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4s | > 4s |
| FID (First Input Delay) | ≤ 100ms | 100ms - 300ms | > 300ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| FCP (First Contentful Paint) | ≤ 1.8s | 1.8s - 3s | > 3s |
| TTI (Time to Interactive) | ≤ 3.8s | 3.8s - 7.3s | > 7.3s |

---

### 2. 데이터베이스 쿼리 최적화

#### 느린 쿼리 탐지
```typescript
// lib/supabase/performance.ts
export async function measureQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  const start = performance.now();
  const result = await queryFn();
  const duration = performance.now() - start;

  if (duration > 1000) {
    console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
  } else {
    console.log(`${queryName}: ${duration.toFixed(2)}ms`);
  }

  return result;
}

// 사용 예시
const items = await measureQuery(
  () => supabase.from('your_table').select('*').limit(50),
  'getItems'
);
```

#### 쿼리 최적화 체크리스트

**나쁜 패턴: N+1 쿼리 문제**
```typescript
// 목록 조회
const { data: items } = await supabase
  .from('items')
  .select('*');

// 각 아이템의 관련 데이터를 별도로 조회 (N+1 문제!)
for (const item of items) {
  const { data: details } = await supabase
    .from('item_details')
    .select('*')
    .eq('item_id', item.id);

  item.details = details;
}
```

**좋은 패턴: JOIN 사용**
```typescript
const { data: items } = await supabase
  .from('items')
  .select(`
    *,
    item_details (
      id,
      value,
      created_at
    )
  `);
```

**좋은 패턴: 필요한 컬럼만 선택**
```typescript
// 나쁜 예
const { data } = await supabase.from('items').select('*');

// 좋은 예
const { data } = await supabase
  .from('items')
  .select('id, name, status, created_at');
```

**좋은 패턴: 인덱스 활용**
```sql
-- 자주 사용하는 검색/정렬 컬럼에 인덱스 생성
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_created_at ON items(created_at DESC);
CREATE INDEX idx_item_details_item_id ON item_details(item_id);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
```

**좋은 패턴: 페이지네이션**
```typescript
const PAGE_SIZE = 20;

async function getItems(page: number) {
  const { data, count } = await supabase
    .from('items')
    .select('*', { count: 'exact' })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    .order('created_at', { ascending: false });

  return {
    data,
    total: count,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count || 0) / PAGE_SIZE),
  };
}
```

---

### 3. API 응답 시간 최적화

#### API 성능 모니터링

**React/Next.js (middleware.ts)**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();

  const response = NextResponse.next();

  response.headers.set('X-Response-Time', `${Date.now() - start}ms`);

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

**Vanilla (Express 미들웨어)**
```javascript
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${duration}ms`);
  });
  next();
});
```

#### 응답 캐싱 (React/Next.js)
```typescript
// app/api/items/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';

  const { data } = await supabase
    .from('your_table')
    .select('*')
    .range((+page - 1) * 20, +page * 20 - 1);

  return NextResponse.json(
    { data },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}
```

#### API 목표 응답 시간

| 엔드포인트 유형 | 목표 | 허용 | 개선 필요 |
|---------------|------|------|----------|
| 단순 조회 (GET) | < 100ms | < 300ms | > 300ms |
| 복잡한 조회 | < 300ms | < 1s | > 1s |
| 생성/수정 (POST/PUT) | < 200ms | < 500ms | > 500ms |
| 삭제 (DELETE) | < 100ms | < 300ms | > 300ms |

---

### 4. 프론트엔드 최적화

#### React 렌더링 최적화

**나쁜 패턴: 불필요한 리렌더링**
```typescript
export default function ItemList({ items }) {
  return (
    <div>
      {items.map(item => (
        <ItemCard key={item.id} data={item} />
      ))}
    </div>
  );
}

// 부모가 리렌더링되면 모든 카드가 리렌더링됨
```

**좋은 패턴: React.memo 사용**
```typescript
import { memo } from 'react';

const ItemCard = memo(function ItemCard({ data }) {
  return (
    <div>
      <h3>{data.name}</h3>
      <p>{data.status}</p>
    </div>
  );
});

export default function ItemList({ items }) {
  return (
    <div>
      {items.map(item => (
        <ItemCard key={item.id} data={item} />
      ))}
    </div>
  );
}
```

**좋은 패턴: useMemo와 useCallback**
```typescript
'use client';
import { useMemo, useCallback } from 'react';

export default function SearchResults({ items, query }) {
  // 비싼 연산 메모이제이션
  const filteredItems = useMemo(() => {
    return items
      .filter(item => item.name.includes(query))
      .sort((a, b) => b.score - a.score);
  }, [items, query]);

  // 콜백 메모이제이션
  const handleClick = useCallback((id: string) => {
    console.log('Clicked:', id);
  }, []);

  return (
    <div>
      {filteredItems.map(item => (
        <div key={item.id} onClick={() => handleClick(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

#### 이미지 최적화

**React/Next.js: Image 컴포넌트 사용**
```typescript
import Image from 'next/image';

export function ItemThumbnail({ src, name }) {
  return (
    <Image
      src={src}
      alt={name}
      width={100}
      height={100}
      placeholder="blur"
      blurDataURL="/placeholder.jpg"
      loading="lazy"
    />
  );
}
```

**Vanilla: 기본 lazy loading**
```html
<img src="/item.jpg" alt="Item" loading="lazy" width="100" height="100" />
```

#### 코드 스플리팅 (React/Next.js)

**동적 임포트**
```typescript
import dynamic from 'next/dynamic';

// 무거운 컴포넌트 지연 로딩
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false, // 클라이언트에서만 로드
});

export default function ItemStats() {
  return (
    <div>
      <h2>Statistics</h2>
      <HeavyChart />
    </div>
  );
}
```

#### 가상 스크롤 (대량 데이터)

```typescript
'use client';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function VirtualList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 5. 네트워크 최적화

#### 리소스 프리로드 (React/Next.js)
```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <link rel="preconnect" href="{SUPABASE_URL}" />
        <link rel="dns-prefetch" href="{SUPABASE_URL}" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### 리소스 프리로드 (Vanilla)
```html
<head>
  <link rel="preconnect" href="{SUPABASE_URL}" />
  <link rel="dns-prefetch" href="{SUPABASE_URL}" />
</head>
```

#### 폰트 최적화 (React/Next.js)
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 성능 벤치마크 도구

### 커스텀 벤치마크 유틸리티

```typescript
// lib/performance/benchmark.ts
export class Benchmark {
  private measurements: Map<string, number[]> = new Map();

  start(label: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      const existing = this.measurements.get(label) || [];
      this.measurements.set(label, [...existing, duration]);
    };
  }

  getStats(label: string) {
    const durations = this.measurements.get(label) || [];
    if (durations.length === 0) return null;

    const sorted = [...durations].sort((a, b) => a - b);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    return { avg, min, max, median, p95, count: durations.length };
  }

  report(): string {
    let report = '\n Performance Benchmark Report\n';
    report += '='.repeat(50) + '\n\n';

    for (const [label, durations] of this.measurements) {
      const stats = this.getStats(label);
      if (!stats) continue;

      report += `${label}:\n`;
      report += `  Avg: ${stats.avg.toFixed(2)}ms\n`;
      report += `  Min: ${stats.min.toFixed(2)}ms\n`;
      report += `  Max: ${stats.max.toFixed(2)}ms\n`;
      report += `  Median: ${stats.median.toFixed(2)}ms\n`;
      report += `  P95: ${stats.p95.toFixed(2)}ms\n`;
      report += `  Count: ${stats.count}\n\n`;
    }

    return report;
  }
}

// 사용 예시
const benchmark = new Benchmark();

for (let i = 0; i < 100; i++) {
  const end = benchmark.start('getItems');
  await getItems(1);
  end();
}

console.log(benchmark.report());
```

---

## 성능 분석 보고서 템플릿

```markdown
# 성능 분석 보고서

**분석 날짜**: [YYYY-MM-DD]
**분석자**: Claude Code
**프로젝트**: {PROJECT_NAME}

---

## 요약

### 전체 성능 점수: X/100

**Core Web Vitals**:
- LCP: X.Xs (목표: ≤ 2.5s) [OK/WARNING/FAIL]
- FID: Xms (목표: ≤ 100ms) [OK/WARNING/FAIL]
- CLS: X.XX (목표: ≤ 0.1) [OK/WARNING/FAIL]

**API 응답 시간**:
- 평균: Xms
- P95: Xms
- 최대: Xms

**번들 크기**:
- First Load JS: X KB
- Total JS: X KB

---

## 프론트엔드 성능

### Lighthouse 결과

| 메트릭 | 점수 | 상태 |
|--------|------|------|
| Performance | 85 | 개선 필요 |
| Accessibility | 95 | 좋음 |
| Best Practices | 100 | 좋음 |
| SEO | 100 | 좋음 |

### Core Web Vitals 상세

**LCP (Largest Contentful Paint): 3.2s** — 개선 필요
- 목표: ≤ 2.5s
- 현재: 3.2s
- 차이: +0.7s (28% 느림)

**원인**:
- 메인 이미지 크기가 큼 (1.5MB)
- 렌더 블로킹 리소스

**개선 방안**:
1. 이미지 최적화 (WebP 포맷, 압축)
2. 이미지 lazy loading
3. CSS 인라인화

**예상 개선**: 3.2s → 2.1s

---

**FID (First Input Delay): 45ms** — 양호
- 목표: ≤ 100ms
- 현재: 45ms

---

**CLS (Cumulative Layout Shift): 0.15** — 개선 필요
- 목표: ≤ 0.1
- 현재: 0.15

**원인**:
- 이미지 크기 미지정
- 동적 콘텐츠 삽입

**개선 방안**:
```typescript
// 나쁜 예 (Vanilla)
<img src="/item.jpg" alt="Name" />

// 좋은 예 (Vanilla)
<img src="/item.jpg" alt="Name" width="400" height="300" />

// 좋은 예 (React/Next.js)
<Image src="/item.jpg" alt="Name" width={400} height={300} />
```

---

### 번들 분석

**총 번들 크기**: 450 KB
- First Load JS: 280 KB
- Shared chunks: 170 KB

**큰 패키지**:
1. `@tanstack/react-query`: 80 KB (필요)
2. `date-fns`: 65 KB (최적화 가능 → 13 KB)
3. `lodash`: 50 KB (최적화 가능 → 5 KB)

**개선 방안**:
```typescript
// 나쁜 예 — 전체 임포트
import _ from 'lodash';

// 좋은 예 — 필요한 것만 임포트
import debounce from 'lodash/debounce';
import { format } from 'date-fns/format';
```

**예상 절감**: 450 KB → 343 KB (-24%)

---

## 백엔드 성능

### API 벤치마크 결과

**GET /api/items**:
- 평균: 145ms
- 최소: 89ms
- 최대: 523ms
- P95: 287ms

**상태**: 개선 필요 (목표: < 100ms)

**병목 구간**:
1. 데이터베이스 쿼리: 120ms (83%)
2. JSON 직렬화: 18ms (12%)
3. 인증 확인: 7ms (5%)

---

### 데이터베이스 쿼리 분석

**느린 쿼리 예시**:
```sql
SELECT
  items.*,
  AVG(scores.value) as avg_score,
  COUNT(scores.id) as score_count
FROM items
LEFT JOIN scores ON items.id = scores.item_id
GROUP BY items.id
ORDER BY avg_score DESC
LIMIT 20;
```

**문제**: 매번 집계 계산

**해결책**: Materialized View 사용
```sql
CREATE MATERIALIZED VIEW items_with_stats AS
SELECT
  i.*,
  COALESCE(AVG(s.value), 0) as avg_score,
  COUNT(s.id) as score_count
FROM items i
LEFT JOIN scores s ON i.id = s.item_id
GROUP BY i.id;

CREATE INDEX idx_items_stats_score
ON items_with_stats(avg_score DESC);

-- 매 시간 갱신
REFRESH MATERIALIZED VIEW CONCURRENTLY items_with_stats;
```

**예상 개선**: 287ms → 45ms (-84%)

---

**검색 쿼리 최적화**:
```sql
-- 나쁜 예 — Full table scan
SELECT * FROM items
WHERE name ILIKE '%keyword%';

-- 좋은 예 — Full-text search 인덱스
ALTER TABLE items ADD COLUMN search_vector tsvector;

UPDATE items
SET search_vector = to_tsvector('simple', name || ' ' || COALESCE(description, ''));

CREATE INDEX idx_items_search ON items USING GIN(search_vector);

-- 개선된 쿼리
SELECT * FROM items
WHERE search_vector @@ to_tsquery('simple', 'keyword');
```

---

## 캐싱 전략

### 권장 캐싱 전략

**1. API 레벨 (React/Next.js)**
```typescript
// app/api/items/route.ts
export async function GET() {
  const { data } = await supabase.from('your_table').select('*');

  return NextResponse.json(
    { data },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}
```

**2. 클라이언트 레벨 (React Query)**
```typescript
// hooks/useItems.ts
import { useQuery } from '@tanstack/react-query';

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => fetch('/api/items').then(r => r.json()),
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 30 * 60 * 1000, // 30분
  });
}
```

**3. 데이터베이스 레벨**
```sql
-- 자주 조회되는 집계 결과 캐싱
CREATE MATERIALIZED VIEW items_stats AS ...
REFRESH MATERIALIZED VIEW CONCURRENTLY items_stats;
```

---

## 우선순위별 개선 과제

### P0 - 즉시 개선 (성능 영향 큼)
1. **Materialized View 생성** - DB 쿼리 시간 84% 단축
2. **이미지 최적화** - LCP 35% 개선
3. **번들 크기 최적화** - First Load JS 24% 감소

### P1 - 단기 개선 (1주일)
1. **API 캐싱 구현** - 응답 시간 90% 단축
2. **React Query 도입** - 클라이언트 캐싱
3. **Full-text search 인덱스** - 검색 성능 86% 개선

### P2 - 중기 개선 (1개월)
1. **CDN 설정** - 정적 리소스 로딩 속도 향상
2. **가상 스크롤** - 대량 데이터 렌더링 최적화
3. **Service Worker** - 오프라인 지원

---

## 벤치마크 비교

| 항목 | 현재 | 목표 | 개선 후 예상 |
|------|------|------|-------------|
| Lighthouse Score | 85 | 95 | 96 |
| LCP | 3.2s | 2.5s | 2.1s |
| FID | 45ms | 100ms | 45ms |
| CLS | 0.15 | 0.1 | 0.08 |
| API 응답 (평균) | 145ms | 100ms | 45ms |
| 번들 크기 | 450KB | 300KB | 343KB |

---

## 액션 아이템

### 이번 주
- [ ] Materialized View 생성 및 갱신 스케줄 설정
- [ ] 이미지 최적화 (WebP 변환, 압축)
- [ ] date-fns, lodash 트리 쉐이킹

### 다음 주
- [ ] API 캐싱 구현
- [ ] React Query 설정
- [ ] Full-text search 인덱스 생성

### 다음 달
- [ ] CDN 설정
- [ ] 가상 스크롤 구현
- [ ] 성능 모니터링 대시보드 구축

---

## 모니터링 설정

### Vercel Analytics (React/Next.js)
```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Web Vitals 추적 (React/Next.js)
```typescript
// app/layout.tsx
'use client';
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric);
    // 분석 서비스로 전송
  });

  return null;
}
```

### Vanilla: Performance Observer API
```javascript
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);
  });
});

observer.observe({ type: 'largest-contentful-paint', buffered: true });
```

---

## 다음 분석 일정

**권장 주기**: 주 1회
**다음 분석 예정일**: [YYYY-MM-DD]
```

---

**이 스킬을 활성화하면, 체계적인 성능 분석과 최적화로 이 프로젝트의 사용자 경험을 크게 개선합니다.**
