/**
 * @task S3BA5 (React 전환)
 * @description 챗봇 성장 지표 & 레벨 API
 *
 * Vanilla 원본: api/Backend_APIs/growth.js
 *
 * GET /api/bots/[id]/growth
 *   헤더: Authorization: Bearer {token}
 *   응답: { botId, level, experience, nextLevelExp, stats }
 *
 * 경험치 공식: (total_conversations × 10) + (faq_count × 5) + (positive_feedback × 2)
 * 레벨 기준:  1 = 0-99exp,  2 = 100-299exp,  3 = 300+exp
 *
 * 테이블: mcw_bots (소유자 확인), bot_growth (성장 데이터)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

function calcExperience(conversations: number, faqCount: number, positiveFeedback: number): number {
  return Math.max(0, (conversations * 10) + (faqCount * 5) + (positiveFeedback * 2));
}

function calcLevel(exp: number): number {
  if (exp >= 300) return 3;
  if (exp >= 100) return 2;
  return 1;
}

function getNextLevelExp(level: number): number | null {
  if (level === 1) return 100;
  if (level === 2) return 300;
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: botId } = await params;

  if (!botId?.trim()) {
    return NextResponse.json({ error: '봇 ID가 필요합니다.' }, { status: 400 });
  }

  // 인증
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Bearer 토큰이 필요합니다.' }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized: 유효하지 않은 토큰입니다.' }, { status: 401 });
  }

  // 봇 소유자 확인 (mcw_bots 우선, 없으면 bots 폴백)
  let ownerId: string | null = null;

  const { data: mcwBot, error: mcwErr } = await supabase
    .from('mcw_bots')
    .select('user_id')
    .eq('id', botId)
    .maybeSingle();

  if (mcwErr && mcwErr.code !== 'PGRST116') {
    console.error('[bots/growth] mcw_bots query error:', mcwErr.message);
    return NextResponse.json({ error: '봇 정보 조회에 실패했습니다.' }, { status: 500 });
  }

  if (mcwBot) {
    ownerId = mcwBot.user_id;
  } else {
    const { data: legacyBot, error: botErr } = await supabase
      .from('bots')
      .select('user_id')
      .eq('id', botId)
      .maybeSingle();

    if (botErr && botErr.code !== 'PGRST116') {
      console.error('[bots/growth] bot query error:', botErr.message);
      return NextResponse.json({ error: '봇 정보 조회에 실패했습니다.' }, { status: 500 });
    }
    if (!legacyBot) {
      return NextResponse.json({ error: '봇을 찾을 수 없습니다.' }, { status: 404 });
    }
    ownerId = legacyBot.user_id;
  }

  if (ownerId !== user.id) {
    return NextResponse.json({ error: '본인 봇의 성장 지표만 조회할 수 있습니다.' }, { status: 403 });
  }

  // bot_growth 조회
  const { data: growth, error: growthErr } = await supabase
    .from('bot_growth')
    .select('total_conversations, total_messages, faq_count, positive_feedback, avg_rating')
    .eq('bot_id', botId)
    .maybeSingle();

  if (growthErr && growthErr.code !== 'PGRST116') {
    console.error('[bots/growth] growth query error:', growthErr.message);
    return NextResponse.json({ error: '성장 데이터 조회에 실패했습니다.' }, { status: 500 });
  }

  // 레코드 없으면 초기값
  const totalConversations = growth?.total_conversations ?? 0;
  const totalMessages      = growth?.total_messages      ?? 0;
  const faqCount           = growth?.faq_count           ?? 0;
  const positiveFeedback   = growth?.positive_feedback   ?? 0;
  const avgRating          = growth?.avg_rating != null  ? Number(growth.avg_rating) : 0;

  const experience = calcExperience(totalConversations, faqCount, positiveFeedback);
  const level      = calcLevel(experience);

  return NextResponse.json({
    botId,
    level,
    experience,
    nextLevelExp: getNextLevelExp(level),
    stats: {
      totalConversations,
      totalMessages,
      faqCount,
      positiveFeedback,
      avgRating,
    },
  });
}
