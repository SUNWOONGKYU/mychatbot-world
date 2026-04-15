// @task S5-FIX-F6
/**
 * Community Madang (마당) API — 마당 목록 + 인기 챗봇
 * GET /api/community/madang            — 마당 목록
 * GET /api/community/madang?popular_bots=1 — 인기 챗봇 (사이드바)
 *
 * Vanilla API 참조: api/Backend_APIs/community-madang.js (존재 시)
 * 기존 프론트가 /api/community-madang 를 호출했으나 해당 라우트 미존재 → 신규 생성
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration error: missing Supabase credentials');
  return createClient(url, key);
}

// 정적 마당 목록 (DB 테이블이 없는 경우 하드코딩)
const MADANG_LIST = [
  { id: 'free',       name: '자유 마당',     emoji: '💬', description: '자유롭게 이야기하는 공간' },
  { id: 'showcase',   name: '자랑 마당',     emoji: '🏆', description: '내 챗봇을 자랑하세요' },
  { id: 'tips',       name: '꿀팁 마당',     emoji: '💡', description: '챗봇 운영 노하우 공유' },
  { id: 'qna',        name: '질문 마당',     emoji: '❓', description: '궁금한 점을 물어보세요' },
  { id: 'collab',     name: '협업 마당',     emoji: '🤝', description: '함께 프로젝트를 진행해요' },
  { id: 'feedback',   name: '피드백 마당',   emoji: '📝', description: '서비스 개선 의견을 남겨주세요' },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const popularBots = searchParams.get('popular_bots');

    // 인기 챗봇 요청
    if (popularBots === '1') {
      const supabase = getSupabase();
      const { data: bots, error } = await supabase
        .from('mcw_bots')
        .select('id, bot_name, emoji, username, karma, post_count')
        .order('karma', { ascending: false })
        .limit(10);

      if (error) {
        console.error('[community/madang] popular bots error:', error.message);
        return NextResponse.json({ bots: [] });
      }
      return NextResponse.json({ bots: bots ?? [] }, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      });
    }

    // 마당 목록 (정적 데이터 — 장기 캐싱)
    return NextResponse.json({ madangs: MADANG_LIST }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (err) {
    console.error('[community/madang] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
