/**
 * @task S2BA3 - Home API (KB 임베딩, 설정 저장, 클라우드 동기화)
 * @description 클라우드 동기화 API
 *
 * Endpoints:
 * - GET  /api/sync?chatbot_id=xx  동기화 상태 조회
 * - POST /api/sync                동기화 실행
 *
 * 동기화 범위:
 * 1. 코코봇 설정 (bot_settings) → 클라우드 메타데이터 갱신
 * 2. KB 임베딩 미완료 항목 → 자동 임베딩 트리거
 * 3. 동기화 로그 기록 (sync_logs 테이블)
 *
 * 동기화 타임스탬프를 비교하여 변경된 항목만 처리
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ============================
// 타입 정의
// ============================

/** 동기화 상태 */
interface SyncStatus {
  chatbot_id: string;
  last_synced_at: string | null;
  kb_total: number;
  kb_embedded: number;
  kb_pending: number;
  settings_synced: boolean;
  is_syncing: boolean;
}

/** 동기화 요청 바디 */
interface SyncRequest {
  chatbot_id: string;
  /** 동기화 범위 (기본: all) */
  scope?: 'all' | 'kb' | 'settings';
  /** KB 미임베딩 항목 자동 임베딩 여부 (기본: true) */
  auto_embed?: boolean;
}

/** 동기화 결과 */
interface SyncResult {
  chatbot_id: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  scope: string;
  kb_synced: number;
  kb_embedded_new: number;
  kb_embed_failed: number;
  settings_synced: boolean;
  errors: string[];
}

// ============================
// GET /api/sync
// ============================

/**
 * 동기화 상태 조회
 * KB 임베딩 현황, 마지막 동기화 시각 등을 반환
 *
 * @param request - 쿼리: chatbot_id (필수)
 * @returns SyncStatus
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
    // 코코봇 소유권 확인
    const { data: chatbot, error: chatbotError } = await supabase
      .from('mcw_bots')
      .select('id')
      .eq('id', chatbotId)
      .eq('owner_id', user.id)
      .single();

    if (chatbotError || !chatbot) {
      return NextResponse.json(
        { success: false, error: '코코봇을 찾을 수 없거나 접근 권한이 없습니다.', data: null },
        { status: 403 }
      );
    }

    // KB 통계 조회
    const { data: kbStats, error: kbError } = await supabase
      .from('mcw_kb_items')
      .select('is_embedded')
      .eq('bot_id', chatbotId);

    if (kbError) {
      console.error('[SYNC GET] KB 통계 조회 실패:', kbError.message);
    }

    const kbTotal = kbStats?.length ?? 0;
    const kbEmbedded = kbStats?.filter((item: any) => item.is_embedded).length ?? 0;
    const kbPending = kbTotal - kbEmbedded;

    // 마지막 동기화 로그 조회
    const { data: lastSync, error: syncLogError } = await supabase
      .from('sync_logs')
      .select('completed_at, status')
      .eq('chatbot_id', chatbotId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (syncLogError && syncLogError.code !== 'PGRST116') {
      console.error('[SYNC GET] 동기화 로그 조회 실패:', syncLogError.message);
    }

    // 진행 중인 동기화 확인 (5분 내 started 상태)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: activeSyncs } = await supabase
      .from('sync_logs')
      .select('id')
      .eq('chatbot_id', chatbotId)
      .eq('status', 'running')
      .gte('created_at', fiveMinutesAgo);

    // 설정 동기화 여부 (설정이 존재하면 synced)
    const { data: settings } = await supabase
      .from('bot_settings')
      .select('id')
      .eq('chatbot_id', chatbotId)
      .single();

    const syncStatus: SyncStatus = {
      chatbot_id: chatbotId,
      last_synced_at: lastSync?.completed_at ?? null,
      kb_total: kbTotal,
      kb_embedded: kbEmbedded,
      kb_pending: kbPending,
      settings_synced: !!settings,
      is_syncing: (activeSyncs?.length ?? 0) > 0,
    };

    return NextResponse.json({
      success: true,
      error: null,
      data: syncStatus,
    });
  } catch (err) {
    console.error('[SYNC GET] 예기치 않은 오류:', err);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', data: null },
      { status: 500 }
    );
  }
}

// ============================
// POST /api/sync
// ============================

/**
 * 클라우드 동기화 실행
 *
 * 처리 흐름:
 * 1. 동기화 로그 생성 (status: running)
 * 2. 스코프에 따라 KB / 설정 동기화
 *    - KB: 미임베딩 항목 자동 임베딩 (auto_embed: true 시)
 *    - 설정: bot_settings 유효성 확인 + updated_at 갱신
 * 3. 동기화 로그 완료 처리 (status: done / failed)
 *
 * @param request - JSON 바디: SyncRequest
 * @returns SyncResult
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

  let body: SyncRequest;
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

  const scope = body.scope ?? 'all';
  const autoEmbed = body.auto_embed ?? true;
  const startedAt = new Date();

  try {
    // 코코봇 소유권 확인
    const { data: chatbot, error: chatbotError } = await supabase
      .from('mcw_bots')
      .select('id')
      .eq('id', body.chatbot_id)
      .eq('owner_id', user.id)
      .single();

    if (chatbotError || !chatbot) {
      return NextResponse.json(
        { success: false, error: '코코봇을 찾을 수 없거나 접근 권한이 없습니다.', data: null },
        { status: 403 }
      );
    }

    // 동기화 로그 생성 (running 상태)
    const { data: syncLog, error: logCreateError } = await supabase
      .from('sync_logs')
      .insert({
        chatbot_id: body.chatbot_id,
        user_id: user.id,
        scope,
        status: 'running',
        started_at: startedAt.toISOString(),
      })
      .select()
      .single();

    if (logCreateError) {
      // 로그 실패는 동기화 자체를 막지 않음 (경고만)
      console.warn('[SYNC POST] 로그 생성 실패:', logCreateError.message);
    }

    const errors: string[] = [];
    let kbSynced = 0;
    let kbEmbeddedNew = 0;
    let kbEmbedFailed = 0;
    let settingsSynced = false;

    // ---- KB 동기화 ----
    if (scope === 'all' || scope === 'kb') {
      // 미임베딩 KB 항목 조회
      const { data: pendingKbs, error: pendingError } = await supabase
        .from('mcw_kb_items')
        .select('id, title')
        .eq('bot_id', body.chatbot_id)
        .eq('is_embedded', false);

      if (pendingError) {
        errors.push(`KB 조회 실패: ${pendingError.message}`);
      } else if (pendingKbs && pendingKbs.length > 0) {
        kbSynced = pendingKbs.length;

        // 자동 임베딩 처리
        if (autoEmbed) {
          for (const kb of pendingKbs) {
            try {
              const embedResponse = await fetch(
                new URL('/api/kb/embed', request.url).toString(),
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Cookie: request.headers.get('cookie') ?? '',
                  },
                  body: JSON.stringify({ kb_item_id: kb.id }),
                }
              );

              if (embedResponse.ok) {
                const embedData = await embedResponse.json();
                if (embedData.success) {
                  kbEmbeddedNew++;
                } else {
                  kbEmbedFailed++;
                  errors.push(`KB "${kb.title}" 임베딩 실패: ${embedData.error}`);
                }
              } else {
                kbEmbedFailed++;
                errors.push(
                  `KB "${kb.title}" 임베딩 API 오류: ${embedResponse.status}`
                );
              }
            } catch (embedErr) {
              kbEmbedFailed++;
              errors.push(
                `KB "${kb.title}" 임베딩 예외: ${embedErr instanceof Error ? embedErr.message : '알 수 없는 오류'}`
              );
            }
          }
        }
      }
    }

    // ---- 설정 동기화 ----
    if (scope === 'all' || scope === 'settings') {
      const { data: settings, error: settingsError } = await supabase
        .from('bot_settings')
        .select('id')
        .eq('chatbot_id', body.chatbot_id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        errors.push(`설정 조회 실패: ${settingsError.message}`);
      } else if (!settings) {
        // 설정 없으면 기본값으로 자동 생성
        const createResponse = await fetch(
          new URL('/api/settings', request.url).toString(),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Cookie: request.headers.get('cookie') ?? '',
            },
            body: JSON.stringify({ chatbot_id: body.chatbot_id }),
          }
        );

        if (createResponse.ok) {
          settingsSynced = true;
        } else {
          errors.push('기본 설정 생성 실패');
        }
      } else {
        // 설정 updated_at 갱신 (동기화 시각 기록)
        const { error: updateError } = await supabase
          .from('bot_settings')
          .update({ updated_at: new Date().toISOString() })
          .eq('chatbot_id', body.chatbot_id);

        settingsSynced = !updateError;
        if (updateError) {
          errors.push(`설정 동기화 타임스탬프 갱신 실패: ${updateError.message}`);
        }
      }
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const hasErrors = errors.length > 0;
    const finalStatus = hasErrors && kbEmbeddedNew === 0 ? 'failed' : 'done';

    // 동기화 로그 완료 처리
    if (syncLog) {
      await supabase
        .from('sync_logs')
        .update({
          status: finalStatus,
          completed_at: completedAt.toISOString(),
          duration_ms: durationMs,
          kb_synced: kbSynced,
          kb_embedded_new: kbEmbeddedNew,
          kb_embed_failed: kbEmbedFailed,
          settings_synced: settingsSynced,
          error_log: hasErrors ? errors.join('\n') : null,
        })
        .eq('id', syncLog.id);
    }

    const syncResult: SyncResult = {
      chatbot_id: body.chatbot_id,
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
      duration_ms: durationMs,
      scope,
      kb_synced: kbSynced,
      kb_embedded_new: kbEmbeddedNew,
      kb_embed_failed: kbEmbedFailed,
      settings_synced: settingsSynced,
      errors,
    };

    const httpStatus = finalStatus === 'failed' ? 207 : 200; // 207 Multi-Status (부분 성공)

    return NextResponse.json(
      { success: finalStatus !== 'failed', error: null, data: syncResult },
      { status: httpStatus }
    );
  } catch (err) {
    console.error('[SYNC POST] 예기치 않은 오류:', err);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', data: null },
      { status: 500 }
    );
  }
}
