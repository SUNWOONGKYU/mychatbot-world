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
 * - balance: 전체 잔액에서 차감
 * - subscription_balance: 구독 잔액도 동시 차감 (음수 방지, 0 하한)
 */
export async function checkAndDeductCredits(
  userId: string,
  cost: number
): Promise<{ success: boolean; balance: number }> {
  const supabase = getSupabaseServer();

  const { data, error: fetchError } = await supabase
    .from('mcw_credits')
    .select('balance, subscription_balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    console.warn('[credits] fetch error:', fetchError.message);
    return { success: false, balance: 0 };
  }

  const currentBalance: number = (data as any)?.balance ?? 0;
  const currentSubBalance: number = (data as any)?.subscription_balance ?? 0;

  if (currentBalance < cost) {
    return { success: false, balance: currentBalance };
  }

  const newBalance = currentBalance - cost;
  // 구독 잔액은 차감하되 0 이하로 내려가지 않음
  const newSubBalance = Math.max(0, currentSubBalance - cost);

  const { data: updated, error: updateError } = await supabase
    .from('mcw_credits')
    .update({
      balance: newBalance,
      subscription_balance: newSubBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .gte('balance', cost)
    .select('balance');

  if (updateError) {
    console.warn('[credits] update error:', updateError.message);
    return { success: false, balance: currentBalance };
  }

  // .gte 필터로 인해 0행 업데이트된 경우 → 동시 요청으로 잔액 소진
  if (!updated || (updated as any[]).length === 0) {
    console.warn('[credits] 0-row update detected (concurrent depletion), userId:', userId);
    return { success: false, balance: currentBalance };
  }

  return { success: true, balance: newBalance };
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
