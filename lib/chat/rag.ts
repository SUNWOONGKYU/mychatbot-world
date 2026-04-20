/**
 * @task S5BA3
 * @description Wiki-First RAG 모듈 — chat/route.ts에서 분리
 */

import { createClient } from '@supabase/supabase-js';

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration error: missing Supabase credentials');
  return createClient(url, key) as any;
}

/**
 * OpenRouter embeddings API를 통해 텍스트를 벡터로 변환
 */
export async function generateQueryEmbedding(text: string): Promise<number[] | null> {
  const apiKey = (process.env.OPENROUTER_API_KEY ?? '').split(',')[0].trim();
  if (!apiKey) return null;

  try {
    const resp = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: text.slice(0, 8000),
      }),
    });

    if (!resp.ok) return null;
    const data = (await resp.json()) as { data?: Array<{ embedding: number[] }> };
    return data.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

/**
 * Wiki-First 검색: match_wiki_pages RPC로 위키 우선 검색
 */
export async function searchWiki(
  botId: string,
  queryEmbedding: number[]
): Promise<{ content: string; titles: string[] } | null> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.rpc('match_wiki_pages', {
      p_bot_id: botId,
      query_embedding: queryEmbedding,
      match_threshold: 0.75,
      match_count: 3,
    });

    if (error || !data || data.length === 0) return null;

    const titles: string[] = data.map((r: any) => r.title as string);
    const content = data
      .map((r: any) => `[위키: ${r.title}]\n${r.content}`)
      .join('\n\n');

    const ids: string[] = data.map((r: any) => r.id as string);
    void supabase
      .from('wiki_pages')
      .update({ view_count: supabase.rpc('view_count + 1') })
      .in('id', ids)
      .then(() => {});

    return { content, titles };
  } catch {
    return null;
  }
}

/**
 * FAQ 검색 (3단계 캐스케이드): match_faqs RPC로 의미 유사도 검색
 * @returns content는 LLM 컨텍스트용 포맷 문자열, items는 매칭된 Q/A 원본
 */
export async function searchFaqs(
  botId: string,
  queryEmbedding: number[]
): Promise<{ content: string; items: Array<{ question: string; answer: string }> } | null> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.rpc('match_faqs', {
      p_bot_id: botId,
      query_embedding: queryEmbedding,
      match_threshold: 0.78,
      match_count: 2,
    });

    if (error || !data || data.length === 0) return null;

    const items = (data as Array<{ question: string; answer: string }>).map((r) => ({
      question: r.question,
      answer: r.answer,
    }));
    const content = items
      .map((it, i) => `[FAQ ${i + 1}]\nQ: ${it.question}\nA: ${it.answer}`)
      .join('\n\n');

    return { content, items };
  } catch {
    return null;
  }
}

/**
 * 답변 후 위키 accumulate 비동기 호출 (복리 축적)
 */
export function triggerWikiAccumulate(
  botId: string,
  question: string,
  answer: string,
  appUrl: string
): void {
  fetch(`${appUrl}/api/wiki/accumulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bot_id: botId, question, answer }),
  }).catch((e: Error) => {
    console.warn('[chat/rag] wiki accumulate failed:', e.message);
  });
}
