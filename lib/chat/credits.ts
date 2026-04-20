/**
 * @task S5BA3
 * @description 크레딧 시스템 — chat/route.ts에서 분리
 */

import { createClient } from '@supabase/supabase-js';

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration error: missing Supabase credentials');
  return createClient(url, key) as any;
}

/**
 * 크레딧 잔액 확인 후 차감 (원자적 업데이트)
 * - S8BA1: deduct_credits_tx RPC 사용 — row lock + balance 체크 + update + tx 로그 단일 TX
 * - balance: 전체 잔액에서 차감
 * - subscription_balance: 구독 잔액도 동시 차감 (0 하한, RPC 내부 처리)
 */
export async function checkAndDeductCredits(
  userId: string,
  cost: number,
  opts?: { type?: string; description?: string }
): Promise<{ success: boolean; balance: number }> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase.rpc('deduct_credits_tx', {
    p_user_id: userId,
    p_amount: cost,
    p_type: opts?.type ?? 'usage',
    p_description: opts?.description ?? null,
  });

  if (error) {
    console.warn('[credits] deduct_credits_tx error:', error.message);
    return { success: false, balance: 0 };
  }

  const row = (data as Array<{ new_balance: number; success: boolean }> | null)?.[0];
  if (!row) return { success: false, balance: 0 };

  return { success: row.success, balance: row.new_balance };
}

/**
 * 크레딧 잔액 조회 (차감 없음)
 */
export async function getCreditsBalance(userId: string): Promise<number> {
  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from('mcw_credits')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as { balance: number } | null)?.balance ?? 0;
}

/**
 * 신규 가입 환영 크레딧 지급 (30,000크레딧, 최초 1회)
 * - mcw_credits 행이 없을 때만 INSERT → 중복 지급 자동 방지
 * - 이미 행이 있으면 false 반환 (기존 사용자)
 */
export async function grantWelcomeCredits(userId: string): Promise<boolean> {
  const supabase = getSupabaseServer();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('mcw_credits')
    .insert({
      user_id: userId,
      balance: 30000,
      subscription_balance: 30000, // 환영 크레딧은 구독 요금(×2) 기준 소비
      created_at: now,
      updated_at: now,
    });

  if (error) {
    if (error.code === '23505') {
      // unique violation → 기존 사용자 → 정상 스킵
      return false;
    }
    console.warn('[credits] grantWelcomeCredits insert error:', error.message);
    return false;
  }

  // 지급 내역 기록 (non-critical)
  try {
    await supabase.from('mcw_credit_transactions').insert({
      user_id: userId,
      type: 'welcome_bonus',
      amount: 30000,
      description: '신규 가입 환영 크레딧',
      created_at: now,
    });
  } catch (e) {
    // 내역 기록 실패해도 크레딧 지급 결과에 영향 없음
    console.warn('[credits] transaction log failed:', e);
  }

  return true;
}
