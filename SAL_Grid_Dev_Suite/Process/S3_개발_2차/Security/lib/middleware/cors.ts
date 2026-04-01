/**
 * @task S3SC1
 * @description CORS 화이트리스트 미들웨어
 * Edge Runtime compatible
 */
import { NextRequest, NextResponse } from 'next/server';

/**
 * 허용된 오리진 목록
 * - 프로덕션: ALLOWED_ORIGINS 환경변수 (콤마 구분) 우선 사용
 * - 기본 화이트리스트: mychatbot.world 도메인
 * - 개발: localhost:3000
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map((o) => o.trim()).filter(Boolean);
  }

  const defaults: string[] = [
    'https://mychatbot.world',
    'https://www.mychatbot.world',
  ];

  if (process.env.NODE_ENV === 'development') {
    defaults.push('http://localhost:3000');
  }

  return defaults;
}

/**
 * CORS 미들웨어
 * - 허용된 오리진에 대해 CORS 헤더 추가
 * - OPTIONS preflight 요청 즉시 응답
 * @returns NextResponse with CORS headers applied
 */
export function corsMiddleware(req: NextRequest, res: NextResponse): NextResponse {
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.get('origin') ?? '';
  const isAllowed = allowedOrigins.includes(origin);

  // OPTIONS preflight 처리
  if (req.method === 'OPTIONS') {
    const preflightResponse = new NextResponse(null, { status: 204 });
    if (isAllowed) {
      preflightResponse.headers.set('Access-Control-Allow-Origin', origin);
      preflightResponse.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS'
      );
      preflightResponse.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-API-Key, X-Requested-With'
      );
      preflightResponse.headers.set('Access-Control-Max-Age', '86400');
      preflightResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    return preflightResponse;
  }

  // 허용된 오리진에 CORS 헤더 추가
  if (isAllowed) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    );
    res.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-API-Key, X-Requested-With'
    );
    res.headers.set('Access-Control-Max-Age', '86400');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Vary 헤더: CDN 캐시 분리
  res.headers.set('Vary', 'Origin');

  return res;
}
