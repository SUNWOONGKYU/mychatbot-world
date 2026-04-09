/**
 * @task S5BA3
 * @description Wiki Accumulate API — 좋은 답변을 위키에 재저장 (복리 축적)
 *
 * POST /api/wiki/accumulate
 * - 답변 품질 평가 (quality_score 미제공 시 LLM 자동 판단)
 * - 품질 기준 통과(>0.7) 시 FAQ 위키 페이지 생성/업데이트
 * - view_count 증가, 임베딩 재생성
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ============================
// 상수
// ============================

const QUALITY_THRESHOLD = 0.7;
const EMBEDDING_MODEL = 'text-embedding-3-small';

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

interface AccumulateRequest {
  bot_id: string;
  question: string;
  answer: string;
  conversation_id: string;
  quality_score?: number;
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
// LLM 품질 평가
// ============================

async function evaluateQuality(question: string, answer: string): Promise<number> {
  const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENROUTER_API_KEY
    ? 'https://openrouter.ai/api/v1'
    : 'https://api.openai.com/v1';
  const model = process.env.OPENROUTER_API_KEY ? 'openai/gpt-4o-mini' : 'gpt-4o-mini';

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: `다음 질문과 답변 쌍의 품질을 0.0~1.0 사이 숫자로만 평가하세요. 숫자 하나만 반환하세요.

질문: ${question}
답변: ${answer.slice(0, 1000)}

평가 기준:
- 답변이 질문에 직접 답하는가?
- 정보가 구체적이고 유용한가?
- FAQ로 재사용 가치가 있는가?`,
          },
        ],
        temperature: 0,
        max_tokens: 10,
      }),
    });

    if (!res.ok) return 0.5;
    const json = await res.json();
    const score = parseFloat(json.choices[0].message.content.trim());
    return isNaN(score) ? 0.5 : Math.min(Math.max(score, 0), 1);
  } catch {
    return 0.5;
  }
}

// ============================
// 슬러그 생성
// ============================

function makeSlug(question: string): string {
  return `faq-${question
    .slice(0, 30)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')}-${Date.now().toString(36)}`;
}

// ============================
// POST /api/wiki/accumulate
// ============================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();

  let body: AccumulateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: '잘못된 요청 형식입니다.', data: null }, { status: 400 });
  }

  if (!body.bot_id || !body.question || !body.answer || !body.conversation_id) {
    return NextResponse.json(
      { success: false, error: 'bot_id, question, answer, conversation_id가 필요합니다.', data: null },
      { status: 400 }
    );
  }

  try {
    // 품질 평가
    const qualityScore =
      body.quality_score !== undefined ? body.quality_score : await evaluateQuality(body.question, body.answer);

    if (qualityScore < QUALITY_THRESHOLD) {
      return NextResponse.json({
        success: true,
        error: null,
        data: {
          accumulated: false,
          quality_score: qualityScore,
          reason: `품질 점수 ${qualityScore.toFixed(2)}이 기준(${QUALITY_THRESHOLD}) 미달`,
        },
      });
    }

    // FAQ 위키 페이지 콘텐츠 생성
    const faqContent = `## 질문\n\n${body.question}\n\n## 답변\n\n${body.answer}\n\n---\n*자동 축적 FAQ — conversation: ${body.conversation_id}*`;
    const slug = makeSlug(body.question);

    // 임베딩 생성
    let embedding: number[] | null = null;
    try {
      embedding = await createEmbedding(`${body.question}\n\n${body.answer}`);
    } catch (embErr) {
      console.warn('[wiki/accumulate] 임베딩 생성 실패:', embErr);
    }

    // 기존 유사 FAQ 확인 (슬러그 충돌 방지)
    const { data: existing } = await supabase
      .from('wiki_pages')
      .select('id, view_count, slug')
      .eq('bot_id', body.bot_id)
      .eq('page_type', 'faq')
      .ilike('title', `%${body.question.slice(0, 20)}%`)
      .limit(1)
      .single();

    if (existing) {
      // 기존 FAQ 업데이트 (view_count 증가)
      await supabase
        .from('wiki_pages')
        .update({
          content: faqContent,
          quality_score: qualityScore,
          view_count: (existing.view_count ?? 0) + 1,
          embedding,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      return NextResponse.json({
        success: true,
        error: null,
        data: {
          accumulated: true,
          action: 'updated',
          wiki_slug: existing.slug,
          quality_score: qualityScore,
        },
      });
    } else {
      // 신규 FAQ 위키 생성
      const { error: insertError } = await supabase.from('wiki_pages').insert({
        bot_id: body.bot_id,
        slug,
        title: body.question.slice(0, 100),
        content: faqContent,
        page_type: 'faq',
        source_kb_ids: [],
        auto_generated: true,
        quality_score: qualityScore,
        view_count: 1,
        embedding,
      });

      if (insertError) throw new Error(`FAQ 위키 저장 실패: ${insertError.message}`);

      return NextResponse.json({
        success: true,
        error: null,
        data: {
          accumulated: true,
          action: 'created',
          wiki_slug: slug,
          quality_score: qualityScore,
        },
      });
    }
  } catch (err) {
    console.error('[wiki/accumulate] 오류:', err);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.', data: null }, { status: 500 });
  }
}
