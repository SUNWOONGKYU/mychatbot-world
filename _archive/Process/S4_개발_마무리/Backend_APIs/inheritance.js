// @task S4BA3
/**
 * Inheritance API - Vercel Serverless Function
 * 봇 상속 설정 관리 API
 *
 * POST   /api/Backend_APIs/inheritance?action=create  - 상속 설정 생성
 * GET    /api/Backend_APIs/inheritance                - 상속 목록 조회 (내가 설정한 + 상속인으로 지정된)
 * PATCH  /api/Backend_APIs/inheritance?action=accept&id=XXX - 상속 수락
 * DELETE /api/Backend_APIs/inheritance?id=XXX        - 상속 설정 삭제
 *
 * 테이블: bot_inheritance
 *   - id (uuid, PK)
 *   - owner_user_id (uuid, FK auth.users)
 *   - heir_email (text)
 *   - bot_ids (uuid[], 상속 대상 봇 목록)
 *   - condition_months (int, 비활성 조건 개월 수)
 *   - status (text: 'pending' | 'accepted' | 'cancelled')
 *   - created_at (timestamptz)
 *   - updated_at (timestamptz)
 */

const { createClient } = require('@supabase/supabase-js');

// ─── Supabase 클라이언트 초기화 ───
function getSupabaseClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Server configuration error: missing Supabase credentials');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// ─── Bearer 토큰 추출 + 사용자 인증 ───
async function authenticateUser(req, supabase) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return { user: null, error: 'Unauthorized: missing Bearer token' };
  }

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) {
    console.warn('[inheritance] Auth error:', authError?.message);
    return { user: null, error: 'Unauthorized: invalid or expired token' };
  }

  return { user: userData.user, error: null };
}

// ─── POST: 상속 설정 생성 ───
async function handleCreate(req, res, supabase, userId) {
  const { heirEmail, botIds, conditionMonths } = req.body || {};

  if (!heirEmail || !Array.isArray(botIds) || botIds.length === 0 || !conditionMonths) {
    return res.status(400).json({
      error: 'heirEmail, botIds (array), conditionMonths are required',
    });
  }

  if (typeof conditionMonths !== 'number' || conditionMonths < 1) {
    return res.status(400).json({ error: 'conditionMonths must be a positive integer' });
  }

  // 이메일 형식 기본 검증
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(heirEmail)) {
    return res.status(400).json({ error: 'Invalid heirEmail format' });
  }

  try {
    const { data, error } = await supabase
      .from('bot_inheritance')
      .insert({
        owner_user_id: userId,
        heir_email: heirEmail.toLowerCase().trim(),
        bot_ids: botIds,
        condition_months: conditionMonths,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id, status')
      .single();

    if (error) {
      console.error('[inheritance] create error:', error.message);
      return res.status(500).json({ error: 'Failed to create inheritance setting', detail: error.message });
    }

    return res.status(201).json({
      inheritanceId: data.id,
      status: data.status,
    });
  } catch (e) {
    console.error('[inheritance] create unexpected error:', e.message);
    return res.status(500).json({ error: 'Internal server error', detail: e.message });
  }
}

// ─── GET: 상속 목록 조회 ───
// 내가 오너인 설정 + 상속인으로 지정된 설정 함께 반환
async function handleList(req, res, supabase, userId, userEmail) {
  try {
    // 1. 내가 오너인 상속 설정
    const { data: ownerRows, error: ownerError } = await supabase
      .from('bot_inheritance')
      .select('id, heir_email, bot_ids, condition_months, status, created_at, updated_at')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false });

    if (ownerError) {
      console.error('[inheritance] list owner error:', ownerError.message);
      return res.status(500).json({ error: 'Failed to fetch owned inheritances', detail: ownerError.message });
    }

    // 2. 내가 상속인으로 지정된 설정 (heir_email 기준)
    const { data: heirRows, error: heirError } = await supabase
      .from('bot_inheritance')
      .select('id, owner_user_id, bot_ids, condition_months, status, created_at, updated_at')
      .eq('heir_email', userEmail.toLowerCase().trim())
      .order('created_at', { ascending: false });

    if (heirError) {
      console.error('[inheritance] list heir error:', heirError.message);
      return res.status(500).json({ error: 'Failed to fetch heir inheritances', detail: heirError.message });
    }

    return res.status(200).json({
      owned: ownerRows || [],
      asHeir: heirRows || [],
    });
  } catch (e) {
    console.error('[inheritance] list unexpected error:', e.message);
    return res.status(500).json({ error: 'Internal server error', detail: e.message });
  }
}

// ─── PATCH: 상속 수락 ───
async function handleAccept(req, res, supabase, userId, userEmail, inheritanceId) {
  if (!inheritanceId) {
    return res.status(400).json({ error: 'id query parameter is required' });
  }

  try {
    // 해당 상속 설정 조회
    const { data: record, error: fetchError } = await supabase
      .from('bot_inheritance')
      .select('id, heir_email, status, owner_user_id')
      .eq('id', inheritanceId)
      .single();

    if (fetchError || !record) {
      return res.status(404).json({ error: 'Inheritance setting not found' });
    }

    // 상속인 본인 확인 (heir_email이 현재 사용자 이메일과 일치해야 함)
    if (record.heir_email.toLowerCase() !== userEmail.toLowerCase()) {
      return res.status(403).json({ error: 'Forbidden: you are not the designated heir' });
    }

    // 이미 처리된 상태 확인
    if (record.status !== 'pending') {
      return res.status(400).json({
        error: `Cannot accept: current status is '${record.status}'`,
      });
    }

    // 수락 처리
    const { data: updated, error: updateError } = await supabase
      .from('bot_inheritance')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', inheritanceId)
      .select('id, status')
      .single();

    if (updateError) {
      console.error('[inheritance] accept update error:', updateError.message);
      return res.status(500).json({ error: 'Failed to accept inheritance', detail: updateError.message });
    }

    return res.status(200).json({
      inheritanceId: updated.id,
      status: updated.status,
    });
  } catch (e) {
    console.error('[inheritance] accept unexpected error:', e.message);
    return res.status(500).json({ error: 'Internal server error', detail: e.message });
  }
}

// ─── DELETE: 상속 설정 삭제 ───
async function handleDelete(req, res, supabase, userId, inheritanceId) {
  if (!inheritanceId) {
    return res.status(400).json({ error: 'id query parameter is required' });
  }

  try {
    // 해당 상속 설정 조회 (owner_user_id 검증)
    const { data: record, error: fetchError } = await supabase
      .from('bot_inheritance')
      .select('id, owner_user_id')
      .eq('id', inheritanceId)
      .single();

    if (fetchError || !record) {
      return res.status(404).json({ error: 'Inheritance setting not found' });
    }

    // 오너 본인 확인
    if (record.owner_user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden: only the owner can delete this inheritance setting' });
    }

    // 삭제 처리
    const { error: deleteError } = await supabase
      .from('bot_inheritance')
      .delete()
      .eq('id', inheritanceId);

    if (deleteError) {
      console.error('[inheritance] delete error:', deleteError.message);
      return res.status(500).json({ error: 'Failed to delete inheritance setting', detail: deleteError.message });
    }

    return res.status(200).json({ success: true, deletedId: inheritanceId });
  } catch (e) {
    console.error('[inheritance] delete unexpected error:', e.message);
    return res.status(500).json({ error: 'Internal server error', detail: e.message });
  }
}

// ─── 메인 핸들러 ───
module.exports = async (req, res) => {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 허용 메서드 검사
  const allowedMethods = ['GET', 'POST', 'PATCH', 'DELETE'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Supabase 클라이언트 초기화 ──
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  // ── 인증 ──
  const { user, error: authError } = await authenticateUser(req, supabase);
  if (!user) {
    return res.status(401).json({ error: authError });
  }

  const userId = user.id;
  const userEmail = user.email || '';

  const { action, id: inheritanceId } = req.query;

  // ── 라우팅 ──
  try {
    if (req.method === 'POST' && action === 'create') {
      return await handleCreate(req, res, supabase, userId);
    }

    if (req.method === 'GET') {
      return await handleList(req, res, supabase, userId, userEmail);
    }

    if (req.method === 'PATCH' && action === 'accept') {
      return await handleAccept(req, res, supabase, userId, userEmail, inheritanceId);
    }

    if (req.method === 'DELETE') {
      return await handleDelete(req, res, supabase, userId, inheritanceId);
    }

    // 정의되지 않은 action/method 조합
    return res.status(400).json({
      error: 'Invalid action or method combination',
      hint: 'POST?action=create | GET | PATCH?action=accept&id=XXX | DELETE?id=XXX',
    });
  } catch (e) {
    console.error('[inheritance] unhandled error:', e.message);
    return res.status(500).json({ error: 'Internal server error', detail: e.message });
  }
};
