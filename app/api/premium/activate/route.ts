/**
 * POST /api/premium/activate
 * 프리미엄 기능 1회 크레딧 차감 활성화
 *
 * body: { feature: 'voice_clone' | 'avatar_3d' | 'custom_theme' }
 * 인증: Authorization: Bearer <access_token> 또는 sb-access-token 쿠키
 *
 * 처리 순서:
 *   1. 사용자 인증 확인
 *   2. 이미 활성화 여부 확인 (user_metadata)
 *   3. 크레딧 차감 (checkAndDeductCredits)
 *   4. user_metadata에 활성화 기록
 *   5. mcw_credit_transactions 내역 기록 (non-critical)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAndDeductCredits } from '@/lib/chat/credits';
import { rateLimitAsync } from '@/lib/rate-limiter';

// 동시 활성화(이중 차감) 방지용 Redis 락 — user+feature 단위로 5초간 1회 제한
const ACTIVATE_LOCK = { limit: 1, windowMs: 5_000 };

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key) as any;
}

// 기능별 1회 활성화 크레딧 비용
const FEATURE_COSTS: Record<string, number> = {
  voice_clone:  50000,
  avatar_3d:    30000,
  custom_theme: 20000,
};

const FEATURE_META_KEY: Record<string, string> = {
  voice_clone:  'premium_voice_clone',
  avatar_3d:    'premium_avatar_3d',
  custom_theme: 'premium_custom_theme',
};

const FEATURE_LABEL: Record<string, string> = {
  voice_clone:  '목소리 복제',
  avatar_3d:    '3D 아바타',
  custom_theme: '커스텀 테마',
};

async function resolveUserId(req: NextRequest): Promise<{ userId: string; user: any } | null> {
  const supabase = getSupabaseServer();

  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) return { userId: data.user.id, user: data.user };
  }

  const accessToken = req.cookies.get('sb-access-token')?.value;
  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error && data.user) return { userId: data.user.id, user: data.user };
  }

  return null;
}

export async function POST(req: NextRequest) {
  const auth = await resolveUserId(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { userId, user } = auth;

  let feature: string;
  try {
    ({ feature } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!FEATURE_COSTS[feature]) {
    return NextResponse.json({ error: 'Unknown feature' }, { status: 400 });
  }

  const metaKey = FEATURE_META_KEY[feature];

  // 동시 요청 직렬화 (이중 차감 race window 최소화)
  //   키: premium:{userId}:{feature} — 5초에 1회만 허용
  const lock = await rateLimitAsync(req, ACTIVATE_LOCK, `premium:${userId}:${feature}`);
  if (!lock.allowed) {
    return NextResponse.json(
      { error: '활성화가 이미 진행 중입니다. 잠시 후 다시 시도해주세요.' },
      { status: 429, headers: { 'Retry-After': String(lock.retryAfterSec) } },
    );
  }

  // 이미 활성화된 경우
  if (user?.user_metadata?.[metaKey] === true) {
    return NextResponse.json({ error: 'Already activated' }, { status: 409 });
  }

  const cost = FEATURE_COSTS[feature];

  // 크레딧 확인 및 차감 (원자적 — deduct_credits_tx RPC)
  const creditResult = await checkAndDeductCredits(userId, cost, {
    type: 'feature_activation',
    description: `프리미엄 기능 활성화: ${FEATURE_LABEL[feature]}`,
  });
  if (!creditResult.success) {
    return NextResponse.json(
      { error: 'Insufficient credits', balance: creditResult.balance, required: cost },
      { status: 402 },
    );
  }

  const supabase = getSupabaseServer();

  // user_metadata에 활성화 기록
  const { error: metaErr } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...user?.user_metadata,
      [metaKey]: true,
      [`${metaKey}_activated_at`]: new Date().toISOString(),
    },
  });

  if (metaErr) {
    // 메타 업데이트 실패 시 크레딧 복구 (atomic refund)
    await supabase.rpc('add_credits_tx', {
      p_user_id: userId,
      p_amount: cost,
      p_type: 'refund',
      p_description: `프리미엄 기능 활성화 실패 환불: ${FEATURE_LABEL[feature]}`,
    });

    console.error('[premium/activate] metadata update failed:', metaErr.message);
    return NextResponse.json({ error: 'Activation failed. Credits refunded.' }, { status: 500 });
  }

  // 차감 이력은 deduct_credits_tx RPC 가 단일 트랜잭션에서 이미 기록함 (S8BA1)

  return NextResponse.json({
    success: true,
    feature,
    label:   FEATURE_LABEL[feature],
    balance: creditResult.balance,
    message: `${FEATURE_LABEL[feature]} 기능이 활성화되었습니다!`,
  });
}
