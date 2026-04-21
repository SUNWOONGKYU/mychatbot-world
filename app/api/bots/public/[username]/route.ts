/**
 * @description 공개 코코봇 조회 API — 누구나 접근 가능 (service role로 RLS 우회)
 *
 * GET /api/bots/public/[username]
 * Response: { success, data: { bot, personas } }
 *
 * 목적: /bot/[botId] 페이지가 로그인 여부와 상관없이 봇 정보를 볼 수 있도록 한다.
 * mcw_bots RLS는 소유자/관리자만 허용하므로, 이 엔드포인트는 service role로 조회하되
 * 민감 컬럼(pairing_code, dm_policy 관련 내부 필드)은 제외한다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const key = (username ?? '').trim();
  if (!key) {
    return NextResponse.json(
      { success: false, error: 'username이 필요합니다.' },
      { status: 400 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // id 또는 username으로 조회
  const { data: bot, error: botErr } = await supabase
    .from('mcw_bots')
    .select(
      'id, username, bot_name, bot_desc, emoji, greeting, faqs, voice, avatar_url, theme_mode, theme_color, category, owner_id'
    )
    .or(`id.eq.${key},username.eq.${key}`)
    .maybeSingle();

  if (botErr) {
    return NextResponse.json(
      { success: false, error: botErr.message },
      { status: 500 }
    );
  }
  if (!bot) {
    return NextResponse.json(
      { success: false, error: '봇을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 페르소나 목록 (공개 페르소나만)
  const { data: personas } = await supabase
    .from('mcw_personas')
    .select(
      'id, name, role, category, model, iq_eq, is_visible, is_public, greeting, faqs, user_title'
    )
    .eq('bot_id', bot.id)
    .order('created_at', { ascending: true });

  return NextResponse.json({
    success: true,
    data: {
      bot,
      personas: personas ?? [],
    },
  });
}
