/**
 * @task S5M5
 * @description GET /api/operations/hired-bots
 *
 * 내가 고용한 챗봇 목록 조회 (구봇 탭)
 * - job_postings + job_matches + mcw_bots (React 테이블) 우선
 * - 42P01 시 bot_jobs + job_applications + bots (vanilla 테이블) 시도
 * - 두 경우 모두 테이블 없으면 빈 배열 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return null;
  const { data: { user } } = await getSupabase().auth.getUser(token);
  return user ?? null;
}

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const supabase = getSupabase();

  // ── 1차 시도: React 테이블 (job_postings + job_matches + mcw_bots) ──
  const { data: reactData, error: reactError } = await supabase
    .from('job_postings')
    .select(`
      id,
      title,
      budget_min,
      budget_max,
      updated_at,
      job_matches!inner (
        id,
        applicant_id,
        status
      )
    `)
    .eq('employer_id', user.id)
    .eq('job_matches.status', 'hired');

  if (!reactError) {
    const rows = reactData as any[] ?? [];
    const result = await Promise.all(
      rows.flatMap((job: any) =>
        (job.job_matches as any[]).map(async (match: any) => {
          const { data: bot } = await supabase
            .from('mcw_bots')
            .select('id, name, owner_id')
            .eq('id', match.applicant_id)
            .maybeSingle();

          let ownerEmail = '';
          if (bot?.owner_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', bot.owner_id)
              .maybeSingle();
            ownerEmail = profile?.email ?? '';
          }

          const budget = job.budget_max ?? job.budget_min ?? 0;
          return {
            id: match.id,
            bot_name: bot?.name ?? '알 수 없는 봇',
            owner: ownerEmail,
            contract_until: job.updated_at ?? '',
            price_per_unit: budget,
            performance_score: 0,
            cost_total: budget,
          };
        })
      )
    );
    return NextResponse.json({ hired_bots: result });
  }

  // 테이블 없음이 아닌 오류는 500
  if (reactError.code !== '42P01') {
    console.error('[operations/hired-bots] job_postings error:', reactError.message);
    return NextResponse.json({ error: '데이터 조회에 실패했습니다.' }, { status: 500 });
  }

  // ── 2차 시도: Vanilla 테이블 (bot_jobs + job_applications + bots) ──
  const { data: vanillaData, error: vanillaError } = await supabase
    .from('bot_jobs')
    .select(`
      id,
      budget,
      updated_at,
      job_applications!inner (
        id,
        applicant_bot_id,
        applicant_user_id,
        status
      )
    `)
    .eq('owner_user_id', user.id)
    .eq('job_applications.status', 'accepted');

  if (!vanillaError) {
    const rows = vanillaData as any[] ?? [];
    const result = await Promise.all(
      rows.flatMap((job: any) =>
        (job.job_applications as any[]).map(async (app: any) => {
          const { data: bot } = await supabase
            .from('bots')
            .select('id, name')
            .eq('id', app.applicant_bot_id)
            .maybeSingle();

          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', app.applicant_user_id)
            .maybeSingle();

          const budget = job.budget ?? 0;
          return {
            id: app.id,
            bot_name: bot?.name ?? '알 수 없는 봇',
            owner: profile?.email ?? '',
            contract_until: job.updated_at ?? '',
            price_per_unit: budget,
            performance_score: 0,
            cost_total: budget,
          };
        })
      )
    );
    return NextResponse.json({ hired_bots: result });
  }

  // 두 테이블 모두 없으면 빈 배열
  return NextResponse.json({ hired_bots: [] });
}
