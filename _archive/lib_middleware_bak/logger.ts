/**
 * @task S3SC1
 * @description 요청 로깅 미들웨어
 * Edge Runtime compatible: console 기반, Node.js fs 미사용
 */
import { NextRequest, NextResponse } from 'next/server';

interface RequestLog {
  timestamp: string;
  method: string;
  path: string;
  ip: string;
  user_agent: string;
  status_code?: number;
  duration_ms?: number;
}

/**
 * 요청 시작 시간을 추적하기 위한 헬퍼
 * Edge Runtime에서는 Date.now() 사용
 */
export function getRequestStartTime(): number {
  return Date.now();
}

/**
 * 로그 출력 함수
 * - development: 읽기 쉬운 형식으로 console.log
 * - production: JSON 구조화 로그 (stdout → 로그 수집기 연동)
 */
function writeLog(log: RequestLog): void {
  if (process.env.NODE_ENV === 'production') {
    // 구조화된 JSON 로그 (Vercel Logs, Datadog, CloudWatch 등과 호환)
    process.stdout.write(JSON.stringify({ level: 'info', ...log }) + '\n');
  } else {
    const duration = log.duration_ms !== undefined ? ` (${log.duration_ms}ms)` : '';
    const status = log.status_code ? ` → ${log.status_code}` : '';
    console.log(
      `[${log.timestamp}] ${log.method} ${log.path}${status}${duration} — ${log.ip}`
    );
  }
}

/**
 * 요청 로깅 미들웨어
 * - 요청 정보를 구조화된 형식으로 기록
 * - status_code와 duration_ms는 응답 후 logResponse()로 보완
 */
export function loggerMiddleware(req: NextRequest): void {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  const log: RequestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.nextUrl.pathname,
    ip,
    user_agent: req.headers.get('user-agent') ?? 'unknown',
  };

  writeLog(log);
}

/**
 * 응답 로그 기록 (status_code + duration)
 * middleware.ts에서 응답 생성 후 호출
 */
export function logResponse(
  req: NextRequest,
  res: NextResponse,
  startTime: number
): void {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  const log: RequestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.nextUrl.pathname,
    ip,
    user_agent: req.headers.get('user-agent') ?? 'unknown',
    status_code: res.status,
    duration_ms: Date.now() - startTime,
  };

  writeLog(log);
}
