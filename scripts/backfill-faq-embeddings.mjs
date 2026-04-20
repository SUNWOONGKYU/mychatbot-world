/**
 * FAQ 임베딩 백필 스크립트 (S5BA8)
 *
 * 목적: 기존 faqs 레코드 중 embedding이 NULL인 항목에 대해
 *      question + answer를 OpenAI text-embedding-3-small로 벡터화하여 채움
 *
 * 사용:
 *   node scripts/backfill-faq-embeddings.mjs
 *
 * 환경 변수 필요:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - OPENROUTER_API_KEY (콤마 구분 시 첫 번째 키 사용)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENROUTER_KEY = (process.env.OPENROUTER_API_KEY ?? '').split(',')[0].trim();

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENROUTER_KEY) {
  console.error('[backfill] 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / OPENROUTER_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function generateEmbedding(text) {
  const resp = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text.slice(0, 8000),
    }),
  });
  if (!resp.ok) {
    throw new Error(`Embedding API ${resp.status}: ${await resp.text()}`);
  }
  const data = await resp.json();
  return data.data?.[0]?.embedding ?? null;
}

async function main() {
  console.log('[backfill] embedding이 없는 FAQ 조회...');
  const { data: rows, error } = await supabase
    .from('faqs')
    .select('id, question, answer')
    .is('embedding', null);

  if (error) {
    console.error('[backfill] 조회 실패:', error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('[backfill] 백필 대상 없음 — 모든 FAQ에 embedding 존재.');
    return;
  }

  console.log(`[backfill] 대상 ${rows.length}건 처리 시작...`);
  let success = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const input = `${row.question}\n${row.answer}`;
      const embedding = await generateEmbedding(input);
      if (!embedding) {
        console.warn(`  [SKIP] ${row.id}: embedding 응답 비어있음`);
        failed++;
        continue;
      }
      const { error: updateErr } = await supabase
        .from('faqs')
        .update({ embedding })
        .eq('id', row.id);
      if (updateErr) {
        console.warn(`  [FAIL] ${row.id}: ${updateErr.message}`);
        failed++;
      } else {
        success++;
        if (success % 10 === 0) console.log(`  ${success}/${rows.length} 완료...`);
      }
      // OpenRouter rate limit 회피용 짧은 대기
      await new Promise((r) => setTimeout(r, 100));
    } catch (e) {
      console.warn(`  [ERROR] ${row.id}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n[backfill] 완료 — 성공 ${success}건 / 실패 ${failed}건`);
}

main().catch((e) => {
  console.error('[backfill] 치명적 오류:', e);
  process.exit(1);
});
