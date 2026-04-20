/**
 * @task S2BA2
 * @description 페르소나 로더 — botId 기반 페르소나 로딩 + 인메모리 캐싱 + KB RAG 통합
 *
 * 주요 기능:
 * - Supabase `mcw_personas` 테이블에서 botId로 페르소나 조회
 * - 시스템 프롬프트 조합: "You are {name}. {personality}. Tone: {tone}."
 * - 인메모리 Map 캐싱으로 동일 botId 반복 조회 방지
 * - kb_embeddings 벡터 유사도 검색 → 상위 3개 컨텍스트 삽입 (graceful fallback)
 */

import { createClient } from '@supabase/supabase-js';

// ============================
// Supabase 서버사이드 클라이언트 (service_role)
// ============================

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase environment variables are not set. ' +
        'Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(url, key);
}

// ============================
// 타입 정의
// ============================

/**
 * Supabase `mcw_personas` 테이블 행 타입
 */
export interface PersonaRow {
  id: string;
  bot_id: string;
  name: string;
  personality: string;
  tone: string;
  greeting?: string | null;
  role?: string | null;
  category?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * 페르소나 로드 결과
 */
export interface PersonaContext {
  /** 페르소나 원본 데이터 */
  persona: PersonaRow;
  /**
   * 조합된 시스템 프롬프트
   * (페르소나 기본 + KB 컨텍스트 포함)
   */
  systemPrompt: string;
  /**
   * KB 검색에서 매칭된 청크 개수 (0이면 KB 미히트)
   * 챗 캐스케이드(wiki → kb → faq) 분기 판단에 사용
   */
  kbHitCount: number;
}

/**
 * KB 검색 결과 행 타입 (pgvector RPC 반환)
 */
interface KbSearchResult {
  id: string;
  content: string;
  similarity: number;
}

// ============================
// 인메모리 캐시
// ============================

/**
 * botId → PersonaContext 캐시 (Map)
 * 서버 재시작 전까지 유지됨
 * 페르소나가 변경되면 clearPersonaCache()로 무효화
 */
const personaCache = new Map<string, PersonaContext>();

// ============================
// KB 검색 (pgvector)
// ============================

/**
 * KB 임베딩 테이블에서 쿼리와 유사한 문서를 검색
 * - `kb_embeddings` 테이블이 없거나 오류 발생 시 빈 배열 반환 (graceful fallback)
 *
 * @param botId - 봇 ID (특정 봇의 KB만 검색)
 * @param queryEmbedding - 쿼리 벡터 (float8[])
 * @param matchThreshold - 유사도 하한 (기본 0.7)
 * @param matchCount - 반환할 최대 개수 (기본 3)
 * @returns KbSearchResult 배열
 */
async function searchKb(
  botId: string,
  queryEmbedding: number[],
  matchThreshold = 0.7,
  matchCount = 3
): Promise<KbSearchResult[]> {
  try {
    const supabase = getSupabaseServer();

    // pgvector match_documents RPC 호출
    const { data, error } = await supabase.rpc('match_kb_documents', {
      p_bot_id: botId,
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      // KB 테이블/함수 미존재 시 graceful fallback
      console.warn('[persona-loader] KB 검색 건너뜀:', error.message);
      return [];
    }

    return (data as KbSearchResult[]) ?? [];
  } catch (err) {
    console.warn('[persona-loader] KB 검색 예외:', err);
    return [];
  }
}

// ============================
// 시스템 프롬프트 조합
// ============================

/**
 * 페르소나 데이터로 기본 시스템 프롬프트 생성
 *
 * @param persona - PersonaRow
 * @returns 기본 시스템 프롬프트 문자열
 */
function buildBaseSystemPrompt(persona: PersonaRow): string {
  return `You are ${persona.name}. ${persona.personality}. Tone: ${persona.tone}.`;
}

/**
 * KB 검색 결과를 시스템 프롬프트에 컨텍스트로 삽입
 *
 * @param basePrompt - 기본 시스템 프롬프트
 * @param kbResults - KB 검색 결과 배열
 * @returns KB 컨텍스트가 포함된 시스템 프롬프트
 */
function appendKbContext(
  basePrompt: string,
  kbResults: KbSearchResult[]
): string {
  if (kbResults.length === 0) return basePrompt;

  const contextBlock = kbResults
    .map((r, i) => `[Knowledge ${i + 1}]\n${r.content}`)
    .join('\n\n');

  return (
    basePrompt +
    '\n\n' +
    '--- Relevant Knowledge Base ---\n' +
    contextBlock +
    '\n--- End of Knowledge Base ---'
  );
}

// ============================
// 핵심 함수
// ============================

/**
 * botId로 페르소나를 로드하고 시스템 프롬프트를 반환
 * 캐시에 존재하면 DB 조회 없이 반환
 *
 * @param botId - 봇 ID
 * @param queryEmbedding - (선택) 현재 메시지 임베딩 (KB 검색용)
 *                         미제공 시 KB 검색 건너뜀
 * @returns PersonaContext
 * @throws Error - mcw_personas 테이블에 botId 없음 / DB 오류
 *
 * @example
 * ```ts
 * const ctx = await loadPersona('bot-123');
 * // → { persona: {...}, systemPrompt: "You are Alice. ..." }
 * ```
 */
export async function loadPersona(
  botId: string,
  queryEmbedding?: number[]
): Promise<PersonaContext> {
  // 캐시 히트 (KB 검색은 동적이므로 임베딩 없는 기본 조회만 캐시)
  if (!queryEmbedding && personaCache.has(botId)) {
    return personaCache.get(botId)!;
  }

  const supabase = getSupabaseServer();

  // mcw_personas 테이블 조회
  const { data, error } = await supabase
    .from('mcw_personas')
    .select('*')
    .eq('bot_id', botId)
    .single();

  if (error || !data) {
    throw new Error(
      `Persona not found for botId "${botId}": ${error?.message ?? 'No data returned'}`
    );
  }

  const persona = data as PersonaRow;
  let systemPrompt = buildBaseSystemPrompt(persona);
  let kbHitCount = 0;

  // KB 검색 통합 (임베딩 제공 시)
  if (queryEmbedding && queryEmbedding.length > 0) {
    const kbResults = await searchKb(botId, queryEmbedding);
    kbHitCount = kbResults.length;
    systemPrompt = appendKbContext(systemPrompt, kbResults);
  }

  const ctx: PersonaContext = { persona, systemPrompt, kbHitCount };

  // 임베딩 없는 기본 조회만 캐시 저장 (동적 KB 컨텍스트는 캐시 제외)
  if (!queryEmbedding) {
    personaCache.set(botId, ctx);
  }

  return ctx;
}

/**
 * 특정 botId의 페르소나 캐시 무효화
 * 페르소나 수정 후 호출
 *
 * @param botId - 캐시 삭제할 봇 ID
 */
export function clearPersonaCache(botId: string): void {
  personaCache.delete(botId);
}

/**
 * 전체 페르소나 캐시 초기화
 */
export function clearAllPersonaCache(): void {
  personaCache.clear();
}

/**
 * 현재 캐시된 botId 목록 반환 (디버그용)
 */
export function getCachedBotIds(): string[] {
  return Array.from(personaCache.keys());
}
