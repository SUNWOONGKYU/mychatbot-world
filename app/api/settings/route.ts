/**
 * @task S2BA3 - Home API (KB 임베딩, 설정 저장, 클라우드 동기화)
 * @description 챗봇 설정 CRUD API
 *
 * Endpoints:
 * - GET    /api/settings?chatbot_id=xx  설정 조회
 * - POST   /api/settings               설정 생성 (최초)
 * - PATCH  /api/settings               설정 부분 업데이트 (upsert)
 * - DELETE /api/settings?chatbot_id=xx 설정 초기화 (기본값으로 리셋)
 *
 * bot_settings 테이블 필드:
 * - persona: 챗봇 성격/역할 프롬프트
 * - greeting: 초기 인사말
 * - model: 사용 AI 모델 (gpt-4o, gpt-4o-mini 등)
 * - temperature: 창의성 (0.0 ~ 2.0)
 * - max_tokens: 최대 응답 토큰
 * - language: 기본 응답 언어
 * - fallback_message: 답변 불가 시 메시지
 * - use_kb: Knowledge Base 사용 여부
 * - kb_top_k: KB 검색 시 상위 K개
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ============================
// 상수
// ============================

/** 기본 설정값 */
const DEFAULT_SETTINGS: Omit<BotSettings, 'id' | 'chatbot_id' | 'created_at' | 'updated_at'> = {
  persona: '당신은 도움이 되는 AI 어시스턴트입니다.',
  greeting: '안녕하세요! 무엇을 도와드릴까요?',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 2048,
  language: 'ko',
  fallback_message: '죄송합니다. 해당 내용에 대한 답변을 드리기 어렵습니다.',
  use_kb: true,
  kb_top_k: 5,
};

// ============================
// 타입 정의
// ============================

/** 챗봇 설정 */
interface BotSettings {
  id: string;
  chatbot_id: string;
  persona: string;
  greeting: string;
  model: string;
  temperature: number;
  max_tokens: number;
  language: string;
  fallback_message: string;
  use_kb: boolean;
  kb_top_k: number;
  created_at: string;
  updated_at: string;
}

/** 설정 업데이트 요청 바디 */
type UpdateSettingsRequest = Partial<
  Omit<BotSettings, 'id' | 'chatbot_id' | 'created_at' | 'updated_at'>
> & {
  chatbot_id: string;
};

// ============================
// 유효성 검사
// ============================

/**
 * 설정 값 유효성 검사
 * @param settings - 검사할 설정 객체 (부분 가능)
 * @returns 에러 메시지 (null이면 유효)
 */
function validateSettings(
  settings: Partial<Omit<BotSettings, 'id' | 'chatbot_id' | 'created_at' | 'updated_at'>>
): string | null {
  if (settings.temperature !== undefined) {
    if (settings.temperature < 0 || settings.temperature > 2) {
      return 'temperature는 0.0 ~ 2.0 사이 값이어야 합니다.';
    }
  }

  if (settings.max_tokens !== undefined) {
    if (settings.max_tokens < 100 || settings.max_tokens > 16384) {
      return 'max_tokens는 100 ~ 16384 사이 값이어야 합니다.';
    }
  }

  if (settings.kb_top_k !== undefined) {
    if (settings.kb_top_k < 1 || settings.kb_top_k > 20) {
      return 'kb_top_k는 1 ~ 20 사이 값이어야 합니다.';
    }
  }

  if (settings.persona !== undefined && settings.persona.length > 5000) {
    return 'persona는 5,000자 이하여야 합니다.';
  }

  if (settings.greeting !== undefined && settings.greeting.length > 1000) {
    return 'greeting은 1,000자 이하여야 합니다.';
  }

  if (settings.fallback_message !== undefined && settings.fallback_message.length > 500) {
    return 'fallback_message는 500자 이하여야 합니다.';
  }

  return null;
}

// ============================
// GET /api/settings
// ============================

/**
 * 챗봇 설정 조회
 * @param request - 쿼리: chatbot_id (필수)
 * @returns BotSettings (없으면 기본값 반환)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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

  const { searchParams } = new URL(request.url);
  const chatbotId = searchParams.get('chatbot_id');

  if (!chatbotId) {
    return NextResponse.json(
      { success: false, error: 'chatbot_id 파라미터가 필요합니다.', data: null },
      { status: 400 }
    );
  }

  try {
    // 챗봇 소유권 확인
    const { data: chatbot, error: chatbotError } = await supabase
      .from('mcw_bots')
      .select('id')
      .eq('id', chatbotId)
      .eq('owner_id', user.id)
      .single();

    if (chatbotError || !chatbot) {
      return NextResponse.json(
        { success: false, error: '챗봇을 찾을 수 없거나 접근 권한이 없습니다.', data: null },
        { status: 403 }
      );
    }

    // 설정 조회
    const { data: settings, error: settingsError } = await supabase
      .from('bot_settings')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      // PGRST116 = no rows found (정상)
      console.error('[SETTINGS GET] 설정 조회 실패:', settingsError.message);
      return NextResponse.json(
        { success: false, error: '설정을 불러오는 데 실패했습니다.', data: null },
        { status: 500 }
      );
    }

    // 설정이 없으면 기본값 반환
    const resultSettings = settings ?? {
      ...DEFAULT_SETTINGS,
      id: null,
      chatbot_id: chatbotId,
      created_at: null,
      updated_at: null,
    };

    return NextResponse.json({
      success: true,
      error: null,
      data: {
        settings: resultSettings,
        is_default: !settings,
      },
    });
  } catch (err) {
    console.error('[SETTINGS GET] 예기치 않은 오류:', err);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', data: null },
      { status: 500 }
    );
  }
}

// ============================
// PATCH /api/settings  (upsert)
// ============================

/**
 * 챗봇 설정 저장/업데이트 (Upsert)
 * 설정이 없으면 생성, 있으면 업데이트
 *
 * @param request - JSON 바디: UpdateSettingsRequest
 * @returns 업데이트된 BotSettings
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
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

  let body: UpdateSettingsRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다.', data: null },
      { status: 400 }
    );
  }

  if (!body.chatbot_id) {
    return NextResponse.json(
      { success: false, error: 'chatbot_id 필드가 필요합니다.', data: null },
      { status: 400 }
    );
  }

  // 설정값 유효성 검사
  const { chatbot_id, ...settingsToUpdate } = body;
  const validationError = validateSettings(settingsToUpdate);
  if (validationError) {
    return NextResponse.json(
      { success: false, error: validationError, data: null },
      { status: 400 }
    );
  }

  try {
    // 챗봇 소유권 확인
    const { data: chatbot, error: chatbotError } = await supabase
      .from('mcw_bots')
      .select('id')
      .eq('id', chatbot_id)
      .eq('owner_id', user.id)
      .single();

    if (chatbotError || !chatbot) {
      return NextResponse.json(
        { success: false, error: '챗봇을 찾을 수 없거나 접근 권한이 없습니다.', data: null },
        { status: 403 }
      );
    }

    // Upsert: 없으면 기본값 + 요청값, 있으면 요청값만 업데이트
    const { data: updated, error: upsertError } = await supabase
      .from('bot_settings')
      .upsert(
        {
          chatbot_id,
          ...DEFAULT_SETTINGS,  // 기본값 먼저 (기존 값이 있으면 Supabase가 덮어씀)
          ...settingsToUpdate,   // 요청 값으로 오버라이드
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'chatbot_id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('[SETTINGS PATCH] Upsert 실패:', upsertError.message);
      return NextResponse.json(
        { success: false, error: '설정 저장에 실패했습니다.', data: null },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      error: null,
      data: updated as BotSettings,
    });
  } catch (err) {
    console.error('[SETTINGS PATCH] 예기치 않은 오류:', err);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', data: null },
      { status: 500 }
    );
  }
}

// ============================
// POST /api/settings  (초기 생성)
// ============================

/**
 * 챗봇 설정 최초 생성 (기본값으로)
 * @param request - JSON 바디: { chatbot_id }
 * @returns 생성된 BotSettings
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

  let body: { chatbot_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다.', data: null },
      { status: 400 }
    );
  }

  if (!body.chatbot_id) {
    return NextResponse.json(
      { success: false, error: 'chatbot_id 필드가 필요합니다.', data: null },
      { status: 400 }
    );
  }

  try {
    // 챗봇 소유권 확인
    const { data: chatbot, error: chatbotError } = await supabase
      .from('mcw_bots')
      .select('id')
      .eq('id', body.chatbot_id)
      .eq('owner_id', user.id)
      .single();

    if (chatbotError || !chatbot) {
      return NextResponse.json(
        { success: false, error: '챗봇을 찾을 수 없거나 접근 권한이 없습니다.', data: null },
        { status: 403 }
      );
    }

    // 이미 설정 존재 여부 확인
    const { data: existing } = await supabase
      .from('bot_settings')
      .select('id')
      .eq('chatbot_id', body.chatbot_id)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: '이미 설정이 존재합니다. 업데이트는 PATCH /api/settings를 사용하세요.',
          data: null,
        },
        { status: 409 }
      );
    }

    // 기본값으로 생성
    const { data: created, error: createError } = await supabase
      .from('bot_settings')
      .insert({
        chatbot_id: body.chatbot_id,
        ...DEFAULT_SETTINGS,
      })
      .select()
      .single();

    if (createError) {
      console.error('[SETTINGS POST] 생성 실패:', createError.message);
      return NextResponse.json(
        { success: false, error: '설정 생성에 실패했습니다.', data: null },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, error: null, data: created as BotSettings },
      { status: 201 }
    );
  } catch (err) {
    console.error('[SETTINGS POST] 예기치 않은 오류:', err);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', data: null },
      { status: 500 }
    );
  }
}

// ============================
// DELETE /api/settings?chatbot_id=xx  (기본값 리셋)
// ============================

/**
 * 챗봇 설정 기본값 초기화
 * 설정 레코드를 삭제하지 않고 기본값으로 되돌림
 *
 * @param request - 쿼리: chatbot_id (필수)
 * @returns 초기화된 BotSettings
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
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

  const { searchParams } = new URL(request.url);
  const chatbotId = searchParams.get('chatbot_id');

  if (!chatbotId) {
    return NextResponse.json(
      { success: false, error: 'chatbot_id 파라미터가 필요합니다.', data: null },
      { status: 400 }
    );
  }

  try {
    // 챗봇 소유권 확인
    const { data: chatbot, error: chatbotError } = await supabase
      .from('mcw_bots')
      .select('id')
      .eq('id', chatbotId)
      .eq('owner_id', user.id)
      .single();

    if (chatbotError || !chatbot) {
      return NextResponse.json(
        { success: false, error: '챗봇을 찾을 수 없거나 접근 권한이 없습니다.', data: null },
        { status: 403 }
      );
    }

    // 기본값으로 업데이트 (삭제 대신 리셋)
    const { data: reset, error: resetError } = await supabase
      .from('bot_settings')
      .update({
        ...DEFAULT_SETTINGS,
        updated_at: new Date().toISOString(),
      })
      .eq('chatbot_id', chatbotId)
      .select()
      .single();

    if (resetError) {
      // 설정 레코드가 없으면 신규 생성 없이 성공 처리
      if (resetError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          error: null,
          data: {
            message: '초기화할 설정이 없습니다 (이미 기본값 상태입니다).',
            settings: { chatbot_id: chatbotId, ...DEFAULT_SETTINGS },
          },
        });
      }

      console.error('[SETTINGS DELETE] 리셋 실패:', resetError.message);
      return NextResponse.json(
        { success: false, error: '설정 초기화에 실패했습니다.', data: null },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      error: null,
      data: {
        message: '설정이 기본값으로 초기화되었습니다.',
        settings: reset as BotSettings,
      },
    });
  } catch (err) {
    console.error('[SETTINGS DELETE] 예기치 않은 오류:', err);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', data: null },
      { status: 500 }
    );
  }
}
