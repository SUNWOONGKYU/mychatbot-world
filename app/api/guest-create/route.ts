/**
 * @task S3BA1 — 게스트 코코봇 생성 API
 * @description POST /api/guest-create — 인증 없이 게스트용 봇 ID 반환
 *
 * 요청: { botName: string, templateId: string }
 * 응답: { botId: string, guestSessionId: string }
 *
 * templateId → 사전 생성된 봇 ID 매핑 (10개 고정)
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limiter';

// ── 사전 생성된 템플릿 봇 매핑 ─────────────────────────────────────────────
// 신 분류(아바타형/도우미형 6+6) — 기존 데모 봇 ID 재사용
// 구 분류(restaurant 등)는 호환성을 위해 유지
const TEMPLATE_BOT_MAP: Record<string, string> = {
  // 아바타형 (6) — 나를 대신
  guest_avatar_executive:    'bot_mnv6cup1_8mh5ef',
  guest_avatar_smallbiz:     'bot_mnv6d2za_37cyf2',
  guest_avatar_professional: 'bot_mnv6d8iy_92pk8t',
  guest_avatar_freelancer:   'bot_mnv6dgvo_l5y8bd',
  guest_avatar_politician:   'bot_mnv6do4w_f9aya2',
  guest_avatar_other:        'bot_mnv6dvuu_3dxrez',

  // 도우미형 (6) — 나를 도와
  guest_helper_work:     'bot_mnv6dvuu_3dxrez',
  guest_helper_learning: 'bot_mnv6e2lg_7p1vtr',
  guest_helper_creative: 'bot_mnv6efjr_w3l2ip',
  guest_helper_health:   'bot_mnv6e9qx_0sv8tw',
  guest_helper_life:     'bot_mnv6el6w_a9ru8n',
  guest_helper_other:    'bot_mnv6dvuu_3dxrez',

  // 구 분류 — 호환성 유지
  guest_restaurant: 'bot_mnv6cup1_8mh5ef',
  guest_hospital:   'bot_mnv6d2za_37cyf2',
  guest_lawyer:     'bot_mnv6d8iy_92pk8t',
  guest_realestate: 'bot_mnv6dgvo_l5y8bd',
  guest_academy:    'bot_mnv6do4w_f9aya2',
  guest_work:       'bot_mnv6dvuu_3dxrez',
  guest_study:      'bot_mnv6e2lg_7p1vtr',
  guest_health:     'bot_mnv6e9qx_0sv8tw',
  guest_finance:    'bot_mnv6efjr_w3l2ip',
  guest_life:       'bot_mnv6el6w_a9ru8n',
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate limiting: 시간당 20회 per IP (공개 엔드포인트 보호 — S2AP6)
  const rl = rateLimit(req, { limit: 20, windowMs: 3_600_000 }, 'guest-create');
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

  let body: { botName?: string; templateId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { templateId } = body;

  if (!templateId || typeof templateId !== 'string') {
    return NextResponse.json({ success: false, message: 'templateId가 필요합니다.' }, { status: 400 });
  }

  const botId = TEMPLATE_BOT_MAP[templateId];
  if (!botId) {
    return NextResponse.json({ success: false, message: `알 수 없는 templateId: ${templateId}` }, { status: 400 });
  }

  const guestSessionId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  return NextResponse.json({ botId, guestSessionId });
}
