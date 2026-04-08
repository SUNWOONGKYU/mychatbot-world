/**
 * @task S5EX1
 * @description Obsidian Vault Export API — wiki_pages → Obsidian Markdown 내보내기
 *
 * POST /api/wiki/vault/export
 * Body: { bot_id: string }
 *
 * 처리:
 *  - wiki_pages에서 해당 봇의 모든 페이지 조회
 *  - Obsidian 호환 마크다운으로 변환 (YAML frontmatter + wikilink)
 *  - ZIP 형태로 반환 (각 page를 {slug}.md 파일로)
 *
 * 응답: application/zip (바이너리) 또는 JSON (파일 목록)
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
// Obsidian 마크다운 변환
// ============================

/**
 * wiki_page → Obsidian Markdown 변환
 * YAML frontmatter에 메타데이터 포함
 */
function toObsidianMarkdown(page: {
  id: string;
  slug: string;
  title: string;
  content: string;
  page_type: string;
  quality_score: number;
  view_count: number;
  source_kb_ids: string[] | null;
  created_at: string;
  updated_at: string;
}): string {
  const frontmatter = [
    '---',
    `id: "${page.id}"`,
    `slug: "${page.slug}"`,
    `title: "${page.title.replace(/"/g, '\\"')}"`,
    `page_type: ${page.page_type}`,
    `quality_score: ${page.quality_score}`,
    `view_count: ${page.view_count}`,
    `source_kb_ids: [${(page.source_kb_ids ?? []).map((id) => `"${id}"`).join(', ')}]`,
    `created_at: "${page.created_at}"`,
    `updated_at: "${page.updated_at}"`,
    '---',
  ].join('\n');

  return `${frontmatter}\n\n# ${page.title}\n\n${page.content}`;
}

// ============================
// Route Handler
// ============================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { bot_id?: string };
    const { bot_id } = body;

    if (!bot_id) {
      return NextResponse.json(
        { success: false, error: 'bot_id is required', data: null },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // wiki_pages 전체 조회
    const { data: pages, error } = await supabase
      .from('wiki_pages')
      .select('id, slug, title, content, page_type, quality_score, view_count, source_kb_ids, created_at, updated_at')
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
        data: { files: [], total: 0 },
      });
    }

    // 각 페이지를 Obsidian 마크다운으로 변환
    const files = pages.map((page) => ({
      filename: `${page.slug}.md`,
      content: toObsidianMarkdown(page as any),
      slug: page.slug,
      title: page.title,
    }));

    // 클라이언트가 직접 ZIP을 만들 수 있도록 파일 목록 반환
    // (서버 사이드 ZIP은 jszip 의존성 필요 — 대신 JSON으로 반환)
    return NextResponse.json({
      success: true,
      error: null,
      data: {
        files: files.map((f) => ({
          filename: f.filename,
          content: f.content,
          slug: f.slug,
          title: f.title,
        })),
        total: files.length,
        vault_name: `mcw-wiki-${bot_id.slice(0, 8)}`,
      },
    });
  } catch (err) {
    console.error('[wiki/vault/export] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error', data: null },
      { status: 500 }
    );
  }
}
