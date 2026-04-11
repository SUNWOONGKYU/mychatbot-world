/**
 * @task S5BA6
 * @description OCR 파이프라인 API — 스캔 PDF/이미지/HWP → 텍스트 추출 → Wiki Ingest 연결
 *
 * POST /api/kb/ocr
 * - kb_item_id: 기존 KB 항목에 OCR 재처리
 * - ocr_engine: 'upstage-parse' | 'upstage-ocr' | 'varco-vision' | 'auto'
 * - auto_ingest: true 시 OCR 완료 후 Wiki Ingest 자동 실행
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { runOcr, type OcrEngine } from '@/lib/ocr-client';

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

interface OcrRequest {
  kb_item_id: string;
  ocr_engine?: OcrEngine;
  auto_ingest?: boolean;
}

// ============================
// POST /api/kb/ocr
// ============================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();

  // 인증 확인
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.', data: null }, { status: 401 });
  }

  let body: OcrRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: '잘못된 요청 형식입니다.', data: null }, { status: 400 });
  }

  if (!body.kb_item_id) {
    return NextResponse.json({ success: false, error: 'kb_item_id가 필요합니다.', data: null }, { status: 400 });
  }

  try {
    // KB 항목 조회 + 소유권 확인
    const { data: kbItem, error: kbError } = await supabase
      .from('mcw_kb_items')
      .select('id, chatbot_id, title, file_path, file_name, content, mcw_bots!inner(owner_id, id)')
      .eq('id', body.kb_item_id)
      .single();

    if (kbError || !kbItem) {
      return NextResponse.json({ success: false, error: 'KB 항목을 찾을 수 없습니다.', data: null }, { status: 404 });
    }

    const ownerCheck = kbItem.mcw_bots as unknown as { owner_id: string; id: string };
    if (ownerCheck.owner_id !== user.id) {
      return NextResponse.json({ success: false, error: '접근 권한이 없습니다.', data: null }, { status: 403 });
    }

    // 파일 경로 확인
    if (!kbItem.file_path) {
      return NextResponse.json(
        { success: false, error: '파일 경로가 없습니다. 파일 업로드로 등록된 KB 항목만 OCR 처리 가능합니다.', data: null },
        { status: 400 }
      );
    }

    // Supabase Storage에서 파일 다운로드
    const { data: fileData, error: storageError } = await supabase.storage
      .from('kb-files')
      .download(kbItem.file_path as string);

    if (storageError || !fileData) {
      return NextResponse.json(
        { success: false, error: `파일 다운로드 실패: ${storageError?.message}`, data: null },
        { status: 500 }
      );
    }

    // Buffer 변환
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = (kbItem.file_name as string) ?? 'document';

    // 파일 타입 감지
    const fileType = fileData.type ?? 'application/octet-stream';

    // OCR 실행
    const ocrResult = await runOcr(buffer, fileName, {
      engine: body.ocr_engine ?? 'auto',
      file_type: fileType,
    });

    // KB 항목 업데이트
    const { error: updateError } = await supabase
      .from('mcw_kb_items')
      .update({
        content: ocrResult.extracted_text,
        char_count: ocrResult.char_count,
        is_ocr_processed: true,
        ocr_engine: ocrResult.engine_used,
        ocr_confidence: ocrResult.confidence_avg ?? null,
        ocr_page_count: ocrResult.page_count,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.kb_item_id);

    if (updateError) {
      console.error('[kb/ocr] KB 업데이트 실패:', updateError.message);
    }

    // auto_ingest: Wiki Ingest 자동 실행
    let ingestPagesCreated = 0;
    if (body.auto_ingest && ocrResult.extracted_text.length > 100) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
        const ingestRes = await fetch(`${baseUrl}/api/wiki/ingest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 서버 간 호출이므로 세션 쿠키 불필요 — service_role로 처리됨
            Cookie: request.headers.get('cookie') ?? '',
          },
          body: JSON.stringify({
            bot_id: ownerCheck.id,
            kb_item_ids: [body.kb_item_id],
          }),
        });

        if (ingestRes.ok) {
          const ingestJson = await ingestRes.json();
          ingestPagesCreated = ingestJson.data?.pages_created ?? 0;
        }
      } catch (ingestErr) {
        console.warn('[kb/ocr] auto_ingest 실패 (무시):', ingestErr);
      }
    }

    return NextResponse.json({
      success: true,
      error: null,
      data: {
        kb_item_id: body.kb_item_id,
        ocr_engine_used: ocrResult.engine_used,
        extracted_text: ocrResult.extracted_text.slice(0, 500) + (ocrResult.extracted_text.length > 500 ? '...' : ''),
        page_count: ocrResult.page_count,
        char_count: ocrResult.char_count,
        confidence_avg: ocrResult.confidence_avg,
        layout_preserved: ocrResult.layout_preserved,
        ingest_triggered: body.auto_ingest ?? false,
        ingest_pages_created: ingestPagesCreated,
      },
    });
  } catch (err) {
    console.error('[kb/ocr] 오류:', err);
    return NextResponse.json({ success: false, error: `OCR 처리 실패: ${(err as Error).message}`, data: null }, { status: 500 });
  }
}
