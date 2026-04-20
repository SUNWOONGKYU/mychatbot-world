/**
 * @description GET /api/learning/stats — 사용자의 코코봇 학습 현황 집계
 *
 * 응답: { kb_count, wiki_count, faq_count, quality_avg }
 * - kb_count: mcw_kb_items 총 개수 (해당 사용자의 모든 봇 합산)
 * - wiki_count: wiki_pages 총 개수
 * - faq_count: faqs 총 개수
 * - quality_avg: wiki_pages.quality_score 평균 (0~1, % 표시용)
 *
 * 인증: Supabase Bearer token 필수
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RecentLearning {
  id: string;
  title: string;
  page_type: string;
  quality_score: number;
  created_at: string;
}

interface LearningStats {
  kb_count: number;
  wiki_count: number;
  faq_count: number;
  quality_avg: number;
  recent: RecentLearning[];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: userResp } = await supabase.auth.getUser(token);
  const user = userResp?.user;
  if (!user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }

  try {
    // 사용자가 소유한 봇 ID 목록
    const { data: bots, error: botsError } = await supabase
      .from('mcw_bots')
      .select('id')
      .eq('owner_id', user.id);

    if (botsError) {
      console.error('[learning/stats] bots 조회 실패:', botsError.message);
      return NextResponse.json(
        { success: false, error: '봇 목록을 불러오지 못했습니다.', data: null },
        { status: 500 }
      );
    }

    const botIds = (bots ?? []).map((b: { id: string }) => b.id);

    if (botIds.length === 0) {
      const empty: LearningStats = { kb_count: 0, wiki_count: 0, faq_count: 0, quality_avg: 0, recent: [] };
      return NextResponse.json({ success: true, error: null, data: empty });
    }

    // 병렬 집계
    const [kbRes, wikiRes, faqRes, qualityRes, recentRes] = await Promise.all([
      supabase.from('mcw_kb_items').select('id', { count: 'exact', head: true }).in('bot_id', botIds),
      supabase.from('wiki_pages').select('id', { count: 'exact', head: true }).in('bot_id', botIds),
      supabase.from('faqs').select('id', { count: 'exact', head: true }).in('chatbot_id', botIds),
      supabase.from('wiki_pages').select('quality_score').in('bot_id', botIds),
      supabase
        .from('wiki_pages')
        .select('id, title, page_type, quality_score, created_at')
        .in('bot_id', botIds)
        .eq('auto_generated', true)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const scores = (qualityRes.data as { quality_score: number | null }[] | null) ?? [];
    const validScores = scores.map(s => s.quality_score ?? 0).filter(n => n > 0);
    const quality_avg = validScores.length === 0
      ? 0
      : validScores.reduce((a, b) => a + b, 0) / validScores.length;

    const stats: LearningStats = {
      kb_count: kbRes.count ?? 0,
      wiki_count: wikiRes.count ?? 0,
      faq_count: faqRes.count ?? 0,
      quality_avg,
      recent: (recentRes.data as RecentLearning[] | null) ?? [],
    };

    return NextResponse.json({ success: true, error: null, data: stats });
  } catch (err) {
    console.error('[learning/stats] 예기치 않은 오류:', err);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', data: null },
      { status: 500 }
    );
  }
}
