// @task S3BA6
/**
 * Job Matching API - Vercel Serverless Function
 * POST /api/Backend_APIs/job-matching
 *
 * 구봇구직 매칭 알고리즘 API
 * - 요구사항(skills, category, salary 범위) 입력 → 적합한 bot_jobs 추천
 * - skills 배열 매칭 점수 계산 (교집합 기반)
 * - rating 가중치 적용 (평균 평점이 높을수록 우선)
 * - 상위 N개 결과 반환 (기본 10개)
 * - 인증 불필요 (공개 엔드포인트)
 */
import { createClient } from '@supabase/supabase-js';

/**
 * skills 배열 매칭 점수를 계산합니다.
 * 점수 = 매칭된 스킬 수 / 요구 스킬 수 (0~1)
 * 요구 스킬이 없으면 0.5 (중립 점수) 반환
 * @param {string[]} requiredSkills - 사용자가 요구하는 스킬 목록
 * @param {string[]|null} jobSkills - job에서 제공하는 스킬 목록
 * @returns {number} 매칭 점수 (0~1)
 */
function calcSkillScore(requiredSkills, jobSkills) {
  if (!requiredSkills || requiredSkills.length === 0) return 0.5;
  if (!jobSkills || jobSkills.length === 0) return 0;

  const required = requiredSkills.map(s => s.toLowerCase().trim());
  const provided = jobSkills.map(s => s.toLowerCase().trim());

  const matched = required.filter(s => provided.includes(s)).length;
  return matched / required.length;
}

/**
 * 급여 범위 매칭 점수를 계산합니다.
 * 요구 범위와 job 범위가 겹치면 1.0, 부분 겹치면 0.5, 전혀 안 겹치면 0
 * 급여 정보가 없으면 0.5 (중립) 반환
 * @param {number|null} reqMin - 요구 최소 급여
 * @param {number|null} reqMax - 요구 최대 급여
 * @param {number|null} jobMin - job 최소 급여
 * @param {number|null} jobMax - job 최대 급여
 * @returns {number} 급여 매칭 점수 (0~1)
 */
function calcSalaryScore(reqMin, reqMax, jobMin, jobMax) {
  // 요구 급여 범위 미제공 → 중립
  if (reqMin == null && reqMax == null) return 0.5;
  // job 급여 정보 없음 → 중립
  if (jobMin == null && jobMax == null) return 0.5;

  const rMin = reqMin ?? 0;
  const rMax = reqMax ?? Infinity;
  const jMin = jobMin ?? 0;
  const jMax = jobMax ?? Infinity;

  // 겹침 확인: 두 범위가 겹치면 overlap > 0
  const overlapMin = Math.max(rMin, jMin);
  const overlapMax = Math.min(rMax === Infinity ? jMax : rMax, jMax === Infinity ? rMax : jMax);

  if (overlapMin <= overlapMax) {
    // 완전히 포함되면 1.0, 부분 겹침은 0.7
    const reqRange = rMax === Infinity ? jMax - rMin : rMax - rMin;
    const overlapRange = overlapMax - overlapMin;
    if (reqRange <= 0) return 1.0;
    return overlapRange >= reqRange ? 1.0 : 0.7;
  }

  return 0;
}

/**
 * 종합 매칭 점수를 계산합니다.
 * - skills 매칭: 40% 가중치
 * - rating 가중치: 35%
 * - salary 매칭: 15%
 * - category 일치: 10%
 * @param {Object} job - bot_jobs 레코드
 * @param {Object} requirements - 사용자 요구사항
 * @returns {number} 종합 점수 (0~100)
 */
function calcMatchScore(job, requirements) {
  const { skills = [], category, salaryMin, salaryMax } = requirements;

  // 1. skills 매칭 점수 (0~1)
  const skillScore = calcSkillScore(skills, job.required_skills);

  // 2. rating 가중치 (0~1): 평균 평점 / 5
  const ratingScore = (job.avg_rating || 0) / 5;

  // 3. salary 매칭 점수 (0~1)
  const salaryScore = calcSalaryScore(salaryMin, salaryMax, job.salary_min, job.salary_max);

  // 4. category 일치 (0 또는 1)
  const categoryScore = (!category || job.category === category) ? 1 : 0;

  // 가중 합계 → 100점 만점
  const total = (
    skillScore * 40 +
    ratingScore * 35 +
    salaryScore * 15 +
    categoryScore * 10
  );

  return Math.round(total * 10) / 10;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', (req.headers.origin && ['https://mychatbot.world', 'http://localhost:3000', 'http://localhost:5173'].includes(req.headers.origin)) ? req.headers.origin : 'https://mychatbot.world');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server configuration error: missing Supabase credentials' });
  }

  const {
    skills = [],
    category,
    jobType,
    salaryMin,
    salaryMax,
    topN: rawTopN = 10,
  } = req.body || {};

  // 입력 유효성 검증
  if (!Array.isArray(skills)) {
    return res.status(400).json({ error: 'skills must be an array of strings' });
  }

  if (salaryMin !== undefined && (isNaN(Number(salaryMin)) || Number(salaryMin) < 0)) return res.status(400).json({ error: 'salaryMin must be a non-negative number' });
  if (salaryMax !== undefined && (isNaN(Number(salaryMax)) || Number(salaryMax) < 0)) return res.status(400).json({ error: 'salaryMax must be a non-negative number' });
  salaryMin = Number(salaryMin) || 0;
  salaryMax = Number(salaryMax) || Infinity;

  const topN = Math.min(50, Math.max(1, parseInt(rawTopN, 10) || 10));

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ─── 후보 job 목록 조회 ───
    // status=open인 job만 대상, avg_rating을 포함한 집계 조회
    let query = supabase
      .from('bot_jobs')
      .select(`
        id,
        title,
        description,
        job_type,
        category,
        status,
        salary_min,
        salary_max,
        salary_unit,
        required_skills,
        owner_bot_id,
        created_at,
        avg_rating
      `)
      .eq('status', 'open');

    // job_type 필터 (hire=봇을 고용하고 싶음, seek=일거리를 찾는 봇)
    if (jobType && ['hire', 'seek'].includes(jobType)) {
      query = query.eq('job_type', jobType);
    }

    // category 사전 필터 (매칭 후 재필터하지만, DB 부하 감소를 위해 사전 필터)
    if (category) {
      query = query.eq('category', category);
    }

    // 급여 범위 사전 필터 (salary_max >= salaryMin 또는 salary_min <= salaryMax)
    if (salaryMin != null) {
      query = query.or(`salary_max.gte.${salaryMin},salary_max.is.null`);
    }
    if (salaryMax != null) {
      query = query.or(`salary_min.lte.${salaryMax},salary_min.is.null`);
    }

    // 최대 200개까지 후보 로드 (메모리 상에서 정렬)
    query = query.limit(200);

    const { data: candidates, error } = await query;

    if (error) {
      console.error('[job-matching] Query error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch job candidates', detail: 'Internal server error' });
    }

    if (!candidates || candidates.length === 0) {
      return res.status(200).json({ matches: [], total: 0, topN });
    }

    // ─── 매칭 점수 계산 + 정렬 ───
    const requirements = { skills, category, salaryMin, salaryMax };

    const scored = candidates
      .map(job => ({
        ...job,
        matchScore: calcMatchScore(job, requirements),
        skillMatchCount: skills.length > 0
          ? calcSkillScore(skills, job.required_skills) * skills.length
          : null,
      }))
      .filter(job => job.matchScore > 0) // 0점 완전 불일치 제외
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, topN);

    return res.status(200).json({
      matches: scored,
      total: scored.length,
      topN,
      requirements: {
        skills,
        category: category || null,
        jobType: jobType || null,
        salaryMin: salaryMin || null,
        salaryMax: salaryMax || null,
      },
    });
  } catch (err) {
    console.error('[job-matching] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
