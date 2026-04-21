/**
 * @task S5BA9
 * @description URL 학습 API — 웹 페이지 fetch → 본문 추출 → KB 저장 → 임베딩 트리거
 *
 * POST /api/kb/url
 * Body: { url: string; chatbot_id: string; title?: string; auto_embed?: boolean }
 *
 * 처리 흐름:
 * 1. URL 검증 (http/https only, SSRF 방어 — localhost/내부망 차단)
 * 2. fetch (timeout 15s, max 5MB, text/html only)
 * 3. HTML → 본문 텍스트 추출 (script/style 제거 + 태그 strip)
 * 4. mcw_kb_items 삽입 (source_type='url', source_url=URL)
 * 5. auto_embed=true 시 /api/kb/embed 호출
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT_MS = 15_000;
const MAX_CHARS = 100_000; // 추출 후 저장 상한

// ── SSRF 방어 ────────────────────────────────────────────────────────────────
function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === 'localhost' || h === '0.0.0.0' || h === '::1' || h === '127.0.0.1') return true;
  // IPv4 사설 대역
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  // IPv6 link-local / unique-local
  if (h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true;
  // .internal / .local 도메인
  if (h.endsWith('.internal') || h.endsWith('.local')) return true;
  return false;
}

// ── HTML 본문 추출 (lightweight, no external deps) ──────────────────────────
function extractText(html: string): { title: string; text: string } {
  // <title>
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = (titleMatch?.[1] ?? '').trim().slice(0, 200);

  // script, style, noscript, svg, iframe 제거
  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  // <main> / <article> 우선, 없으면 <body>
  const mainMatch =
    body.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i) ??
    body.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i) ??
    body.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i);
  if (mainMatch) body = mainMatch[1];

  // 태그 strip + entity decode
  let text = body
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/(div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);
  return { title, text };
}

// ── POST /api/kb/url ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 인증
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ success: false, error: '유효하지 않은 토큰입니다.', data: null }, { status: 401 });
  }

  // 바디 파싱
  let body: { url?: string; chatbot_id?: string; title?: string; auto_embed?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: '요청 바디를 파싱할 수 없습니다.', data: null }, { status: 400 });
  }

  const rawUrl = body.url?.trim();
  const chatbotId = body.chatbot_id?.trim();
  if (!rawUrl) {
    return NextResponse.json({ success: false, error: 'url 필드가 필요합니다.', data: null }, { status: 400 });
  }
  if (!chatbotId) {
    return NextResponse.json({ success: false, error: 'chatbot_id 필드가 필요합니다.', data: null }, { status: 400 });
  }

  // URL 검증
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ success: false, error: '유효한 URL이 아닙니다.', data: null }, { status: 400 });
  }
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return NextResponse.json({ success: false, error: 'http/https 프로토콜만 지원합니다.', data: null }, { status: 400 });
  }
  if (isPrivateHost(parsedUrl.hostname)) {
    return NextResponse.json({ success: false, error: '내부망/사설 IP는 차단됩니다.', data: null }, { status: 400 });
  }

  // 봇 소유권 확인
  const { data: bot, error: botError } = await supabase
    .from('mcw_bots')
    .select('id')
    .eq('id', chatbotId)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (botError || !bot) {
    return NextResponse.json({ success: false, error: '코코봇을 찾을 수 없거나 권한이 없습니다.', data: null }, { status: 403 });
  }

  // fetch (timeout)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(parsedUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'CoCoBotURLLearner/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error && err.name === 'AbortError'
      ? `URL fetch 타임아웃 (${FETCH_TIMEOUT_MS / 1000}s)`
      : 'URL을 가져올 수 없습니다.';
    return NextResponse.json({ success: false, error: msg, data: null }, { status: 422 });
  }
  clearTimeout(timer);

  if (!res.ok) {
    return NextResponse.json(
      { success: false, error: `URL 응답 오류 ${res.status}`, data: null },
      { status: 422 },
    );
  }

  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
    return NextResponse.json(
      { success: false, error: `HTML이 아닌 콘텐츠는 지원하지 않습니다 (${ct})`, data: null },
      { status: 415 },
    );
  }

  // 크기 제한 (스트리밍 read)
  const reader = res.body?.getReader();
  if (!reader) {
    return NextResponse.json({ success: false, error: '응답 스트림을 읽을 수 없습니다.', data: null }, { status: 422 });
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > MAX_BYTES) {
        try { await reader.cancel(); } catch { /* ignore */ }
        return NextResponse.json(
          { success: false, error: `페이지가 너무 큽니다 (>${MAX_BYTES / 1024 / 1024}MB)`, data: null },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
  }
  const html = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf-8');

  // 본문 추출
  const { title: pageTitle, text } = extractText(html);
  if (!text || text.length < 50) {
    return NextResponse.json(
      { success: false, error: '추출된 본문이 너무 짧습니다.', data: null },
      { status: 422 },
    );
  }

  // KB 저장
  const finalTitle =
    body.title?.trim() ||
    pageTitle ||
    parsedUrl.hostname + parsedUrl.pathname;

  const { data: kbItem, error: insertError } = await supabase
    .from('mcw_kb_items')
    .insert({
      bot_id: chatbotId,
      title: finalTitle.slice(0, 200),
      content: text,
      source_type: 'url',
      source_url: parsedUrl.toString(),
      char_count: text.length,
      chunk_count: 0,
      is_embedded: false,
    })
    .select()
    .single();

  if (insertError) {
    console.error('[KB URL] insert 실패:', insertError.message);
    return NextResponse.json(
      { success: false, error: 'KB 항목 등록에 실패했습니다.', data: null },
      { status: 500 },
    );
  }

  // 자동 임베딩
  let embedResult = null;
  if (body.auto_embed && kbItem) {
    try {
      const embedResp = await fetch(new URL('/api/kb/embed', req.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ kb_item_id: kbItem.id }),
      });
      if (embedResp.ok) embedResult = await embedResp.json();
      else console.warn('[KB URL] 자동 임베딩 실패 (항목은 등록됨)');
    } catch (e) {
      console.warn('[KB URL] 자동 임베딩 요청 오류:', e);
    }
  }

  return NextResponse.json(
    {
      success: true,
      error: null,
      data: {
        kb_item: kbItem,
        url: parsedUrl.toString(),
        char_count: text.length,
        embed_result: embedResult,
      },
    },
    { status: 201 },
  );
}
