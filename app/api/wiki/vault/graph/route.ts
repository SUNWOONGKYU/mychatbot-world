/**
 * @task S5EX1
 * @description Wiki Graph API — D3.js 그래프용 노드+링크 데이터
 *
 * GET /api/wiki/vault/graph?bot_id={bot_id}
 *
 * 처리:
 *  - wiki_pages에서 노드 목록 조회
 *  - content 내 [[slug]] 패턴을 파싱하여 링크 생성
 *  - 링크가 없는 경우 type별 허브 노드 간 가상 링크 생성
 *
 * 응답: { nodes: [...], links: [...] }
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ============================
// Supabase 클라이언트
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

interface WikiPageRow {
  id: string;
  slug: string;
  title: string;
  page_type: string;
  quality_score: number;
  view_count: number;
  content: string;
}

// ============================
// Wikilink 파서 [[slug]] → links
// ============================

/**
 * 마크다운 content에서 [[slug]] 패턴 추출
 * Obsidian 스타일 wikilink
 */
function extractWikilinks(content: string): string[] {
  const matches = content.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g);
  return [...matches].map((m) => m[1].trim().toLowerCase().replace(/\s+/g, '-'));
}

// ============================
// Route Handler
// ============================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const bot_id = searchParams.get('bot_id');

    if (!bot_id) {
      return NextResponse.json(
        { success: false, error: 'bot_id is required', data: null },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: pages, error } = await supabase
      .from('wiki_pages')
      .select('id, slug, title, page_type, quality_score, view_count, content')
      .eq('bot_id', bot_id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, data: null },
        { status: 500 }
      );
    }

    if (!pages || pages.length === 0) {
      return NextResponse.json({
        success: true,
        error: null,
        data: { nodes: [], links: [] },
      });
    }

    // slug → id 맵
    const slugToId = new Map<string, string>(
      (pages as WikiPageRow[]).map((p) => [p.slug, p.id])
    );

    // 노드 목록 (content 제외)
    const nodes = (pages as WikiPageRow[]).map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      page_type: p.page_type,
      quality_score: p.quality_score ?? 0,
      view_count: p.view_count ?? 0,
    }));

    // 링크: [[slug]] 파싱
    const links: Array<{ source: string; target: string }> = [];
    const seenLinks = new Set<string>();

    for (const page of pages as WikiPageRow[]) {
      const referenced = extractWikilinks(page.content ?? '');
      for (const refSlug of referenced) {
        const targetId = slugToId.get(refSlug);
        if (targetId && targetId !== page.id) {
          const key = `${page.id}:${targetId}`;
          if (!seenLinks.has(key)) {
            seenLinks.add(key);
            links.push({ source: page.id, target: targetId });
          }
        }
      }
    }

    // wikilink가 없으면 같은 page_type 내에서 가상 링크 생성 (그래프 시각화용)
    if (links.length === 0 && nodes.length > 1) {
      const grouped = new Map<string, string[]>();
      for (const n of nodes) {
        const arr = grouped.get(n.page_type) ?? [];
        arr.push(n.id);
        grouped.set(n.page_type, arr);
      }

      for (const [, ids] of grouped) {
        for (let i = 0; i < ids.length - 1; i++) {
          links.push({ source: ids[i], target: ids[i + 1] });
        }
      }
    }

    return NextResponse.json({
      success: true,
      error: null,
      data: { nodes, links },
    });
  } catch (err) {
    console.error('[wiki/vault/graph] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error', data: null },
      { status: 500 }
    );
  }
}
