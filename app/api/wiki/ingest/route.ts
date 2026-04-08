/**
 * @task S5BA1
 * @description Wiki Ingest API — KB 문서를 분석해서 위키 페이지 자동 생성
 *
 * POST /api/wiki/ingest
 * - botId 기반으로 mcw_kb_items에서 텍스트 로드
 * - LLM으로 위키 페이지 생성 (concept/faq/summary/entity/comparison)
 * - wiki_pages에 upsert + embedding 생성 (S5BI2 통합)
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ============================
// 상수
// ============================

const EMBEDDING_MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 5;

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

interface IngestRequest {
  bot_id: string;
  kb_item_ids?: string[];
  force?: boolean;
}

interface WikiPageDraft {
  slug: string;
  title: string;
  content: string;
  page_type: 'concept' | 'faq' | 'summary' | 'entity' | 'comparison';
  source_kb_ids: string[];
}

// ============================
// 임베딩 생성
// ============================

async function createEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.OPENAI_API_KEY
    ? 'https://api.openai.com/v1'
    : 'https://openrouter.ai/api/v1';

  const res = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text.slice(0, 8000) }),
  });

  if (!res.ok) throw new Error(`임베딩 생성 실패: ${res.status}`);
  const json = await res.json();
  return json.data[0].embedding as number[];
}

// ============================
// LLM 위키 생성
// ============================

async function generateWikiPages(
  kbContent: string,
  kbTitle: string,
  kbId: string
): Promise<WikiPageDraft[]> {
  const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENROUTER_API_KEY
    ? 'https://openrouter.ai/api/v1'
    : 'https://api.openai.com/v1';
  const model = process.env.OPENROUTER_API_KEY
    ? 'openai/gpt-4o-mini'
    : 'gpt-4o-mini';

  const prompt = `다음 문서를 분석해서 Wiki-e-RAG 위키 페이지를 생성하세요.

문서 제목: ${kbTitle}
문서 내용:
${kbContent.slice(0, 6000)}

다음 JSON 배열 형식으로 위키 페이지를 3~7개 생성하세요. 각 페이지는 독립적으로 유용해야 합니다.

반환 형식 (JSON 배열만, 마크다운 코드블록 없이):
[
  {
    "slug": "kebab-case-slug",
    "title": "페이지 제목",
    "content": "마크다운 본문 (500~1500자)",
    "page_type": "concept|faq|summary|entity|comparison"
  }
]

page_type 가이드:
- concept: 핵심 개념 설명
- faq: 자주 묻는 질문 형식
- summary: 문서 전체 요약
- entity: 인물/장소/상품/서비스 엔티티
- comparison: 비교 분석`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) throw new Error(`LLM 호출 실패: ${res.status}`);
  const json = await res.json();
  const text = json.choices[0].message.content as string;

  try {
    // JSON 파싱
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const pages = JSON.parse(cleaned) as Array<{
      slug: string;
      title: string;
      content: string;
      page_type: string;
    }>;

    return pages.map((p) => ({
      slug: p.slug.toLowerCase().replace(/[^a-z0-9가-힣-]/g, '-').replace(/-+/g, '-'),
      title: p.title,
      content: p.content,
      page_type: (['concept', 'faq', 'summary', 'entity', 'comparison'].includes(p.page_type)
        ? p.page_type
        : 'concept') as WikiPageDraft['page_type'],
      source_kb_ids: [kbId],
    }));
  } catch {
    console.warn('[wiki/ingest] LLM 응답 파싱 실패, 기본 요약 페이지 생성');
    return [
      {
        slug: `summary-${kbId.slice(0, 8)}`,
        title: `${kbTitle} 요약`,
        content: kbContent.slice(0, 1500),
        page_type: 'summary',
        source_kb_ids: [kbId],
      },
    ];
  }
}

// ============================
// POST /api/wiki/ingest
// ============================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();

  // 인증 확인
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }

  let body: IngestRequest;
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
      .eq('owner_id', session.user.id)
      .single();

    if (botError || !bot) {
      return NextResponse.json({ success: false, error: '봇을 찾을 수 없거나 접근 권한이 없습니다.', data: null }, { status: 403 });
    }

    // KB 아이템 조회
    let kbQuery = supabase
      .from('mcw_kb_items')
      .select('id, title, content')
      .eq('chatbot_id', body.bot_id);

    if (body.kb_item_ids && body.kb_item_ids.length > 0) {
      kbQuery = kbQuery.in('id', body.kb_item_ids);
    }

    const { data: kbItems, error: kbError } = await kbQuery;
    if (kbError) throw new Error(`KB 조회 실패: ${kbError.message}`);
    if (!kbItems || kbItems.length === 0) {
      return NextResponse.json({ success: false, error: 'KB 항목이 없습니다.', data: null }, { status: 404 });
    }

    let pagesCreated = 0;
    let pagesUpdated = 0;
    let tokensUsed = 0;

    // KB 아이템별 위키 생성
    for (const kb of kbItems) {
      if (!kb.content) continue;

      const drafts = await generateWikiPages(kb.content, kb.title, kb.id);
      tokensUsed += kb.content.length / 4; // 토큰 추정

      // 배치 임베딩 + upsert
      for (let i = 0; i < drafts.length; i += BATCH_SIZE) {
        const batch = drafts.slice(i, i + BATCH_SIZE);

        for (const draft of batch) {
          // 기존 위키 페이지 확인 (force 옵션 처리)
          if (!body.force) {
            const { data: existing } = await supabase
              .from('wiki_pages')
              .select('id')
              .eq('bot_id', body.bot_id)
              .eq('slug', draft.slug)
              .single();

            if (existing) {
              pagesUpdated++;
              continue;
            }
          }

          // 임베딩 생성
          let embedding: number[] | null = null;
          try {
            embedding = await createEmbedding(`${draft.title}\n\n${draft.content}`);
          } catch (embErr) {
            console.warn('[wiki/ingest] 임베딩 생성 실패:', embErr);
          }

          // wiki_pages upsert
          const { error: upsertError } = await supabase
            .from('wiki_pages')
            .upsert({
              bot_id: body.bot_id,
              slug: draft.slug,
              title: draft.title,
              content: draft.content,
              page_type: draft.page_type,
              source_kb_ids: draft.source_kb_ids,
              auto_generated: true,
              embedding,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'bot_id,slug' });

          if (upsertError) {
            console.error('[wiki/ingest] upsert 실패:', upsertError.message);
          } else {
            pagesCreated++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      error: null,
      data: {
        pages_created: pagesCreated,
        pages_updated: pagesUpdated,
        pages_touched: pagesCreated + pagesUpdated,
        tokens_used: Math.round(tokensUsed),
        kb_items_processed: kbItems.length,
      },
    });
  } catch (err) {
    console.error('[wiki/ingest] 오류:', err);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.', data: null }, { status: 500 });
  }
}
