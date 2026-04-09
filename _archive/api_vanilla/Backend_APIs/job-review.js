// @task S3BA6
/**
 * Job Review API - Vercel Serverless Function
 * POST   /api/Backend_APIs/job-review        — 리뷰 작성
 * GET    /api/Backend_APIs/job-review?target= — 리뷰 목록 + 평균 평점 조회
 * PATCH  /api/Backend_APIs/job-review        — 리뷰 수정 (작성자만)
 * DELETE /api/Backend_APIs/job-review?id=    — 리뷰 삭제 (작성자만)
 *
 * 리뷰 작성/수정/삭제는 인증 필수 (Supabase Bearer token)
 * GET은 인증 없이 조회 가능
 */
import { createClient } from '@supabase/supabase-js';

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
    console.warn('[job-review] Auth error:', authError?.message);
    return { error: 'Unauthorized: invalid or expired token', status: 401 };
  }

  return { userId: userData.user.id };
}

/**
 * job_reviews 테이블에서 평균 평점을 계산합니다.
 * @param {Object} supabase - Supabase 클라이언트
 * @param {string|null} botId - 봇 ID (null이면 무시)
 * @param {string|null} jobId - 잡 ID (null이면 무시)
 * @returns {Promise<number>} 평균 평점 (리뷰 없으면 0)
 */
async function calculateAverageRating(supabase, botId, jobId) {
  let query = supabase
    .from('job_reviews')
    .select('rating');

  if (botId) query = query.eq('target_bot_id', botId);
  if (jobId) query = query.eq('job_id', jobId);

  const { data, error } = await query;

  if (error || !data || data.length === 0) return 0;

  const sum = data.reduce((acc, r) => acc + (r.rating || 0), 0);
  return Math.round((sum / data.length) * 10) / 10; // 소수점 1자리
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', (req.headers.origin && ['https://mychatbot.world', 'http://localhost:3000', 'http://localhost:5173'].includes(req.headers.origin)) ? req.headers.origin : 'https://mychatbot.world');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
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

  try {
    // ─── GET: 리뷰 목록 + 평균 평점 조회 (인증 불필요) ───
    if (req.method === 'GET') {
      const { botId, jobId, offset: rawOffset = '0', limit: rawLimit = '20' } = req.query;

      if (!botId && !jobId) {
        return res.status(400).json({ error: 'Either botId or jobId query parameter is required' });
      }

      const offset = Math.max(0, parseInt(rawOffset, 10) || 0);
      const limit = Math.min(100, Math.max(1, parseInt(rawLimit, 10) || 20));

      let query = supabase
        .from('job_reviews')
        .select(`
          id,
          job_id,
          target_bot_id,
          reviewer_user_id,
          rating,
          comment,
          created_at,
          updated_at
        `, { count: 'exact' });

      if (botId) query = query.eq('target_bot_id', botId);
      if (jobId) query = query.eq('job_id', jobId);

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: reviews, error, count } = await query;

      if (error) {
        console.error('[job-review] GET error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch reviews', detail: 'Internal server error' });
      }

      const avgRating = await calculateAverageRating(
        supabase,
        botId || null,
        jobId || null
      );

      return res.status(200).json({
        reviews: reviews || [],
        avgRating,
        pagination: {
          total: count ?? 0,
          offset,
          limit,
          hasMore: (count ?? 0) > offset + limit,
        },
      });
    }

    // ─── 이하 메서드는 인증 필수 ───
    const auth = await authenticate(supabase, req.headers);
    if (auth.error) {
      return res.status(auth.status).json({ error: auth.error });
    }
    const { userId } = auth;

    // ─── POST: 리뷰 작성 ───
    if (req.method === 'POST') {
      const { jobId, targetBotId, rating, comment } = req.body || {};

      if (!jobId || !targetBotId || rating === undefined) {
        return res.status(400).json({ error: 'jobId, targetBotId, and rating are required' });
      }

      if (comment && comment.length > 3000) return res.status(400).json({ error: 'comment는 3000자를 초과할 수 없습니다.' });
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) return res.status(400).json({ error: 'rating은 1~5 사이의 정수여야 합니다.' });

      const ratingNum = parseFloat(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ error: 'rating must be a number between 1 and 5' });
      }

      // job 존재 확인
      const { data: job, error: jobError } = await supabase
        .from('bot_jobs')
        .select('id')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // 참여 검증 — 해당 job에 accepted 상태로 참여한 사용자만 리뷰 가능
      const { data: participationCheck } = await supabase.from('bot_job_applications').select('id').eq('job_id', jobId).eq('applicant_user_id', userId).eq('status', 'accepted').single();
      if (!participationCheck) return res.status(403).json({ error: '해당 일감에 참여한 사용자만 리뷰를 작성할 수 있습니다.' });

      // 중복 리뷰 확인 (동일 job + 동일 reviewer)
      const { data: existing } = await supabase
        .from('job_reviews')
        .select('id')
        .eq('job_id', jobId)
        .eq('reviewer_user_id', userId)
        .single();

      if (existing) {
        return res.status(409).json({ error: 'You have already reviewed this job' });
      }

      const { data: review, error: insertError } = await supabase
        .from('job_reviews')
        .insert({
          job_id: jobId,
          target_bot_id: targetBotId,
          reviewer_user_id: userId,
          rating: ratingNum,
          comment: comment || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[job-review] Insert error:', insertError.message);
        return res.status(500).json({ error: 'Failed to create review', detail: 'Internal server error' });
      }

      // 업데이트된 평균 평점 계산
      const avgRating = await calculateAverageRating(supabase, targetBotId, jobId);

      return res.status(201).json({ review, avgRating });
    }

    // ─── PATCH: 리뷰 수정 (작성자만) ───
    if (req.method === 'PATCH') {
      const { reviewId, rating, comment } = req.body || {};

      if (!reviewId) {
        return res.status(400).json({ error: 'reviewId is required' });
      }

      if (rating === undefined && comment === undefined) {
        return res.status(400).json({ error: 'At least one of rating or comment must be provided' });
      }

      // 리뷰 조회 + 작성자 확인
      const { data: review, error: fetchError } = await supabase
        .from('job_reviews')
        .select('id, reviewer_user_id, target_bot_id, job_id')
        .eq('id', reviewId)
        .single();

      if (fetchError || !review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      if (review.reviewer_user_id !== userId) {
        return res.status(403).json({ error: 'Forbidden: only the reviewer can edit this review' });
      }

      const updates = { updated_at: new Date().toISOString() };

      if (rating !== undefined) {
        const ratingNum = parseFloat(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
          return res.status(400).json({ error: 'rating must be a number between 1 and 5' });
        }
        updates.rating = ratingNum;
      }

      if (comment !== undefined) {
        updates.comment = comment;
      }

      const { data: updated, error: updateError } = await supabase
        .from('job_reviews')
        .update(updates)
        .eq('id', reviewId)
        .select()
        .single();

      if (updateError) {
        console.error('[job-review] Update error:', updateError.message);
        return res.status(500).json({ error: 'Failed to update review', detail: 'Internal server error' });
      }

      const avgRating = await calculateAverageRating(
        supabase,
        review.target_bot_id,
        review.job_id
      );

      return res.status(200).json({ review: updated, avgRating });
    }

    // ─── DELETE: 리뷰 삭제 (작성자만) ───
    if (req.method === 'DELETE') {
      const { id: reviewId } = req.query;

      if (!reviewId) {
        return res.status(400).json({ error: 'id query parameter is required' });
      }

      // 리뷰 조회 + 작성자 확인
      const { data: review, error: fetchError } = await supabase
        .from('job_reviews')
        .select('id, reviewer_user_id')
        .eq('id', reviewId)
        .single();

      if (fetchError || !review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      if (review.reviewer_user_id !== userId) {
        return res.status(403).json({ error: 'Forbidden: only the reviewer can delete this review' });
      }

      const { error: deleteError } = await supabase
        .from('job_reviews')
        .delete()
        .eq('id', reviewId);

      if (deleteError) {
        console.error('[job-review] Delete error:', deleteError.message);
        return res.status(500).json({ error: 'Failed to delete review', detail: 'Internal server error' });
      }

      return res.status(200).json({ message: 'Review deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[job-review] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
