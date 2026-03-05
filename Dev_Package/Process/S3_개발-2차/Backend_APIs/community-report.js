// @task S3BA7
/**
 * Community Report API - Vercel Serverless Function
 * POST  /api/Backend_APIs/community-report         — 부적절한 콘텐츠 신고 (인증 필수)
 * GET   /api/Backend_APIs/community-report         — 신고 목록 조회 (관리자만)
 * PATCH /api/Backend_APIs/community-report         — 신고 상태 변경 (관리자만)
 *
 * bot_reports 테이블 사용
 * 관리자 여부: users 테이블의 role = 'admin' 또는 is_admin = true
 * Authorization: Bearer <supabase_access_token> 헤더 필수 (전 엔드포인트)
 *
 * 신고 reason 허용값: spam | inappropriate | abuse | misinformation | other
 * 신고 status 허용값: pending | reviewed | resolved | dismissed
 */
import { createClient } from '@supabase/supabase-js';

const ALLOWED_REASONS = ['spam', 'inappropriate', 'abuse', 'misinformation', 'other'];
const ALLOWED_STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'];

/** @returns {{ supabase: import('@supabase/supabase-js').SupabaseClient, error: string|null }} */
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { supabase: null, error: 'Server configuration error: missing Supabase credentials' };
  return { supabase: createClient(url, key), error: null };
}

/**
 * Bearer 토큰으로 Supabase 사용자를 인증한다.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} authHeader
 * @returns {Promise<{userId: string|null, error: string|null}>}
 */
async function authenticate(supabase, authHeader) {
  const token = (authHeader || '').startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { userId: null, error: 'Unauthorized: missing Bearer token' };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { userId: null, error: 'Unauthorized: invalid or expired token' };
  return { userId: data.user.id, error: null };
}

/**
 * 사용자가 관리자인지 확인한다.
 * users 테이블의 role = 'admin' 또는 is_admin = true인 경우 관리자로 판단.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function isAdmin(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, is_admin')
      .eq('id', userId)
      .single();

    if (error || !data) return false;
    return data.role === 'admin' || data.is_admin === true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { supabase, error: configError } = getSupabaseClient();
  if (configError) return res.status(500).json({ error: configError });

  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';

  try {
    // ─── GET: 신고 목록 조회 (관리자만) ───
    if (req.method === 'GET') {
      const { userId, error: authError } = await authenticate(supabase, authHeader);
      if (authError) return res.status(401).json({ error: authError });

      const adminCheck = await isAdmin(supabase, userId);
      if (!adminCheck) return res.status(403).json({ error: 'Forbidden: admin access required' });

      const { status, target_type, page = '1', limit = '20' } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const offset = (pageNum - 1) * limitNum;

      let query = supabase
        .from('bot_reports')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (status && ALLOWED_STATUSES.includes(status)) query = query.eq('status', status);
      if (target_type) query = query.eq('target_type', target_type);

      const { data: reports, count, error: fetchError } = await query;
      if (fetchError) {
        console.error('[community-report] list error:', fetchError.message);
        return res.status(500).json({ error: 'Failed to fetch reports', detail: fetchError.message });
      }

      return res.status(200).json({
        reports: reports || [],
        pagination: { page: pageNum, limit: limitNum, total: count || 0, totalPages: Math.ceil((count || 0) / limitNum) },
      });
    }

    // ─── POST: 신고 접수 (인증 필수) ───
    if (req.method === 'POST') {
      const { userId, error: authError } = await authenticate(supabase, authHeader);
      if (authError) return res.status(401).json({ error: authError });

      const { target_type, target_id, reason, description } = req.body || {};

      if (!target_type) return res.status(400).json({ error: 'Missing required field: target_type (post|comment)' });
      if (!target_id) return res.status(400).json({ error: 'Missing required field: target_id' });
      if (!reason) return res.status(400).json({ error: 'Missing required field: reason' });
      if (!ALLOWED_REASONS.includes(reason)) {
        return res.status(400).json({ error: `Invalid reason. Allowed values: ${ALLOWED_REASONS.join(', ')}` });
      }

      // 동일 사용자가 동일 타겟을 중복 신고하지 못하도록 확인
      const { data: existingReport } = await supabase
        .from('bot_reports')
        .select('id')
        .eq('reporter_id', userId)
        .eq('target_type', target_type)
        .eq('target_id', target_id)
        .maybeSingle();

      if (existingReport) {
        return res.status(409).json({ error: 'Conflict: you have already reported this content' });
      }

      const { data: newReport, error: insertError } = await supabase
        .from('bot_reports')
        .insert({
          reporter_id: userId,
          target_type,
          target_id,
          reason,
          description: description ? description.trim() : null,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        console.error('[community-report] insert error:', insertError.message);
        return res.status(500).json({ error: 'Failed to submit report', detail: insertError.message });
      }

      return res.status(201).json({ report: newReport });
    }

    // ─── PATCH: 신고 상태 변경 (관리자만) ───
    if (req.method === 'PATCH') {
      const { userId, error: authError } = await authenticate(supabase, authHeader);
      if (authError) return res.status(401).json({ error: authError });

      const adminCheck = await isAdmin(supabase, userId);
      if (!adminCheck) return res.status(403).json({ error: 'Forbidden: admin access required' });

      const { id, status, admin_note } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing required field: id' });
      if (!status) return res.status(400).json({ error: 'Missing required field: status' });
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}` });
      }

      const { data: existing, error: fetchErr } = await supabase
        .from('bot_reports')
        .select('id')
        .eq('id', id)
        .single();

      if (fetchErr) {
        if (fetchErr.code === 'PGRST116') return res.status(404).json({ error: 'Report not found' });
        return res.status(500).json({ error: 'Failed to fetch report', detail: fetchErr.message });
      }

      const updates = {
        status,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      };
      if (admin_note !== undefined) updates.admin_note = admin_note;

      const { data: updatedReport, error: updateError } = await supabase
        .from('bot_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('[community-report] update error:', updateError.message);
        return res.status(500).json({ error: 'Failed to update report status', detail: updateError.message });
      }

      return res.status(200).json({ report: updatedReport });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[community-report] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
