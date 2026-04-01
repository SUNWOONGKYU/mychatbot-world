/**
 * @task S4DV1 - Service Worker (PWA 오프라인 지원)
 *
 * 캐시 전략:
 * - 정적 자원 (CSS, JS, 이미지): Cache First
 * - API 요청: Network First (5분 만료)
 * - 오프라인 폴백: 캐시된 응답 제공
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `mcw-static-${CACHE_VERSION}`;
const API_CACHE = `mcw-api-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// 오프라인 폴백 시 캐싱할 정적 자원
const PRECACHE_ASSETS = [
  '/',
  OFFLINE_PAGE,
  '/manifest.json',
];

// 캐시 만료 시간 (5분 = 300초)
const API_CACHE_TTL = 5 * 60 * 1000;

// ── 설치 이벤트 ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      // 이전 SW 대기 없이 즉시 활성화
      return self.skipWaiting();
    })
  );
});

// ── 활성화 이벤트 ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // 즉시 모든 클라이언트를 제어
      return self.clients.claim();
    })
  );
});

// ── 네트워크 요청 인터셉트 ───────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 다른 오리진 요청은 SW에서 처리하지 않음
  if (url.origin !== self.location.origin) {
    return;
  }

  // API 요청: Network First 전략
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // 정적 자원: Cache First 전략
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // 페이지 요청: Network First (오프라인 폴백 포함)
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(OFFLINE_PAGE);
    })
  );
});

// ── Cache First 전략 ─────────────────────────────────────────────
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Network error', { status: 503 });
  }
}

// ── Network First 전략 (API용, 5분 TTL) ─────────────────────────
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      const cloned = response.clone();
      // 응답에 타임스탬프 헤더 추가
      const headers = new Headers(cloned.headers);
      headers.append('sw-cache-timestamp', Date.now().toString());
      const body = await cloned.blob();
      cache.put(request, new Response(body, {
        status: cloned.status,
        headers,
      }));
    }
    return response;
  } catch {
    // 네트워크 실패 시 캐시 확인 (TTL 체크)
    const cached = await caches.match(request);
    if (cached) {
      const timestamp = cached.headers.get('sw-cache-timestamp');
      if (timestamp && (Date.now() - parseInt(timestamp)) < API_CACHE_TTL) {
        return cached;
      }
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ── 정적 자원 판별 ───────────────────────────────────────────────
function isStaticAsset(pathname) {
  const STATIC_EXTENSIONS = [
    '.css', '.js', '.woff', '.woff2', '.ttf', '.eot',
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.ico',
  ];
  return STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}
