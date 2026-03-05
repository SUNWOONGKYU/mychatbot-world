// @task S3BA6
/**
 * Job Hire API - Vercel Serverless Function
 * POST   /api/Backend_APIs/job-hire        — 고용 요청(지원) 생성
 * GET    /api/Backend_APIs/job-hire?jobId= — 특정 job의 지원 목록 조회 (소유자만)
 * PATCH  /api/Backend_APIs/job-hire        — 지원 상태 변경 (소유자만)
 *
 * 인증 필수 (Supabase Bearer token)
 * - POST: 지원자가 job에 지원 (job_applications 생성)
 * - GET: job 소유자만 자신의 job 지원 목록 조회
 * - PATCH: job 소유자가 지원 상태를 pending → accepted/rejected 변경
 */
import { createClient } from '@supabase/supabase-js';

/** 허용된 지원 상태 전환 목록 */
const ALLOWED_APPLICATION_STATUSES = ['pending', 'accepted', 'rejected', 'withdrawn'];

/**
 * Authorization 헤더에서 Bearer 토큰을 추출하고 Supabase Auth로 검증합니다.
 * @param {Object} supabase - Supabase 클라이언트
 * @param {Object} headers - HTTP 요청 헤더
 * @returns {Promise<{userId: string}|{error: string, status: number}>}
 */
async function authenticate(supabase, headers) {
  const authHeader = headers['authorization'] || headers['Authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return { error: 'Unauthorized: missing Bearer token', status: 401 };
  }

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) {
    console.warn('[job-hire] Auth error:', authError?.message);
    return { error: 'Unauthorized: invalid or expired token', status: 401 };
  }

  return { userId: userData.user.id };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server configuration error: missing Supabase credentials' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ─── 인증 공통 처리 ───
  const auth = await authenticate(supabase, req.headers);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }
  const { userId } = auth;

  try {
    // ─── POST: 고용 요청(지원) 생성 ───
    if (req.method === 'POST') {
      const { jobId, applicantBotId, coverMessage } = req.body || {};

      if (!jobId || !applicantBotId) {
        return res.status(400).json({ error: 'jobId and applicantBotId are required' });
      }

      // job 존재 확인 + status 검증
      const { data: job, error: jobError } = await supabase
        .from('bot_jobs')
        .select('id, status, owner_user_id')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.status !== 'open') {
        return res.status(409).json({ error: `Cannot apply to a job with status: ${job.status}` });
      }

      // 자신의 job에 지원 불가
      if (job.owner_user_id === userId) {
        return res.status(403).json({ error: 'Cannot apply to your own job posting' });
      }

      // 중복 지원 확인
      const { data: existing } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_bot_id', applicantBotId)
        .single();

      if (existing) {
        return res.status(409).json({ error: 'Already applied to this job' });
      }

      // 지원서 생성
      const { data: application, error: insertError } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          applicant_bot_id: applicantBotId,
          applicant_user_id: userId,
          cover_message: coverMessage || null,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        console.error('[job-hire] Insert error:', insertError.message);
        return res.status(500).json({ error: 'Failed to create application', detail: insertError.message });
      }

      return res.status(201).json({ application });
    }

    // ─── GET: 지원 목록 조회 (job 소유자만) ───
    if (req.method === 'GET') {
      const { jobId } = req.query;

      if (!jobId) {
        return res.status(400).json({ error: 'jobId query parameter is required' });
      }

      // job 소유자 확인
      const { data: job, error: jobError } = await supabase
        .from('bot_jobs')
        .select('id, owner_user_id')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.owner_user_id !== userId) {
        return res.status(403).json({ error: 'Forbidden: you do not own this job posting' });
      }

      // 지원 목록 조회
      const { data: applications, error: listError } = await supabase
        .from('job_applications')
        .select(`
          id,
          job_id,
          applicant_bot_id,
          applicant_user_id,
          cover_message,
          status,
          created_at,
          updated_at
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (listError) {
        console.error('[job-hire] List error:', listError.message);
        return res.status(500).json({ error: 'Failed to fetch applications', detail: listError.message });
      }

      return res.status(200).json({ applications: applications || [] });
    }

    // ─── PATCH: 지원 상태 변경 ───
    if (req.method === 'PATCH') {
      const { applicationId, status: newStatus } = req.body || {};

      if (!applicationId || !newStatus) {
        return res.status(400).json({ error: 'applicationId and status are required' });
      }

      if (!ALLOWED_APPLICATION_STATUSES.includes(newStatus)) {
        return res.status(400).json({
          error: `Invalid status. Allowed: ${ALLOWED_APPLICATION_STATUSES.join(', ')}`,
        });
      }

      // 지원서 조회 + job 소유자 확인
      const { data: application, error: appError } = await supabase
        .from('job_applications')
        .select('id, job_id, status, applicant_user_id')
        .eq('id', applicationId)
        .single();

      if (appError || !application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // job 소유자만 accepted/rejected 변경 가능
      // 지원자는 자신의 지원만 withdrawn 가능
      if (newStatus === 'withdrawn') {
        if (application.applicant_user_id !== userId) {
          return res.status(403).json({ error: 'Forbidden: only the applicant can withdraw' });
        }
      } else {
        // job 소유자 확인
        const { data: job, error: jobError } = await supabase
          .from('bot_jobs')
          .select('owner_user_id')
          .eq('id', application.job_id)
          .single();

        if (jobError || !job) {
          return res.status(404).json({ error: 'Job not found' });
        }

        if (job.owner_user_id !== userId) {
          return res.status(403).json({ error: 'Forbidden: only the job owner can change application status' });
        }
      }

      // 상태 업데이트
      const { data: updated, error: updateError } = await supabase
        .from('job_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', applicationId)
        .select()
        .single();

      if (updateError) {
        console.error('[job-hire] Update error:', updateError.message);
        return res.status(500).json({ error: 'Failed to update application status', detail: updateError.message });
      }

      return res.status(200).json({ application: updated });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[job-hire] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
