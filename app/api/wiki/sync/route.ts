/**
 * @task S5EX1
 * @description Obsidian Vault Sync API — Obsidian 볼트의 마크다운 → wiki_pages 동기화
 *
 * POST /api/wiki/sync
 * Body: {
 *   bot_id: string,
 *   files: Array<{ filename: string, content: string }>
 * }
 *
 * 처리:
 *  - 파일별로 YAML frontmatter 파싱 → slug 추출
 *  - wiki_pages에 upsert (slug + bot_id 기준)
 *  - 임베딩은 /api/wiki/ingest를 재활용하지 않고 직접 처리 (내용 기반)
 *
 * 응답: { synced: number, created: number, updated: number }
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
// YAML frontmatter 파서 (경량)
// ============================

interface ParsedFrontmatter {
  id?: string;
  slug?: string;
  title?: string;
  page_type?: string;
  [key: string]: unknown;
}

/**
 * 간단한 YAML frontmatter 파서
 * --- ... --- 블록에서 key: value 추출
 */
function parseFrontmatter(content: string): {
  meta: ParsedFrontmatter;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const [, yamlBlock, body] = match;
  const meta: ParsedFrontmatter = {};

  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim().replace(/^"(.*)"$/, '$1');
    if (key) meta[key] = val;
  }

  return { meta, body: body.trim() };
}

// ============================
// Route Handler
// ============================

interface SyncRequestBody {
  bot_id: string;
  files: Array<{ filename: string; content: string }>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Partial<SyncRequestBody>;
    const { bot_id, files } = body;

    if (!bot_id) {
      return NextResponse.json(
        { success: false, error: 'bot_id is required', data: null },
        { status: 400 }
      );
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'files array is required', data: null },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const file of files) {
      try {
        const { meta, body: mdBody } = parseFrontmatter(file.content);

        // slug: frontmatter에서 추출 또는 파일명에서 추출
        const slug =
          (meta.slug as string) ||
          file.filename.replace(/\.md$/, '').replace(/\s+/g, '-').toLowerCase();

        // 제목: frontmatter > 첫 번째 H1 > 파일명
        const h1Match = mdBody.match(/^#\s+(.+)$/m);
        const title =
          (meta.title as string) ||
          h1Match?.[1] ||
          file.filename.replace(/\.md$/, '');

        // 본문: H1 제거 후 나머지
        const content = mdBody.replace(/^#\s+.+\n*/m, '').trim();

        // page_type 유효성
        const pageType = ['manual', 'auto_generated', 'faq'].includes(
          meta.page_type as string
        )
          ? (meta.page_type as string)
          : 'manual';

        // wiki_pages upsert (slug + bot_id 기준)
        const { data: existing } = await supabase
          .from('wiki_pages')
          .select('id')
          .eq('bot_id', bot_id)
          .eq('slug', slug)
          .maybeSingle();

        if (existing) {
          // 업데이트
          const { error: updateErr } = await supabase
            .from('wiki_pages')
            .update({
              title,
              content,
              page_type: pageType,
              is_stale: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateErr) throw new Error(updateErr.message);
          updated++;
        } else {
          // 신규 생성
          const { error: insertErr } = await supabase
            .from('wiki_pages')
            .insert({
              bot_id,
              slug,
              title,
              content,
              page_type: pageType,
              auto_generated: false,
              quality_score: 0,
              view_count: 0,
              is_stale: false,
            });

          if (insertErr) throw new Error(insertErr.message);
          created++;
        }
      } catch (e) {
        errors.push(`${file.filename}: ${(e as Error).message}`);
      }
    }

    return NextResponse.json({
      success: true,
      error: errors.length > 0 ? errors.join('; ') : null,
      data: {
        synced: created + updated,
        created,
        updated,
        total_files: files.length,
        errors,
      },
    });
  } catch (err) {
    console.error('[wiki/sync] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error', data: null },
      { status: 500 }
    );
  }
}
