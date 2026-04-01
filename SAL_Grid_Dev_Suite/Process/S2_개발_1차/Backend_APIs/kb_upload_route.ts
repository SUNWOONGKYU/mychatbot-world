/**
 * @task S2BA3 - Home API (KB 임베딩, 설정 저장, 클라우드 동기화)
 * @description KB 파일 업로드 API
 *
 * Endpoints:
 * - POST /api/kb/upload  파일 업로드 → 텍스트 추출 → KB 등록
 *
 * 처리 흐름:
 * 1. multipart/form-data 파싱 (파일 + chatbot_id)
 * 2. 파일 크기/형식 검증 (최대 10MB, PDF/TXT/MD)
 * 3. Supabase Storage 업로드 (kb-files 버킷)
 * 4. 텍스트 추출 (PDF → 텍스트 레이어, TXT/MD → 직접 읽기)
 * 5. KB 항목 등록 (kb_items 테이블)
 * 6. 자동 임베딩 트리거 (옵션)
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  extractText,
  validateFileSize,
  detectFileType,
} from '@/lib/text-extractor';

// ============================
// 상수
// ============================

/** 허용 파일 확장자 */
const ALLOWED_EXTENSIONS = ['pdf', 'txt', 'md'] as const;

/** 허용 MIME 타입 */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
];

/** 최대 파일 크기 (MB) */
const MAX_FILE_SIZE_MB = 10;

/** Supabase Storage 버킷명 */
const STORAGE_BUCKET = 'kb-files';

// ============================
// POST /api/kb/upload
// ============================

/**
 * 파일 업로드 및 KB 등록
 *
 * Form Data 필드:
 * - file: 업로드할 파일 (필수)
 * - chatbot_id: 챗봇 ID (필수)
 * - auto_embed: 자동 임베딩 여부 ("true"/"false", 기본: "false")
 * - title: KB 제목 (선택, 미입력 시 파일명 사용)
 *
 * @param request - multipart/form-data 요청
 * @returns 업로드 결과 + 생성된 KB 항목
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createRouteHandlerClient({ cookies });

  // 인증 확인
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다.', data: null },
      { status: 401 }
    );
  }

  // Content-Type 확인
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      {
        success: false,
        error: 'multipart/form-data 형식으로 전송해 주세요.',
        data: null,
      },
      { status: 400 }
    );
  }

  // Form Data 파싱
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: '파일 데이터 파싱에 실패했습니다.', data: null },
      { status: 400 }
    );
  }

  const file = formData.get('file') as File | null;
  const chatbotId = formData.get('chatbot_id') as string | null;
  const autoEmbed = formData.get('auto_embed') === 'true';
  const customTitle = formData.get('title') as string | null;

  // 필수 필드 검증
  if (!file) {
    return NextResponse.json(
      { success: false, error: '파일이 첨부되지 않았습니다.', data: null },
      { status: 400 }
    );
  }

  if (!chatbotId) {
    return NextResponse.json(
      { success: false, error: 'chatbot_id 필드가 필요합니다.', data: null },
      { status: 400 }
    );
  }

  // 파일 크기 검증
  try {
    validateFileSize(file.size, MAX_FILE_SIZE_MB);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : '파일 크기 검증 실패',
        data: null,
      },
      { status: 400 }
    );
  }

  // 파일 형식 검증
  const fileType = detectFileType(file.name);
  if (!fileType) {
    return NextResponse.json(
      {
        success: false,
        error: `지원하지 않는 파일 형식입니다. 허용 형식: ${ALLOWED_EXTENSIONS.join(', ')}`,
        data: null,
      },
      { status: 400 }
    );
  }

  const mimeType = file.type;
  if (mimeType && !ALLOWED_MIME_TYPES.some((m) => mimeType.startsWith(m.split('/')[0]))) {
    // MIME 타입이 명시된 경우만 엄격 검증 (일부 브라우저는 빈 값 전송)
    // PDF는 별도 체크
    if (fileType === 'pdf' && mimeType !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'PDF 파일의 MIME 타입이 올바르지 않습니다.', data: null },
        { status: 400 }
      );
    }
  }

  try {
    // 챗봇 소유권 확인
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('id')
      .eq('id', chatbotId)
      .eq('owner_id', session.user.id)
      .single();

    if (chatbotError || !chatbot) {
      return NextResponse.json(
        { success: false, error: '챗봇을 찾을 수 없거나 접근 권한이 없습니다.', data: null },
        { status: 403 }
      );
    }

    // 파일 → Buffer 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 텍스트 추출
    let extraction;
    try {
      extraction = await extractText(buffer, file.name);
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error: err instanceof Error ? err.message : '텍스트 추출에 실패했습니다.',
          data: null,
        },
        { status: 422 }
      );
    }

    // Supabase Storage 업로드
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${session.user.id}/${chatbotId}/${timestamp}_${safeFileName}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType || `application/${fileType}`,
        upsert: false,
      });

    if (storageError) {
      console.error('[KB UPLOAD] Storage 업로드 실패:', storageError.message);
      return NextResponse.json(
        { success: false, error: '파일 저장에 실패했습니다.', data: null },
        { status: 500 }
      );
    }

    // Storage 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storageData.path);

    // KB 항목 등록
    const kbTitle =
      customTitle?.trim() ||
      file.name.replace(/\.[^.]+$/, ''); // 확장자 제거

    const { data: kbItem, error: insertError } = await supabase
      .from('kb_items')
      .insert({
        chatbot_id: chatbotId,
        title: kbTitle,
        content: extraction.text,
        source_type: 'file',
        file_path: storageData.path,
        file_name: file.name,
        source_url: publicUrlData.publicUrl,
        char_count: extraction.charCount,
        chunk_count: 0,
        is_embedded: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[KB UPLOAD] KB 항목 등록 실패:', insertError.message);

      // 등록 실패 시 업로드된 파일도 삭제 (롤백)
      await supabase.storage.from(STORAGE_BUCKET).remove([storageData.path]);

      return NextResponse.json(
        { success: false, error: 'KB 항목 등록에 실패했습니다.', data: null },
        { status: 500 }
      );
    }

    // 자동 임베딩 (auto_embed=true인 경우)
    let embedResult = null;
    if (autoEmbed && kbItem) {
      try {
        const embedResponse = await fetch(
          new URL('/api/kb/embed', request.url).toString(),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Cookie: request.headers.get('cookie') ?? '',
            },
            body: JSON.stringify({ kb_item_id: kbItem.id }),
          }
        );

        if (embedResponse.ok) {
          embedResult = await embedResponse.json();
        } else {
          console.warn('[KB UPLOAD] 자동 임베딩 실패 (항목은 등록됨)');
        }
      } catch (embedErr) {
        console.warn('[KB UPLOAD] 자동 임베딩 요청 오류:', embedErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        error: null,
        data: {
          kb_item: kbItem,
          file: {
            original_name: file.name,
            size_bytes: file.size,
            file_type: fileType,
            storage_path: storageData.path,
            public_url: publicUrlData.publicUrl,
          },
          extraction: {
            word_count: extraction.wordCount,
            char_count: extraction.charCount,
            page_count: extraction.pageCount,
          },
          embed_result: embedResult,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[KB UPLOAD] 예기치 않은 오류:', err);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', data: null },
      { status: 500 }
    );
  }
}
