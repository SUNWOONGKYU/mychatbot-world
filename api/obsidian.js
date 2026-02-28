/**
 * Obsidian Knowledge Base API
 * POST /api/obsidian — 마크다운 파일 파싱 및 Supabase pgvector 저장
 * GET  /api/obsidian?persona_id=xxx — 파싱된 문서 목록 조회
 * DELETE /api/obsidian?id=xxx — 문서 삭제
 *
 * 지원 형식: Markdown (.md), 일반 텍스트 (.txt)
 * RAG 파이프라인: 파싱 → 청킹 → 임베딩 → pgvector 저장
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').split(',')[0].trim();

const CHUNK_SIZE = 500;      // 토큰 기준 청크 크기
const CHUNK_OVERLAP = 50;    // 청크 오버랩

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Authorization 헤더에서 Supabase JWT 확인
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  const userJwt = authHeader.slice(7);

  // JWT에서 user_id 추출 (Supabase 서명 검증)
  const userId = await extractUserId(userJwt);
  if (!userId) return res.status(401).json({ error: 'Invalid token' });

  if (req.method === 'GET') {
    return handleGet(req, res, userId);
  } else if (req.method === 'POST') {
    return handlePost(req, res, userId);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res, userId);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ─── GET: 문서 목록 조회 ───
async function handleGet(req, res, userId) {
  const { persona_id, bot_id } = req.query;

  let url = `${SUPABASE_URL}/rest/v1/obsidian_documents?user_id=eq.${encodeURIComponent(userId)}&select=id,file_name,file_path,tags,word_count,chunk_count,is_indexed,created_at&order=created_at.desc`;
  if (persona_id) url += `&persona_id=eq.${encodeURIComponent(persona_id)}`;
  if (bot_id) url += `&bot_id=eq.${encodeURIComponent(bot_id)}`;

  const resp = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error('[Obsidian GET] Supabase error:', err);
    return res.status(500).json({ error: 'Failed to load documents' });
  }

  const docs = await resp.json();
  return res.status(200).json(docs);
}

// ─── POST: 마크다운 파싱 → 청킹 → 임베딩 → 저장 ───
async function handlePost(req, res, userId) {
  const { content, fileName, filePath, personaId, botId } = req.body;

  if (!content || !fileName) {
    return res.status(400).json({ error: 'content and fileName are required' });
  }

  // 1. 마크다운 파싱 (front matter, 링크, 태그 추출)
  const parsed = parseObsidianMarkdown(content);

  // 2. 콘텐츠 해시 (중복 방지)
  const hash = await sha256(parsed.plainText);

  // 3. 기존 문서 확인 (중복 체크)
  const existingCheck = await fetch(
    `${SUPABASE_URL}/rest/v1/obsidian_documents?user_id=eq.${userId}&content_hash=eq.${hash}&select=id`,
    { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` } }
  );
  const existing = await existingCheck.json();
  if (Array.isArray(existing) && existing.length > 0) {
    return res.status(200).json({ success: true, docId: existing[0].id, message: '이미 동일한 문서가 존재합니다.' });
  }

  // 4. 문서 저장
  const docResp = await fetch(`${SUPABASE_URL}/rest/v1/obsidian_documents`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      user_id: userId,
      bot_id: botId || null,
      persona_id: personaId || null,
      file_name: fileName,
      file_path: filePath || null,
      content: parsed.plainText,
      content_hash: hash,
      tags: parsed.tags,
      word_count: parsed.wordCount
    })
  });

  if (!docResp.ok) {
    const err = await docResp.text();
    console.error('[Obsidian POST] doc save error:', err);
    return res.status(500).json({ error: 'Failed to save document' });
  }

  const [doc] = await docResp.json();
  const docId = doc.id;

  // 5. 청킹
  const chunks = chunkText(parsed.plainText, CHUNK_SIZE, CHUNK_OVERLAP);

  // 6. 임베딩 생성 (OpenAI via OpenRouter) + 저장 (배치)
  let indexedChunks = 0;
  const chunkBatch = [];

  for (let i = 0; i < chunks.length; i++) {
    try {
      const embedding = await createEmbedding(chunks[i]);
      chunkBatch.push({
        doc_id: docId,
        user_id: userId,
        persona_id: personaId || null,
        chunk_index: i,
        content: chunks[i],
        embedding: embedding,
        token_count: Math.ceil(chunks[i].length / 4)
      });
    } catch (e) {
      console.warn(`[Obsidian] chunk ${i} embedding failed:`, e.message);
      // 임베딩 실패 시 텍스트만 저장
      chunkBatch.push({
        doc_id: docId,
        user_id: userId,
        persona_id: personaId || null,
        chunk_index: i,
        content: chunks[i],
        embedding: null,
        token_count: Math.ceil(chunks[i].length / 4)
      });
    }
    indexedChunks++;
  }

  // 청크 배치 저장
  let chunkSaveOk = false;
  if (chunkBatch.length > 0) {
    const chunkResp = await fetch(`${SUPABASE_URL}/rest/v1/obsidian_chunks`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chunkBatch)
    });
    chunkSaveOk = chunkResp.ok;
    if (!chunkSaveOk) {
      console.error('[Obsidian POST] chunk save error:', await chunkResp.text());
    }
  }

  // 7. 문서 인덱싱 완료 표시 (청크 저장 성공 시에만)
  await fetch(`${SUPABASE_URL}/rest/v1/obsidian_documents?id=eq.${docId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ is_indexed: chunkSaveOk, chunk_count: chunkSaveOk ? indexedChunks : 0 })
  });

  return res.status(200).json({
    success: true,
    docId,
    fileName,
    wordCount: parsed.wordCount,
    chunkCount: indexedChunks,
    tags: parsed.tags
  });
}

// ─── DELETE: 문서 삭제 ───
async function handleDelete(req, res, userId) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/obsidian_documents?id=eq.${id}&user_id=eq.${userId}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    }
  );

  if (!resp.ok) return res.status(500).json({ error: 'Failed to delete document' });
  return res.status(200).json({ success: true });
}

// ─── Obsidian 마크다운 파서 ───
function parseObsidianMarkdown(content) {
  let text = content;
  const tags = [];

  // Front matter 파싱 (---로 감싸진 YAML)
  const frontMatterMatch = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (frontMatterMatch) {
    const fm = frontMatterMatch[1];
    // tags: [a, b, c] 파싱
    const tagsMatch = fm.match(/tags:\s*\[(.*?)\]/);
    if (tagsMatch) {
      tagsMatch[1].split(',').forEach(t => tags.push(t.trim().replace(/['"]/g, '')));
    }
    text = text.slice(frontMatterMatch[0].length);
  }

  // #태그 추출
  const hashTags = text.match(/#[\w가-힣]+/g) || [];
  hashTags.forEach(t => tags.push(t.slice(1)));

  // Obsidian 링크 [[링크]] → 텍스트로 변환
  text = text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, link, alias) => alias || link);

  // 마크다운 제거 (헤더, 굵게, 이탤릭, 코드 등)
  text = text
    .replace(/^#{1,6}\s+/gm, '')          // 헤더
    .replace(/\*\*(.*?)\*\*/g, '$1')       // 굵게
    .replace(/\*(.*?)\*/g, '$1')           // 이탤릭
    .replace(/`{3}[\s\S]*?`{3}/g, '')      // 코드블록
    .replace(/`([^`]+)`/g, '$1')           // 인라인 코드
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 링크
    .replace(/^\s*[-*+]\s+/gm, '')         // 목록
    .replace(/^\s*\d+\.\s+/gm, '')         // 번호 목록
    .replace(/^\s*>\s+/gm, '')             // 인용
    .replace(/---+/g, '')                  // 구분선
    .replace(/\n{3,}/g, '\n\n')            // 연속 빈줄 정리
    .trim();

  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  return { plainText: text, tags: [...new Set(tags)], wordCount };
}

// ─── 텍스트 청킹 ───
function chunkText(text, chunkSize, overlap) {
  const words = text.split(/\s+/);
  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push(words.slice(start, end).join(' '));
    start += chunkSize - overlap;
    if (start >= words.length) break;
  }

  return chunks.filter(c => c.trim().length > 0);
}

// ─── OpenRouter 임베딩 (text-embedding-3-small) ───
async function createEmbedding(text) {
  if (!OPENROUTER_API_KEY) throw new Error('No API key');

  const resp = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text.slice(0, 8000)  // 토큰 제한 안전 처리
    })
  });

  if (!resp.ok) throw new Error(`Embedding API ${resp.status}`);
  const data = await resp.json();
  return data.data[0].embedding;
}

// ─── RAG 검색 엔드포인트 (별도 쿼리) ───
export async function searchObsidian(userJwt, query, personaId, topK = 5) {
  const userId = await extractUserId(userJwt);
  if (!userId) return [];

  const embedding = await createEmbedding(query);

  // pgvector cosine similarity 검색
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_obsidian_chunks`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query_embedding: embedding,
      match_user_id: userId,
      match_persona_id: personaId,
      match_count: topK
    })
  });

  if (!resp.ok) return [];
  return await resp.json();
}

// ─── 유틸: JWT에서 user_id 추출 (Supabase 서명 검증) ───
async function extractUserId(jwt) {
  try {
    // Supabase auth.getUser()로 서명 검증
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${jwt}`
      }
    });
    if (!resp.ok) return null;
    const user = await resp.json();
    return user.id || null;
  } catch {
    return null;
  }
}

// ─── 유틸: SHA-256 해시 ───
async function sha256(text) {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(text).digest('hex');
}
