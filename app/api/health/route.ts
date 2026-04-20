/**
 * @task S5DO1 / S6BI2
 * @description GET /api/health — 헬스체크 엔드포인트
 *
 * 모니터링 도구·로드밸런서·uptime 서비스가 서비스 상태를 확인한다.
 * 단순 200 응답이 아니라, 필수 환경변수 설정 + Supabase 연결성까지 검증.
 *
 * 응답:
 *   200 { status:'ok', checks:{ env:'ok', supabase:'ok' }, ... }
 *   503 { status:'degraded', checks:{ ... }, ... } — 필수 구성 누락 시
 */

export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';

interface HealthChecks {
  env: 'ok' | 'missing';
  supabase: 'ok' | 'unreachable' | 'skipped';
}

// 앱 구동에 반드시 필요한 환경변수 (누락 시 degraded)
const REQUIRED_ENVS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

async function checkSupabase(): Promise<HealthChecks['supabase']> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return 'skipped';
  try {
    const supabase = createClient(url, key);
    // 가벼운 쿼리 — count만 요청, 실제 데이터 반환 X
    const { error } = await supabase
      .from('mcw_bots')
      .select('id', { count: 'exact', head: true })
      .limit(1);
    if (error) return 'unreachable';
    return 'ok';
  } catch {
    return 'unreachable';
  }
}

export async function GET(): Promise<Response> {
  const missingEnvs = REQUIRED_ENVS.filter((k) => !process.env[k]);
  const envCheck: HealthChecks['env'] = missingEnvs.length === 0 ? 'ok' : 'missing';
  const supabaseCheck = await checkSupabase();

  const checks: HealthChecks = {
    env: envCheck,
    supabase: supabaseCheck,
  };

  const healthy = envCheck === 'ok' && supabaseCheck === 'ok';
  const status = healthy ? 'ok' : 'degraded';
  const httpStatus = healthy ? 200 : 503;

  return Response.json(
    {
      status,
      timestamp: new Date().toISOString(),
      service: 'mychatbot-world',
      checks,
      ...(missingEnvs.length > 0 ? { missingEnvs } : {}),
    },
    { status: httpStatus },
  );
}
