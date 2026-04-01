/**
 * @task S3SC1
 * @description API 키 검증 미들웨어
 * Edge Runtime compatible: 환경변수 기반, 하드코딩 없음
 */
import { NextRequest, NextResponse } from 'next/server';

/**
 * 공개 엔드포인트 목록 — API 키 없이 접근 가능
 * 페이지 경로(비-API)도 포함: 미들웨어 matcher에 걸리는 페이지 보호 제외
 */
const PUBLIC_PATHS: string[] = [
  '/api/health',
  '/api/auth',
  '/api/templates',
  '/signup',
  '/reset-password',
];

/**
 * 유효한 API 키 Set 초기화
 * - INTERNAL_API_KEY: 내부 서비스용
 * - PARTNER_API_KEY: 파트너 연동용
 * - 환경변수 미설정 시 해당 키 제외 (filter Boolean)
 */
function getValidApiKeys(): Set<string> {
  const keys = [
    process.env.INTERNAL_API_KEY,
    process.env.PARTNER_API_KEY,
  ].filter((k): k is string => typeof k === 'string' && k.length > 0);

  return new Set(keys);
}

/**
 * API 키 검증 미들웨어
 * - 공개 엔드포인트는 통과
 * - X-API-Key 헤더 검증
 * @returns NextResponse(401) if unauthorized, null if allowed
 */
export function apiKeyMiddleware(req: NextRequest): NextResponse | null {
  const pathname = req.nextUrl.pathname;

  // 공개 엔드포인트 통과
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'X-API-Key header is required' },
      { status: 401 }
    );
  }

  const validKeys = getValidApiKeys();

  // 유효 키가 설정되지 않은 경우 (개발 환경): 경고 후 통과
  if (validKeys.size === 0) {
    console.warn('[S3SC1] No API keys configured. Set INTERNAL_API_KEY or PARTNER_API_KEY.');
    return null;
  }

  if (!validKeys.has(apiKey)) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid API key' },
      { status: 401 }
    );
  }

  return null; // 통과
}
