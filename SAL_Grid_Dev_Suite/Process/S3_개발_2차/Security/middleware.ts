/**
 * @task S3SC1
 * @description Next.js Edge Middleware — API 보안 체이닝
 * 실행 순서: CORS → Rate Limit → API Key → Logger
 * Edge Runtime 전용: Node.js API 사용 불가
 */
import { NextRequest, NextResponse } from 'next/server';
import { corsMiddleware } from './lib/middleware/cors';
import { rateLimitMiddleware } from './lib/middleware/rate-limit';
import { apiKeyMiddleware } from './lib/middleware/auth';
import { getRequestStartTime, logResponse } from './lib/middleware/logger';

export function middleware(req: NextRequest): NextResponse {
  const startTime = getRequestStartTime();

  // 기본 통과 응답 생성 (이후 미들웨어들이 이 응답에 헤더를 추가)
  let response = NextResponse.next();

  // ─────────────────────────────────────────────
  // Step 1: CORS 처리
  // - 허용된 오리진에 CORS 헤더 추가
  // - OPTIONS preflight 요청은 여기서 즉시 응답 반환
  // ─────────────────────────────────────────────
  response = corsMiddleware(req, response);

  // OPTIONS preflight는 이미 응답이 완성됨 → 로그 후 반환
  if (req.method === 'OPTIONS') {
    logResponse(req, response, startTime);
    return response;
  }

  // ─────────────────────────────────────────────
  // Step 2: Rate Limiting
  // - IP 기반 토큰 버킷, 분당 60회 초과 시 429
  // ─────────────────────────────────────────────
  const rateLimitResult = rateLimitMiddleware(req);
  if (rateLimitResult) {
    logResponse(req, rateLimitResult, startTime);
    return rateLimitResult;
  }

  // ─────────────────────────────────────────────
  // Step 3: API Key 검증
  // - 공개 엔드포인트 통과, 나머지는 X-API-Key 헤더 필수
  // ─────────────────────────────────────────────
  const apiKeyResult = apiKeyMiddleware(req);
  if (apiKeyResult) {
    // CORS 헤더를 401 응답에도 적용 (클라이언트가 에러를 읽을 수 있게)
    const corsHeaders = response.headers;
    corsHeaders.forEach((value, key) => {
      apiKeyResult.headers.set(key, value);
    });
    logResponse(req, apiKeyResult, startTime);
    return apiKeyResult;
  }

  // ─────────────────────────────────────────────
  // Step 4: 요청 로그 기록 (모든 통과 요청)
  // ─────────────────────────────────────────────
  logResponse(req, response, startTime);

  return response;
}

/**
 * Middleware matcher 설정
 * - /api/ 경로만 적용 (Next.js 페이지 및 정적 파일 제외)
 * - _next/static, _next/image, favicon 제외
 */
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
