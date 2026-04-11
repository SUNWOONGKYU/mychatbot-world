/**
 * @task S5BA4
 * @description Wiki Lint API — 고아/스테일/모순 자동 탐지 + wiki_lint_logs 기록
 *
 * POST /api/wiki/lint
 * - 고아 페이지: source_kb_ids가 모두 삭제된 페이지
 * - 스테일 페이지: 30일 이상 미업데이트 + view_count=0
 * - 모순 탐지: 동일 봇 내 제목 유사도 높은 페이지 쌍
 * - auto_fix: true 시 스테일 페이지 is_stale=true 마킹
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ============================
// Supabase 서버 클라이언트
// ============================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ============================
// 타입 정의
// ============================

interface LintRequest {
  bot_id: string;
  auto_fix?: boolean;
}

interface ConflictItem {
  page_a: string;
  page_b: string;
  detail: string;
}

// ============================
// 간단한 제목 유사도 (자카드)
// ============================

function titleSimilarity(a: string, b: string): number {
  const tokensA = new Set(a.toLowerCase().split(/\s+/));
  const tokensB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

// ============================
// POST /api/wiki/lint
// ============================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();

  // 인증 확인 (Bearer 토큰)
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: sessionError } = await supabase.auth.getUser(token);
  if (sessionError || !user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }

  let body: LintRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: '잘못된 요청 형식입니다.', data: null }, { status: 400 });
  }

  if (!body.bot_id) {
    return NextResponse.json({ success: false, error: 'bot_id가 필요합니다.', data: null }, { status: 400 });
  }

  try {
    // 봇 소유권 확인
    const { data: bot, error: botError } = await supabase
      .from('mcw_bots')
      .select('id')
      .eq('id', body.bot_id)
      .eq('owner_id', user.id)
      .single();

    if (botError || !bot) {
      return NextResponse.json({ success: false, error: '봇을 찾을 수 없거나 접근 권한이 없습니다.', data: null }, { status: 403 });
    }

    // 전체 위키 페이지 로드
    const { data: pages, error: pagesError } = await supabase
      .from('wiki_pages')
      .select('id, slug, title, source_kb_ids, view_count, updated_at, is_stale, quality_score')
      .eq('bot_id', body.bot_id);

    if (pagesError) throw new Error(`위키 페이지 조회 실패: ${pagesError.message}`);
    if (!pages || pages.length === 0) {
      return NextResponse.json({
        success: true,
        error: null,
        data: {
          orphans: [],
          stale_pages: [],
          conflicts: [],
          quality_report: { total: 0, avg_score: 0, low_quality: [] },
          fixed_count: 0,
        },
      });
    }

    // 현재 KB 아이템 ID 목록
    const { data: kbItems } = await supabase
      .from('mcw_kb_items')
      .select('id')
      .eq('chatbot_id', body.bot_id);

    const existingKbIds = new Set((kbItems ?? []).map((k: { id: string }) => k.id));

    // ────────────────────────────────────────
    // 1. 고아 페이지 탐지 (source_kb_ids 모두 삭제됨)
    // ────────────────────────────────────────
    const orphans: string[] = [];
    for (const page of pages) {
      const refs = (page.source_kb_ids as string[]) ?? [];
      if (refs.length > 0 && refs.every((id: string) => !existingKbIds.has(id))) {
        orphans.push(page.slug as string);
      }
    }

    // ────────────────────────────────────────
    // 2. 스테일 페이지 탐지 (30일 미업데이트 + view=0)
    // ────────────────────────────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const stalePages: string[] = [];
    const staleIds: string[] = [];

    for (const page of pages) {
      if (
        (page.updated_at as string) < thirtyDaysAgo &&
        (page.view_count as number) === 0 &&
        !(page.is_stale as boolean)
      ) {
        stalePages.push(page.slug as string);
        staleIds.push(page.id as string);
      }
    }

    // ────────────────────────────────────────
    // 3. 모순 탐지 (제목 유사도 > 0.6인 페이지 쌍)
    // ────────────────────────────────────────
    const conflicts: ConflictItem[] = [];
    for (let i = 0; i < pages.length; i++) {
      for (let j = i + 1; j < pages.length; j++) {
        const sim = titleSimilarity(pages[i].title as string, pages[j].title as string);
        if (sim > 0.6) {
          conflicts.push({
            page_a: pages[i].slug as string,
            page_b: pages[j].slug as string,
            detail: `제목 유사도 ${(sim * 100).toFixed(0)}% — 중복 또는 모순 가능성`,
          });
        }
      }
    }

    // ────────────────────────────────────────
    // 4. 품질 리포트
    // ────────────────────────────────────────
    const scores = pages.map((p) => (p.quality_score as number) ?? 0);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const lowQuality = pages
      .filter((p) => ((p.quality_score as number) ?? 0) < 0.4)
      .map((p) => p.slug as string);

    // ────────────────────────────────────────
    // 5. auto_fix: 스테일 페이지 마킹
    // ────────────────────────────────────────
    let fixedCount = 0;
    if (body.auto_fix && staleIds.length > 0) {
      const { error: fixError } = await supabase
        .from('wiki_pages')
        .update({ is_stale: true })
        .in('id', staleIds);

      if (!fixError) fixedCount = staleIds.length;
    }

    // ────────────────────────────────────────
    // 6. wiki_lint_logs 기록
    // ────────────────────────────────────────
    await supabase.from('wiki_lint_logs').insert({
      bot_id: body.bot_id,
      orphan_count: orphans.length,
      stale_count: stalePages.length,
      conflict_count: conflicts.length,
      total_pages: pages.length,
      quality_avg: Math.round(avgScore * 100) / 100,
      fixed_count: fixedCount,
      summary: `고아 ${orphans.length}개, 스테일 ${stalePages.length}개, 모순 ${conflicts.length}쌍 탐지`,
    });

    return NextResponse.json({
      success: true,
      error: null,
      data: {
        orphans,
        stale_pages: stalePages,
        conflicts,
        quality_report: {
          total: pages.length,
          avg_score: Math.round(avgScore * 100) / 100,
          low_quality: lowQuality,
        },
        fixed_count: fixedCount,
      },
    });
  } catch (err) {
    console.error('[wiki/lint] 오류:', err);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.', data: null }, { status: 500 });
  }
}
