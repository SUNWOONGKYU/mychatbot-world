// @task S4BA2
/**
 * Credit Charge API — 무통장 입금 신청
 * POST /api/Backend_APIs/credit-charge
 *
 * Body: { amount: 5000 | 10000 | 30000 | 50000, depositor_name: string }
 * Response: { paymentId, amount, status: 'pending', bankInfo, message, createdAt }
 *
 * mcw_payments 테이블에 status='pending', payment_type='bank_transfer' 레코드 생성.
 * service_role 키를 사용하므로 RLS 우회 가능.
 */

import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = ['https://mychatbot.world', 'http://localhost:3000', 'http://localhost:5173'];

// 허용 충전 금액 (원)
const ALLOWED_AMOUNTS = [5000, 10000, 30000, 50000];

// 은행 정보 (환경 변수 우선, 없으면 기본값)
const BANK_NAME    = process.env.PAYMENT_BANK_NAME      || '하나은행';
const ACCOUNT_NUM  = process.env.PAYMENT_ACCOUNT_NUMBER || '287-910921-40507';
const ACCOUNT_HOLDER = process.env.PAYMENT_ACCOUNT_HOLDER || '파인더월드';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { supabase: null, error: 'Server configuration error: missing Supabase credentials' };
  return { supabase: createClient(url, key), error: null };
}

async function authenticate(supabase, authHeader) {
  const token = (authHeader || '').startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { userId: null, error: 'Unauthorized: missing Bearer token' };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { userId: null, error: 'Unauthorized: invalid or expired token' };
  return { userId: data.user.id, error: null };
}

function setCorsHeaders(res, origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  setCorsHeaders(res, origin);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { supabase, error: clientError } = getSupabaseClient();
    if (clientError || !supabase) {
      return res.status(500).json({ error: clientError || 'Supabase init failed' });
    }

    // 인증
    const { userId, error: authError } = await authenticate(supabase, req.headers.authorization);
    if (authError || !userId) {
      return res.status(401).json({ error: authError || 'Unauthorized' });
    }

    // 바디 파싱
    const { amount, depositor_name } = req.body || {};

    if (!amount || !ALLOWED_AMOUNTS.includes(Number(amount))) {
      return res.status(400).json({
        error: `유효하지 않은 충전 금액입니다. 허용 금액: ${ALLOWED_AMOUNTS.map(a => a.toLocaleString()).join(', ')}원`,
      });
    }

    if (!depositor_name || String(depositor_name).trim().length === 0) {
      return res.status(400).json({ error: '입금자명을 입력해주세요.' });
    }

    const numAmount = Number(amount);
    const trimmedName = String(depositor_name).trim();

    // mcw_payments 테이블에 INSERT (service_role 키로 RLS 우회)
    const { data: payment, error: insertError } = await supabase
      .from('mcw_payments')
      .insert({
        user_id: userId,
        provider: 'bank_transfer',
        payment_type: 'bank_transfer',
        amount: numAmount,
        credit_amount: numAmount, // 1원 = 1크레딧
        status: 'pending',
        metadata: { depositor_name: trimmedName },
        // 아래 필드는 스키마에 해당 컬럼이 있을 경우만 저장됨
        bank_name: BANK_NAME,
        account_number: ACCOUNT_NUM,
        account_holder: ACCOUNT_HOLDER,
        description: `크레딧 ${numAmount.toLocaleString()}원 무통장 입금 신청 (입금자: ${trimmedName})`,
      })
      .select('id, amount, status, created_at')
      .single();

    if (insertError || !payment) {
      console.error('[POST /credit-charge] Insert error:', insertError?.message);
      return res.status(500).json({ error: '입금 신청 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' });
    }

    return res.status(201).json({
      paymentId: payment.id,
      amount: payment.amount,
      status: 'pending',
      bankInfo: {
        bankName: BANK_NAME,
        accountNumber: ACCOUNT_NUM,
        accountHolder: ACCOUNT_HOLDER,
      },
      message: `아래 계좌로 ${numAmount.toLocaleString()}원을 입금해 주세요. 입금 확인 후 크레딧이 충전됩니다.`,
      createdAt: payment.created_at,
    });
  } catch (err) {
    console.error('[POST /credit-charge] Unexpected error:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
