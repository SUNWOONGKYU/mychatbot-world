/**
 * @task S5BA2
 * @description Wiki-First Query API — 위키 우선 검색 + 청크 폴백
 *
 * POST /api/wiki/query
 * - match_wiki_pages RPC로 위키 검색 (threshold=0.75)
 * - 위키 히트 없으면 kb_embeddings 청크 폴백
 * - source: 'wiki' | 'chunk' | 'both' 반환
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ============================
// 상수
// ============================

const EMBEDDING_MODEL = 'text-embedding-3-small';
const WIKI_THRESHOLD = 0.75;
const CHUNK_THRESHOLD = 0.7;
const DEFAULT_LIMIT = 3;

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

interface QueryRequest {
  bot_id: string;
  query: string;
  limit?: number;
  wiki_threshold?: number;
  chunk_threshold?: number;
}

interface WikiResult {
  id: string;
  slug: string;
  title: string;
  content: string;
  page_type: string;
  similarity: number;
}

interface ChunkResult {
  id: string;
  chunk_text: string;
  similarity: number;
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
// POST /api/wiki/query
// ============================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();

  let body: QueryRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: '잘못된 요청 형식입니다.', data: null }, { status: 400 });
  }

  if (!body.bot_id || !body.query) {
    return NextResponse.json({ success: false, error: 'bot_id, query가 필요합니다.', data: null }, { status: 400 });
  }

  const limit = body.limit ?? DEFAULT_LIMIT;
  const wikiThreshold = body.wiki_threshold ?? WIKI_THRESHOLD;
  const chunkThreshold = body.chunk_threshold ?? CHUNK_THRESHOLD;

  try {
    // 쿼리 임베딩 생성
    const queryEmbedding = await createEmbedding(body.query);

    // 1차: Wiki-First 검색
    const { data: wikiData, error: wikiError } = await supabase.rpc('match_wiki_pages', {
      p_bot_id: body.bot_id,
      query_embedding: queryEmbedding,
      match_threshold: wikiThreshold,
      match_count: limit,
    });

    const wikiResults: WikiResult[] = wikiError ? [] : (wikiData as WikiResult[]) ?? [];

    let chunkResults: ChunkResult[] = [];
    let source: 'wiki' | 'chunk' | 'both' = 'wiki';

    if (wikiResults.length === 0) {
      // 2차: 청크 폴백
      source = 'chunk';
      const { data: chunkData, error: chunkError } = await supabase.rpc('match_kb_documents', {
        p_bot_id: body.bot_id,
        query_embedding: queryEmbedding,
        match_threshold: chunkThreshold,
        match_count: limit,
      });

      if (!chunkError && chunkData) {
        chunkResults = (chunkData as Array<{ id: string; content: string; similarity: number }>).map((c) => ({
          id: c.id,
          chunk_text: c.content,
          similarity: c.similarity,
        }));
      }
    } else if (wikiResults.length < limit) {
      // 위키 결과 부족 시 청크 보완
      source = 'both';
      const remaining = limit - wikiResults.length;
      const { data: chunkData } = await supabase.rpc('match_kb_documents', {
        p_bot_id: body.bot_id,
        query_embedding: queryEmbedding,
        match_threshold: chunkThreshold,
        match_count: remaining,
      });

      if (chunkData) {
        chunkResults = (chunkData as Array<{ id: string; content: string; similarity: number }>).map((c) => ({
          id: c.id,
          chunk_text: c.content,
          similarity: c.similarity,
        }));
      }
    }

    // 위키 view_count 업데이트 (비동기, 실패해도 무관)
    if (wikiResults.length > 0) {
      const wikiIds = wikiResults.map((w) => w.id);
      supabase
        .from('wiki_pages')
        .select('id, view_count')
        .in('id', wikiIds)
        .then(({ data }) => {
          if (data) {
            for (const page of data) {
              supabase
                .from('wiki_pages')
                .update({ view_count: (page.view_count ?? 0) + 1 })
                .eq('id', page.id)
                .then(() => {});
            }
          }
        });
    }

    return NextResponse.json({
      success: true,
      error: null,
      data: {
        wiki_results: wikiResults,
        chunk_results: chunkResults,
        source,
        total_results: wikiResults.length + chunkResults.length,
      },
    });
  } catch (err) {
    console.error('[wiki/query] 오류:', err);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.', data: null }, { status: 500 });
  }
}
