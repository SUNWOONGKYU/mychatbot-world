/**
 * @task S3BA3
 * @description AI 기반 채용 매칭 알고리즘
 *
 * POST /api/jobs/match — 채용 공고에 대한 AI 매칭 실행 (인증 필수)
 *   요청: { job_id }
 *   응답: { matches: MatchResult[], count: number }
 *
 * GET  /api/jobs/match?job_id= — 채용 공고의 매칭 결과 조회 (인증 필수)
 *   응답: { matches: JobMatch[], count: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================
// 타입 정의
// ============================

interface JobPosting {
  id: string;
  employer_id: string;
  title: string;
  description: string | null;
  required_skills: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  status: 'open' | 'closed' | 'filled';
}

interface JobMatch {
  id: string;
  job_id: string;
  applicant_id: string;
  match_score: number;
  matched_at: string;
  status: 'pending' | 'hired' | 'rejected';
}

interface MatchResult {
  applicant_id: string;
  score: number;
  reason: string;
}

interface ApplicantProfile {
  id: string;
  skills?: string[];
  bio?: string;
}

// ============================
// Supabase 서버 클라이언트
// ============================

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, serviceKey);
}

// ============================
// 인증 헬퍼
// ============================

async function authenticate(
  req: NextRequest
): Promise<{ userId: string } | { error: string; status: number }> {
  const supabase = getSupabaseServer();
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return { error: 'Unauthorized: Bearer 토큰이 필요합니다', status: 401 };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { error: 'Unauthorized: 유효하지 않거나 만료된 토큰입니다', status: 401 };
  }

  return { userId: data.user.id };
}

// ============================
// AI 매칭 점수 계산 (OpenRouter)
// ============================

async function computeMatchScores(
  job: JobPosting,
  applicants: ApplicantProfile[]
): Promise<MatchResult[]> {
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  if (!openrouterKey || applicants.length === 0) {
    // OpenRouter 키 미설정 또는 지원자 없음 → 로컬 스킬 기반 계산 폴백
    return applicants.map((a) => {
      const score = calcLocalSkillScore(job.required_skills ?? [], a.skills ?? []);
      return {
        applicant_id: a.id,
        score,
        reason: `스킬 매칭 점수: ${score}점`,
      };
    });
  }

  const matchingPrompt = `
다음 채용 공고와 지원자 목록을 분석하여 매칭 점수(0~100)를 계산하세요.

채용 공고:
- 제목: ${job.title}
- 필요 스킬: ${job.required_skills?.join(', ') ?? '없음'}
- 예산: ${job.budget_min ?? '미정'}~${job.budget_max ?? '미정'}원
- 설명: ${job.description ?? '없음'}

지원자 목록:
${applicants
  .map(
    (a, i) =>
      `${i + 1}. ID: ${a.id}, 스킬: ${a.skills?.join(', ') ?? '없음'}, 소개: ${a.bio ?? '없음'}`
  )
  .join('\n')}

각 지원자에 대해 JSON 배열로만 응답하세요 (다른 텍스트 없이):
[{ "applicant_id": "...", "score": 숫자(0~100), "reason": "간단한 이유" }]
`.trim();

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: matchingPrompt }],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const completion = await response.json();
    const content = completion.choices?.[0]?.message?.content ?? '';

    // JSON 배열 파싱
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('AI 응답에서 JSON 배열을 찾을 수 없습니다');
    }

    const results: MatchResult[] = JSON.parse(jsonMatch[0]);
    return results;
  } catch (err) {
    console.warn('[jobs/match] AI 매칭 실패, 로컬 계산으로 폴백:', err);
    // 폴백: 로컬 스킬 점수
    return applicants.map((a) => {
      const score = calcLocalSkillScore(job.required_skills ?? [], a.skills ?? []);
      return {
        applicant_id: a.id,
        score,
        reason: `스킬 매칭 점수: ${score}점 (AI 매칭 불가, 로컬 계산)`,
      };
    });
  }
}

/**
 * 로컬 스킬 기반 매칭 점수 계산 (0~100)
 */
function calcLocalSkillScore(requiredSkills: string[], applicantSkills: string[]): number {
  if (requiredSkills.length === 0) return 50; // 요구 스킬 없음 → 중립 점수

  const required = requiredSkills.map((s) => s.toLowerCase().trim());
  const provided = applicantSkills.map((s) => s.toLowerCase().trim());

  const matched = required.filter((s) => provided.includes(s)).length;
  return Math.round((matched / required.length) * 100);
}

// ============================
// POST /api/jobs/match
// ============================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseServer();

  const auth = await authenticate(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { userId } = auth;

  let body: { job_id: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '유효하지 않은 JSON 요청입니다' }, { status: 400 });
  }

  const { job_id } = body;

  if (!job_id) {
    return NextResponse.json({ error: 'job_id는 필수입니다' }, { status: 400 });
  }

  // 채용 공고 조회
  const { data: job, error: jobError } = await supabase
    .from('job_postings')
    .select('*')
    .eq('id', job_id)
    .single();

  if (jobError) {
    if (jobError.code === 'PGRST116') {
      return NextResponse.json({ error: '채용 공고를 찾을 수 없습니다' }, { status: 404 });
    }
    return NextResponse.json({ error: '채용 공고 조회에 실패했습니다' }, { status: 500 });
  }

  // 소유자만 매칭 실행 가능
  if ((job as JobPosting).employer_id !== userId) {
    return NextResponse.json(
      { error: 'Forbidden: 본인의 채용 공고에 대해서만 매칭을 실행할 수 있습니다' },
      { status: 403 }
    );
  }

  if ((job as JobPosting).status !== 'open') {
    return NextResponse.json(
      { error: '매칭은 status가 "open"인 채용 공고에서만 실행 가능합니다' },
      { status: 400 }
    );
  }

  try {
    // 지원자 풀 조회 (profiles 테이블, 고용주 본인 제외)
    const { data: applicants, error: applicantsError } = await supabase
      .from('profiles')
      .select('id, skills, bio')
      .neq('id', userId)
      .limit(50);

    if (applicantsError) {
      console.warn('[jobs/match] profiles 조회 실패:', applicantsError.message);
    }

    const applicantList: ApplicantProfile[] = (applicants ?? []) as ApplicantProfile[];

    if (applicantList.length === 0) {
      return NextResponse.json({ matches: [], count: 0, message: '매칭 가능한 지원자가 없습니다' });
    }

    // AI 매칭 점수 계산
    const matchResults = await computeMatchScores(job as JobPosting, applicantList);

    // 점수 기준 내림차순 정렬 (상위 20명)
    const sortedResults = matchResults
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    // job_matches 테이블에 결과 저장 (upsert: 기존 매칭 결과 갱신)
    const matchInserts = sortedResults.map((r) => ({
      job_id,
      applicant_id: r.applicant_id,
      match_score: r.score,
      status: 'pending' as const,
      matched_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('job_matches')
      .upsert(matchInserts, { onConflict: 'job_id,applicant_id' });

    if (insertError) {
      console.error('[jobs/match] job_matches 저장 실패:', insertError.message);
      // 저장 실패해도 결과는 반환
    }

    return NextResponse.json({ matches: sortedResults, count: sortedResults.length });
  } catch (err) {
    console.error('[jobs/match POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================
// GET /api/jobs/match?job_id=
// ============================

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseServer();

  const auth = await authenticate(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { userId } = auth;

  const { searchParams } = new URL(req.url);
  const job_id = searchParams.get('job_id');

  if (!job_id) {
    return NextResponse.json({ error: 'job_id 쿼리 파라미터가 필요합니다' }, { status: 400 });
  }

  // 소유자 확인
  const { data: job, error: jobError } = await supabase
    .from('job_postings')
    .select('employer_id')
    .eq('id', job_id)
    .single();

  if (jobError) {
    if (jobError.code === 'PGRST116') {
      return NextResponse.json({ error: '채용 공고를 찾을 수 없습니다' }, { status: 404 });
    }
    return NextResponse.json({ error: '채용 공고 조회에 실패했습니다' }, { status: 500 });
  }

  if (job.employer_id !== userId) {
    return NextResponse.json(
      { error: 'Forbidden: 본인의 채용 공고 매칭 결과만 조회할 수 있습니다' },
      { status: 403 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('job_matches')
      .select('*')
      .eq('job_id', job_id)
      .order('match_score', { ascending: false });

    if (error) {
      console.error('[jobs/match GET] Supabase error:', error.message);
      return NextResponse.json({ error: '매칭 결과 조회에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ matches: data as JobMatch[], count: data.length });
  } catch (err) {
    console.error('[jobs/match GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
