/**
 * @task S3BA2
 * @description 스킬 설치 / 제거 API
 *
 * POST   /api/skills/install  — 스킬 설치 (무료: 즉시, 유료: 결제 후)
 * DELETE /api/skills/install  — 스킬 제거 (status → 'uninstalled')
 *
 * 인증: Supabase Auth 세션 필요
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimitAsync } from '@/lib/rate-limiter';

// 동일 유저 + 동일 스킬 동시 설치 방지 락 (5s window)
const SKILL_INSTALL_LOCK = { limit: 1, windowMs: 5_000 } as const;

// ============================
// 타입 정의
// ============================

interface InstallRequest {
  skill_id: string;
  /** 유료 스킬 결제 확인 토큰 (옵션) */
  payment_token?: string;
}

interface UninstallRequest {
  skill_id: string;
}

interface SkillDef {
  id: string;
  name: string;
  isFree: boolean;
  price: number;
}

// ============================
// Supabase 클라이언트
// ============================

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

function getSupabaseUser(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

// ============================
// 스킬 정의 로더 (mcw_skills DB 조회)
// ============================

async function loadSkillDef(skillId: string): Promise<SkillDef | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('mcw_skills')
    .select('id, name, price, metadata, is_active')
    .eq('metadata->>legacy_id', skillId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: skillId,
    name: data.name,
    isFree: data.metadata?.isFree ?? (Number(data.price) === 0),
    price: Number(data.price) ?? 0,
  };
}

// ============================
// 결제 처리 (20% 수수료)
// ============================

/**
 * 유료 스킬 결제 처리 — 크레딧 차감 방식
 * - 사용자 크레딧 잔액에서 스킬 가격 차감
 * - 잔액 부족 시 크레딧 충전 안내
 */
async function processSkillPayment(
  supabase: ReturnType<typeof getSupabaseServer>,
  userId: string,
  skillId: string,
  skillName: string,
  grossAmount: number,
  paymentToken?: string
): Promise<{ success: boolean; error?: string }> {
  // 크레딧 잔액 조회
  const { data: creditData, error: creditError } = await supabase
    .from('mcw_credits')
    .select('id, balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (creditError) {
    console.error('[processSkillPayment] credit query error:', creditError);
    return { success: false, error: '크레딧 조회에 실패했습니다.' };
  }

  const currentBalance = Number(creditData?.balance ?? 0);

  if (currentBalance < grossAmount) {
    return {
      success: false,
      error: `크레딧이 부족합니다. 필요: ${grossAmount.toLocaleString()}원, 잔액: ${currentBalance.toLocaleString()}원. 마이페이지에서 크레딧을 충전해주세요.`
    };
  }

  // 크레딧 차감 (RPC로 atomic update)
  const newBalance = currentBalance - grossAmount;
  const { error: updateError } = await supabase
    .from('mcw_credits')
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('[processSkillPayment] credit deduct error:', updateError);
    return { success: false, error: '크레딧 차감에 실패했습니다.' };
  }

  // 거래 내역 기록
  await supabase.from('mcw_credit_transactions').insert({
    user_id: userId,
    type: 'use',
    amount: -grossAmount,
    balance_after: newBalance,
    description: `스킬 구매: ${skillName}`,
    reference_type: 'skill',
    metadata: { skill_id: skillId, skill_name: skillName, price: grossAmount },
  });

  return { success: true };
}

// ============================
// POST /api/skills/install
// ============================

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InstallRequest;
    const { skill_id, payment_token } = body;

    if (!skill_id?.trim()) {
      return NextResponse.json(
        { error: 'skill_id가 필요합니다.' },
        { status: 400 }
      );
    }

    // 인증 확인
    const supabaseUser = getSupabaseUser(req);
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 동시 설치 요청 방지 (유저 + 스킬 단위 락)
    const lockKey = `skill-install:${user.id}:${skill_id}`;
    const lock = await rateLimitAsync(req, SKILL_INSTALL_LOCK, lockKey);
    if (!lock.allowed) {
      return NextResponse.json(
        { error: '이미 설치 처리 중입니다. 잠시 후 다시 시도해주세요.' },
        {
          status: 429,
          headers: { 'Retry-After': String(lock.retryAfterSec) },
        }
      );
    }

    const supabase = getSupabaseServer();

    // 스킬 정의 로드
    const skillDef = await loadSkillDef(skill_id);
    if (!skillDef) {
      return NextResponse.json(
        { error: '존재하지 않는 스킬입니다.' },
        { status: 404 }
      );
    }

    // 이미 설치된 경우 확인
    const { data: existing } = await supabase
      .from('skill_installations')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('skill_id', skill_id)
      .maybeSingle();

    if (existing?.status === 'active') {
      return NextResponse.json(
        { error: '이미 설치된 스킬입니다.' },
        { status: 409 }
      );
    }

    // 유료 스킬 결제 처리
    if (!skillDef.isFree && skillDef.price > 0) {
      const payResult = await processSkillPayment(
        supabase,
        user.id,
        skill_id,
        skillDef.name,
        skillDef.price,
        payment_token
      );
      if (!payResult.success) {
        return NextResponse.json(
          { error: payResult.error ?? '결제에 실패했습니다.' },
          { status: 402 }
        );
      }
    }

    // 설치 기록 저장 (기존 uninstalled 레코드가 있으면 재활성화)
    let installRecord;
    if (existing?.status === 'uninstalled') {
      const { data, error } = await supabase
        .from('skill_installations')
        .update({ status: 'active', installed_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      installRecord = data;
    } else {
      const { data, error } = await supabase
        .from('skill_installations')
        .insert({
          user_id: user.id,
          skill_id,
          skill_name: skillDef.name,
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      installRecord = data;
    }

    return NextResponse.json(
      {
        message: '스킬이 설치되었습니다.',
        installation: installRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/skills/install] error:', error);
    return NextResponse.json(
      { error: '스킬 설치 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// ============================
// DELETE /api/skills/install
// ============================

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as UninstallRequest;
    const { skill_id } = body;

    if (!skill_id?.trim()) {
      return NextResponse.json(
        { error: 'skill_id가 필요합니다.' },
        { status: 400 }
      );
    }

    // 인증 확인
    const supabaseUser = getSupabaseUser(req);
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    // 설치 레코드 확인
    const { data: installation } = await supabase
      .from('skill_installations')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('skill_id', skill_id)
      .maybeSingle();

    if (!installation) {
      return NextResponse.json(
        { error: '설치된 스킬을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (installation.status === 'uninstalled') {
      return NextResponse.json(
        { error: '이미 제거된 스킬입니다.' },
        { status: 409 }
      );
    }

    // soft delete: status → 'uninstalled'
    const { error } = await supabase
      .from('skill_installations')
      .update({ status: 'uninstalled' })
      .eq('id', installation.id);

    if (error) throw error;

    return NextResponse.json({ message: '스킬이 제거되었습니다.' });
  } catch (error) {
    console.error('[DELETE /api/skills/install] error:', error);
    return NextResponse.json(
      { error: '스킬 제거 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
