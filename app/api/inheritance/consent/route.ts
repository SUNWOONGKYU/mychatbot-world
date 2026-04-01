/**
 * @task S4BA3
 * @description 피상속 사전 동의 관리 API
 *
 * Endpoints:
 * - GET  /api/inheritance/consent   나에게 온 피상속 동의 요청 목록 (피상속인 역할)
 * - POST /api/inheritance/consent   동의 수락/거부 처리
 *
 * Tables:
 * - mcw_inheritance_settings          피상속인 지정 현황 (consent_status 포함)
 * - mcw_inheritance_persona_settings  페르소나별 허용 설정
 * - mcw_inheritance_event_logs        이벤트 로그
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ============================
// Supabase 클라이언트 & 인증
// ============================

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('서버 설정 오류: Supabase 환경 변수가 누락되었습니다.');
  return createClient(url, key) as any;
}

async function authenticate(
  supabase: ReturnType<typeof createClient>,
  authHeader: string | null
): Promise<{ userId: string | null; userEmail: string | null; error: string | null }> {
  if (!authHeader) return { userId: null, userEmail: null, error: '인증이 필요합니다.' };
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { userId: null, userEmail: null, error: '인증 토큰이 없습니다.' };
  const { data, error } = await (supabase as any).auth.getUser(token);
  if (error || !data?.user) {
    return { userId: null, userEmail: null, error: '유효하지 않거나 만료된 토큰입니다.' };
  }
  return { userId: data.user.id, userEmail: data.user.email ?? null, error: null };
}

// ============================
// 타입 정의
// ============================

interface InheritanceSetting {
  id: string;
  owner_id: string;
  heir_id: string | null;
  heir_email: string;
  consent_status: 'pending' | 'accepted' | 'declined';
  invitation_message: string | null;
  invited_at: string;
  updated_at: string;
}

interface OwnerRow {
  id: string;
  email: string;
  display_name: string | null;
}

interface PersonaSettingWithChatbot {
  inheritance_id: string;
  persona_id: string;
  allowed: boolean;
  chatbots: { id: string; name: string } | null;
}

interface ConsentRequestItem {
  inheritanceId: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string | null;
  invitationMessage: string | null;
  invitedAt: string;
  currentStatus: 'pending' | 'accepted' | 'declined';
  personas: Array<{ id: string; name: string; allowed: boolean }>;
}

interface PostConsentBody {
  inheritanceId: string;
  action: 'accept' | 'decline';
  note?: string;
}

// ============================
// GET /api/inheritance/consent
// ============================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();
  const { userId, userEmail, error: authError } = await authenticate(
    supabase,
    request.headers.get('authorization')
  );
  if (authError || !userId || !userEmail) {
    return NextResponse.json({ success: false, error: authError }, { status: 401 });
  }

  // 자신이 피상속인으로 지정된 건 조회 (user ID 또는 email 기준)
  const { data: settings, error: settingsError } = await (supabase as any)
    .from('mcw_inheritance_settings')
    .select('*')
    .or(`heir_id.eq.${userId},heir_email.eq.${userEmail}`)
    .order('invited_at', { ascending: false })
    ;

  if (settingsError) {
    console.error('[GET /api/inheritance/consent]', settingsError);
    return NextResponse.json(
      { success: false, error: '동의 요청 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }

  if (!settings || settings.length === 0) {
    return NextResponse.json({ success: true, data: { requests: [] } }, { status: 200 });
  }

  // 크리에이터(소유자) 정보 일괄 조회
  const ownerIds = [...new Set(settings.map((s: any) => s.owner_id))];
  const { data: owners } = await (supabase as any)
    .from('users')
    .select('id, email, display_name')
    .in('id', ownerIds)
    ;

  const ownerMap = new Map<string, OwnerRow>((owners ?? []).map((o: any) => [o.id, o]));

  // 각 피상속 건의 페르소나 설정 조회 (chatbots 테이블 join)
  const inheritanceIds = settings.map((s: any) => s.id);
  const { data: personaSettings } = await (supabase as any)
    .from('mcw_inheritance_persona_settings')
    .select('inheritance_id, persona_id, allowed, chatbots(id, name)')
    .in('inheritance_id', inheritanceIds)
    ;

  // inheritanceId → personaSettings 매핑
  const personaSettingsMap = new Map<string, PersonaSettingWithChatbot[]>();
  (personaSettings ?? []).forEach((ps: any) => {
    const key = ps.inheritance_id;
    if (!personaSettingsMap.has(key)) personaSettingsMap.set(key, []);
    personaSettingsMap.get(key)!.push(ps);
  });

  const requests: ConsentRequestItem[] = settings.map((setting: any) => {
    const owner = ownerMap.get(setting.owner_id);
    const pSettings = personaSettingsMap.get(setting.id) ?? [];

    return {
      inheritanceId: setting.id,
      ownerId: setting.owner_id,
      ownerEmail: owner?.email ?? '',
      ownerName: owner?.display_name ?? null,
      invitationMessage: setting.invitation_message,
      invitedAt: setting.invited_at,
      currentStatus: setting.consent_status,
      personas: pSettings.map((ps: any) => ({
        id: ps.chatbots?.id ?? ps.persona_id,
        name: ps.chatbots?.name ?? '알 수 없음',
        allowed: ps.allowed,
      })),
    };
  });

  return NextResponse.json({ success: true, data: { requests } }, { status: 200 });
}

// ============================
// POST /api/inheritance/consent
// ============================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();
  const { userId, userEmail, error: authError } = await authenticate(
    supabase,
    request.headers.get('authorization')
  );
  if (authError || !userId || !userEmail) {
    return NextResponse.json({ success: false, error: authError }, { status: 401 });
  }

  let body: PostConsentBody;
  try {
    body = (await request.json()) as PostConsentBody;
  } catch {
    return NextResponse.json(
      { success: false, error: '요청 바디를 파싱할 수 없습니다.' },
      { status: 400 }
    );
  }

  const { inheritanceId, action, note } = body;

  if (!inheritanceId) {
    return NextResponse.json(
      { success: false, error: 'inheritanceId가 필요합니다.' },
      { status: 400 }
    );
  }
  if (action !== 'accept' && action !== 'decline') {
    return NextResponse.json(
      { success: false, error: "action은 'accept' 또는 'decline'이어야 합니다." },
      { status: 400 }
    );
  }

  // 해당 피상속 건 조회 — 본인이 피상속인인지 확인
  const { data: setting, error: settingError } = await (supabase as any)
    .from('mcw_inheritance_settings')
    .select('*')
    .eq('id', inheritanceId)
    .or(`heir_id.eq.${userId},heir_email.eq.${userEmail}`)
    .maybeSingle();

  if (settingError) {
    console.error('[POST /api/inheritance/consent]', settingError);
    return NextResponse.json(
      { success: false, error: '피상속인 설정 조회에 실패했습니다.' },
      { status: 500 }
    );
  }

  if (!setting) {
    return NextResponse.json(
      { success: false, error: '해당 피상속 요청을 찾을 수 없거나 권한이 없습니다.' },
      { status: 404 }
    );
  }

  if (setting.consent_status !== 'pending') {
    return NextResponse.json(
      {
        success: false,
        error: `이미 처리된 요청입니다. (현재 상태: ${setting.consent_status})`,
      },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const newStatus: 'accepted' | 'declined' = action === 'accept' ? 'accepted' : 'declined';

  const updatePayload: Record<string, unknown> = {
    consent_status: newStatus,
    updated_at: now,
  };
  // 수락 시 heir_id를 현재 사용자 ID로 연결 (이메일만으로 지정된 경우 처리)
  if (action === 'accept') {
    updatePayload.heir_id = userId;
  }

  const { error: updateError } = await (supabase as any)
    .from('mcw_inheritance_settings')
    .update(updatePayload)
    .eq('id', inheritanceId);

  if (updateError) {
    console.error('[POST /api/inheritance/consent] 상태 업데이트 오류:', updateError);
    return NextResponse.json(
      { success: false, error: '동의 상태 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }

  // 이벤트 로그 기록
  const eventType = action === 'accept' ? 'heir_accepted' : 'heir_declined';
  await (supabase as any).from('mcw_inheritance_event_logs').insert({
    inheritance_id: inheritanceId,
    event_type: eventType,
    actor_id: userId,
    target_email: setting.heir_email,
    metadata: { note: note ?? null },
    created_at: now,
  });

  // 거부 시 크리에이터에게 알림 이벤트 기록
  if (action === 'decline') {
    await (supabase as any).from('mcw_inheritance_event_logs').insert({
      inheritance_id: inheritanceId,
      event_type: 'owner_notified_heir_declined',
      actor_id: userId,
      target_id: setting.owner_id,
      metadata: { note: note ?? null, heir_email: setting.heir_email },
      created_at: now,
    });
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        inheritanceId,
        newStatus,
        message:
          action === 'accept'
            ? '피상속 동의를 수락하였습니다.'
            : '피상속 동의를 거부하였습니다. 크리에이터에게 알림이 기록되었습니다.',
      },
    },
    { status: 200 }
  );
}
