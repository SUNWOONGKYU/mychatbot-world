/**
 * @task S2BA3 - Home API (KB 임베딩, 설정 저장, 클라우드 동기화)
 * @description Knowledge Base 임베딩 API
 *
 * Endpoints:
 * - POST /api/kb/embed  KB 항목 임베딩 (OpenAI text-embedding-3-small → pgvector)
 *
 * 임베딩 전략:
 * - 청크 크기: 1000 토큰, 오버랩: 200 토큰
 * - 모델: text-embedding-3-small (1536차원)
 * - 배치 처리: 청크 5개씩 OpenAI 배치 요청
 * - 기존 임베딩 교체 (재임베딩 지원)
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { splitIntoChunks } from '@/lib/text-extractor';

// ============================
// 상수
// ============================

/** OpenAI 임베딩 모델 */
const EMBEDDING_MODEL = 'text-embedding-3-small';

/** OpenAI 임베딩 벡터 차원 */
const EMBEDDING_DIMENSION = 1536;

/** 배치당 청크 수 (OpenAI rate limit 고려) */
const BATCH_SIZE = 5;

/** 청크 최대 토큰 수 */
const CHUNK_MAX_TOKENS = 1000;

/** 청크 오버랩 토큰 수 */
const CHUNK_OVERLAP_TOKENS = 200;

// ============================
// 타입 정의
// ============================

/** 임베딩 요청 바디 */
interface EmbedRequest {
  /** KB 항목 ID */
  kb_item_id: string;
  /** 강제 재임베딩 여부 (기본: false) */
  force?: boolean;
}

/** OpenAI 임베딩 API 응답 */
interface OpenAIEmbeddingResponse {
  object: 'list';
  data: Array<{
    object: 'embedding';
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// ============================
// POST /api/kb/embed
// ============================

/**
 * KB 항목 임베딩 처리
 *
 * 처리 흐름:
 * 1. KB 항목 조회 및 소유권 확인
 * 2. 이미 임베딩된 경우 force 옵션 없으면 스킵
 * 3. 기존 임베딩 삭제 (재임베딩 시)
 * 4. 텍스트 청크 분할 (1000토큰, 200 오버랩)
 * 5. OpenAI API 배치 임베딩 요청
 * 6. pgvector 저장
 * 7. KB 항목 임베딩 상태 업데이트
 *
 * @param request - Next.js Request (JSON 바디: EmbedRequest)
 * @returns 임베딩 결과 (청크 수, 총 토큰)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }

  // OpenAI API 키 확인
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.error('[KB EMBED] OPENAI_API_KEY 환경 변수 미설정');
    return NextResponse.json(
      { success: false, error: '임베딩 서비스가 설정되지 않았습니다.', data: null },
      { status: 503 }
    );
  }

  // 요청 바디 파싱
  let body: EmbedRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다.', data: null },
      { status: 400 }
    );
  }

  if (!body.kb_item_id) {
    return NextResponse.json(
      { success: false, error: 'kb_item_id 필드가 필요합니다.', data: null },
      { status: 400 }
    );
  }

  try {
    // KB 항목 조회 + 소유권 확인
    const { data: kbItem, error: findError } = await supabase
      .from('mcw_kb_items')
      .select('id, bot_id, content, title, is_embedded, mcw_bots!inner(owner_id)')
      .eq('id', body.kb_item_id)
      .single();

    if (findError || !kbItem) {
      return NextResponse.json(
        { success: false, error: 'KB 항목을 찾을 수 없습니다.', data: null },
        { status: 404 }
      );
    }

    // 소유권 검증
    const chatbot = kbItem.mcw_bots as unknown as { owner_id: string };
    if (chatbot.owner_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다.', data: null },
        { status: 403 }
      );
    }

    // 이미 임베딩된 경우 force 없으면 스킵
    if (kbItem.is_embedded && !body.force) {
      return NextResponse.json({
        success: true,
        error: null,
        data: {
          kb_item_id: body.kb_item_id,
          skipped: true,
          message: '이미 임베딩된 항목입니다. force: true로 재임베딩 가능합니다.',
        },
      });
    }

    // 기존 임베딩 삭제 (재임베딩)
    if (kbItem.is_embedded) {
      const { error: deleteError } = await supabase
        .from('kb_embeddings')
        .delete()
        .eq('kb_item_id', body.kb_item_id);

      if (deleteError) {
        console.error('[KB EMBED] 기존 임베딩 삭제 실패:', deleteError.message);
        return NextResponse.json(
          { success: false, error: '기존 임베딩 삭제에 실패했습니다.', data: null },
          { status: 500 }
        );
      }
    }

    // 텍스트 청크 분할
    const chunks = splitIntoChunks(kbItem.content, {
      maxTokens: CHUNK_MAX_TOKENS,
      overlapTokens: CHUNK_OVERLAP_TOKENS,
    });

    if (chunks.length === 0) {
      return NextResponse.json(
        { success: false, error: '임베딩할 텍스트 내용이 없습니다.', data: null },
        { status: 400 }
      );
    }

    // OpenAI 임베딩 배치 처리
    const embeddings: number[][] = [];
    let totalTokensUsed = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      const batchTexts = batchChunks.map((c: any) => c.text);

      const openaiResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          input: batchTexts,
          model: EMBEDDING_MODEL,
          dimensions: EMBEDDING_DIMENSION,
        }),
      });

      if (!openaiResponse.ok) {
        const errText = await openaiResponse.text();
        console.error('[KB EMBED] OpenAI API 오류:', errText);
        return NextResponse.json(
          {
            success: false,
            error: `임베딩 API 오류: ${openaiResponse.status} ${openaiResponse.statusText}`,
            data: null,
          },
          { status: 502 }
        );
      }

      const openaiData: OpenAIEmbeddingResponse = await openaiResponse.json();
      totalTokensUsed += openaiData.usage.total_tokens;

      // 임베딩 순서 보장 (index 기준 정렬)
      const sortedEmbeddings = openaiData.data
        .sort((a: any, b: any) => a.index - b.index)
        .map((item: any) => item.embedding);

      embeddings.push(...sortedEmbeddings);
    }

    // pgvector 저장 (kb_embeddings 테이블)
    const embeddingRows = chunks.map((chunk: any, idx: any) => ({
      kb_item_id: body.kb_item_id,
      chunk_index: chunk.index,
      chunk_text: chunk.text,
      token_count: chunk.tokenCount,
      char_start: chunk.charStart,
      char_end: chunk.charEnd,
      embedding: JSON.stringify(embeddings[idx]), // pgvector는 JSON 배열 형식 수용
    }));

    const { error: insertError } = await supabase
      .from('kb_embeddings')
      .insert(embeddingRows);

    if (insertError) {
      console.error('[KB EMBED] 임베딩 저장 실패:', insertError.message);
      return NextResponse.json(
        { success: false, error: '임베딩 저장에 실패했습니다.', data: null },
        { status: 500 }
      );
    }

    // KB 항목 임베딩 상태 업데이트
    const { error: updateError } = await supabase
      .from('mcw_kb_items')
      .update({
        is_embedded: true,
        chunk_count: chunks.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.kb_item_id);

    if (updateError) {
      console.error('[KB EMBED] 상태 업데이트 실패:', updateError.message);
      // 임베딩은 저장됐으므로 경고만 처리
    }

    // Wiki Ingest 자동 트리거 (S5BI2): 임베딩 성공 후 비동기 호출
    // 실패해도 임베딩 결과에 영향 없음
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    fetch(`${appUrl}/api/wiki/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bot_id: kbItem.bot_id,
        kb_item_id: body.kb_item_id,
      }),
    }).catch((e: Error) => {
      console.warn('[KB EMBED] Wiki ingest trigger failed:', e.message);
    });

    return NextResponse.json({
      success: true,
      error: null,
      data: {
        kb_item_id: body.kb_item_id,
        chunk_count: chunks.length,
        total_tokens_used: totalTokensUsed,
        model: EMBEDDING_MODEL,
        dimension: EMBEDDING_DIMENSION,
        wiki_ingest_triggered: true,
      },
    });
  } catch (err) {
    console.error('[KB EMBED] 예기치 않은 오류:', err);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', data: null },
      { status: 500 }
    );
  }
}
