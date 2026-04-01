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
import { promises as fs } from 'fs';
import path from 'path';

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
  return createClient(url, key) as any;
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
// 스킬 정의 로더
// ============================

async function loadSkillDef(skillId: string): Promise<SkillDef | null> {
  const filePath = path.join(
    process.cwd(),
    'skill-market',
    'prompt-skills',
    `${skillId}.json`
  );
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as SkillDef;
  } catch {
    return null;
  }
}

// ============================
// 결제 처리 (20% 수수료)
// ============================

/**
 * 유료 스킬 결제 처리
 * - gross_amount: 스킬 가격 (원)
 * - commission_rate: 20%
 * - commission_amount: gross × 0.20
 * - net_amount: gross × 0.80 (개발자 수익)
 *
 * 현재 구현: payment_token 유효성 검증 후 결제 완료 처리
 * 향후 PG 연동 시 이 함수를 교체
 */
async function processSkillPayment(
  supabase: ReturnType<typeof getSupabaseServer>,
  userId: string,
  skillId: string,
  skillName: string,
  grossAmount: number,
  paymentToken?: string
): Promise<{ success: boolean; error?: string }> {
  // 결제 토큰 검증 (실제 PG 연동 전 placeholder)
  if (!paymentToken || paymentToken.length < 8) {
    return { success: false, error: '유효하지 않은 결제 토큰입니다.' };
  }

  const commissionRate = 20.0;
  const commissionAmount = Math.round(grossAmount * 0.2);
  const netAmount = grossAmount - commissionAmount;

  // job_settlements와 동일한 20% 수수료 구조 활용
  const { error } = await supabase.from('job_settlements').insert({
    employer_id: userId,
    freelancer_id: null, // 스킬 판매자 (추후 연동)
    gross_amount: grossAmount,
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    net_amount: netAmount,
    status: 'completed',
    // skill 관련 메타데이터는 description 컬럼에 기록 (없으면 remarks)
  });

  if (error) {
    console.error('[processSkillPayment] settlement error:', error);
    return { success: false, error: '결제 기록 저장에 실패했습니다.' };
  }

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
