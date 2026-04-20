// @task S3F6
// Service Worker — CoCoBot (CoCoBot)
// 전략: 정적 자산 Cache First / API Network First

const CACHE_NAME = 'mcw-cache-v1';

// install 시 사전 캐싱할 핵심 정적 파일 목록
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/chat.css',
  '/css/styles.css',
  '/js/chat.js',
  '/manifest.json'
];

// Network First 전략을 적용할 경로 패턴 (API 요청)
const NETWORK_FIRST_PATTERN = /^\/api\//;

// ─────────────────────────────────────────────
// INSTALL — 핵심 파일 사전 캐싱
// ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      // 대기 없이 즉시 활성화
      return self.skipWaiting();
    })
  );
});

// ─────────────────────────────────────────────
// ACTIVATE — 이전 버전 캐시 정리
// ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // 열려 있는 모든 탭에 즉시 적용
      return self.clients.claim();
    })
  );
});

// ─────────────────────────────────────────────
// FETCH — Cache First / Network First 분기
// ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // POST, PUT, DELETE 등 변경 요청은 캐시 미적용
  if (request.method !== 'GET') return;

  // chrome-extension 등 비http 요청 무시
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);

  if (NETWORK_FIRST_PATTERN.test(url.pathname)) {
    // ── Network First: API 요청 ──
    event.respondWith(networkFirst(request));
  } else {
    // ── Cache First: 정적 자산 ──
    event.respondWith(cacheFirst(request));
  }
});

// ─────────────────────────────────────────────
// 전략 구현
// ─────────────────────────────────────────────

/**
 * Cache First
 * 1. 캐시 확인 → 있으면 반환
 * 2. 없으면 네트워크 요청 → 응답을 캐시에 저장 후 반환
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    // 유효한 응답만 캐시 (opaque 응답 포함)
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // 오프라인이고 캐시도 없는 경우: 빈 오프라인 응답
    return new Response('오프라인 상태입니다. 잠시 후 다시 시도해주세요.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

/**
 * Network First
 * 1. 네트워크 요청 시도
 * 2. 실패 시 캐시에서 반환
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    // API 성공 응답은 캐시 갱신
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    return new Response(
      JSON.stringify({ error: '네트워크 연결을 확인해주세요.', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      }
    );
  }
}
