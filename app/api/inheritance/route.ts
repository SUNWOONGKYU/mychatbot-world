/**
 * @task S4BA3
 * @description 피상속 API — 피상속인 지정, 동의, 페르소나 설정, 유산 전환
 *
 * Endpoints:
 * - GET    /api/inheritance   현재 피상속인 지정 현황 조회
 * - POST   /api/inheritance   피상속인 지정 (이메일로 초대, 이벤트 로그 기록)
 * - PATCH  /api/inheritance   페르소나별 허용 여부 일괄 업데이트
 * - DELETE /api/inheritance   피상속인 지정 해제
 *
 * Tables:
 * - mcw_inheritance_settings          피상속인 지정 현황
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
  return createClient(url, key);
}

async function authenticate(
  supabase: ReturnType<typeof createClient>,
  authHeader: string | null
): Promise<{ userId: string | null; userEmail: string | null; error: string | null }> {
  if (!authHeader) {
    return { userId: null, userEmail: null, error: '인증이 필요합니다.' };
  }
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { userId: null, userEmail: null, error: '인증 토큰이 없습니다.' };
  }
  const { data, error } = await supabase.auth.getUser(token);
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

interface PersonaRow {
  id: string;
  name: string;
}

interface PersonaSettingRow {
  id: string;
  inheritance_id: string;
  persona_id: string;
  allowed: boolean;
  updated_at: string;
}

interface HeirUserRow {
  id: string;
}

interface GetResponseData {
  heir: {
    inheritanceId: string;
    userId: string | null;
    email: string;
    status: 'pending' | 'accepted' | 'declined';
    invitedAt: string;
  } | null;
  personas: Array<{ id: string; name: string; allowed: boolean }>;
}

interface PostInheritanceBody {
  heirEmail: string;
  message?: string;
}

interface PatchInheritanceBody {
  personas: Array<{ personaId: string; allowed: boolean }>;
}

// ============================
// 유효성 검사
// ============================

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================
// GET /api/inheritance
// ============================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();
  const { userId, userEmail, error: authError } = await authenticate(
    supabase,
    request.headers.get('authorization')
  );
  if (authError || !userId) {
    return NextResponse.json({ success: false, error: authError }, { status: 401 });
  }

  const { data: setting, error: settingError } = await supabase
    .from('mcw_inheritance_settings')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle();

  if (settingError) {
    console.error('[GET /api/inheritance]', settingError);
    return NextResponse.json(
      { success: false, error: '피상속인 설정 조회에 실패했습니다.' },
      { status: 500 }
    );
  }

  const { data: personas, error: personasError } = await supabase
    .from('mcw_bots')
    .select('id, bot_name')
    .eq('owner_id', userId);

  if (personasError) {
    console.error('[GET /api/inheritance] 페르소나 조회 오류:', personasError);
    return NextResponse.json(
      { success: false, error: '페르소나 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }

  let personaSettings: PersonaSettingRow[] = [];
  if (setting) {
    const { data: ps } = await supabase
      .from('mcw_inheritance_persona_settings')
      .select('*')
      .eq('inheritance_id', setting.id)
      ;
    personaSettings = ps ?? [];
  }

  const personaSettingsMap = new Map<string, boolean>(
    personaSettings.map((ps: any) => [ps.persona_id, ps.allowed])
  );

  const responseData: GetResponseData = {
    heir: setting
      ? {
          inheritanceId: setting.id,
          userId: setting.heir_id,
          email: setting.heir_email,
          status: setting.consent_status,
          invitedAt: setting.invited_at,
        }
      : null,
    personas: (personas ?? []).map((p: any) => ({
      id: p.id,
      name: p.bot_name ?? p.name ?? '(이름 없음)',
      allowed: personaSettingsMap.has(p.id) ? (personaSettingsMap.get(p.id) ?? true) : true,
    })),
  };

  void userEmail; // used in POST/DELETE, not GET
  return NextResponse.json({ success: true, data: responseData }, { status: 200 });
}

// ============================
// POST /api/inheritance
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

  let body: PostInheritanceBody;
  try {
    body = (await request.json()) as PostInheritanceBody;
  } catch {
    return NextResponse.json(
      { success: false, error: '요청 바디를 파싱할 수 없습니다.' },
      { status: 400 }
    );
  }

  const { heirEmail, message } = body;
  if (!heirEmail) {
    return NextResponse.json({ success: false, error: 'heirEmail이 필요합니다.' }, { status: 400 });
  }
  if (!isValidEmail(heirEmail)) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 이메일 형식입니다.' },
      { status: 400 }
    );
  }
  if (heirEmail.toLowerCase() === userEmail.toLowerCase()) {
    return NextResponse.json(
      { success: false, error: '자기 자신을 피상속인으로 지정할 수 없습니다.' },
      { status: 400 }
    );
  }

  const { data: heirUserResult } = await supabase.auth.admin.getUserByEmail(heirEmail);
  const heirUser = heirUserResult?.user ? { id: heirUserResult.user.id } : null;

  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('mcw_inheritance_settings')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  let inheritanceId: string;

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('mcw_inheritance_settings')
      .update({
        heir_id: heirUser?.id ?? null,
        heir_email: heirEmail,
        consent_status: 'pending',
        invitation_message: message ?? null,
        invited_at: now,
        updated_at: now,
      })
      .eq('id', existing.id)
      .select('id')
      .single();

    if (updateError || !updated) {
      console.error('[POST /api/inheritance] 업데이트 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '피상속인 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }
    inheritanceId = updated.id;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('mcw_inheritance_settings')
      .insert({
        owner_id: userId,
        heir_id: heirUser?.id ?? null,
        heir_email: heirEmail,
        consent_status: 'pending',
        invitation_message: message ?? null,
        invited_at: now,
        updated_at: now,
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      console.error('[POST /api/inheritance] 삽입 오류:', insertError);
      return NextResponse.json(
        { success: false, error: '피상속인 지정에 실패했습니다.' },
        { status: 500 }
      );
    }
    inheritanceId = inserted.id;
  }

  // 이벤트 로그 기록 (이메일 서비스 대체)
  await supabase.from('mcw_inheritance_event_logs').insert({
    inheritance_id: inheritanceId,
    event_type: 'heir_invited',
    actor_id: userId,
    target_email: heirEmail,
    metadata: { message: message ?? null },
    created_at: now,
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        inheritanceId,
        heirEmail,
        status: 'pending',
        message: '피상속인 초대 이벤트가 기록되었습니다.',
      },
    },
    { status: 200 }
  );
}

// ============================
// PATCH /api/inheritance
// ============================

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();
  const { userId, error: authError } = await authenticate(
    supabase,
    request.headers.get('authorization')
  );
  if (authError || !userId) {
    return NextResponse.json({ success: false, error: authError }, { status: 401 });
  }

  let body: PatchInheritanceBody;
  try {
    body = (await request.json()) as PatchInheritanceBody;
  } catch {
    return NextResponse.json(
      { success: false, error: '요청 바디를 파싱할 수 없습니다.' },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.personas) || body.personas.length === 0) {
    return NextResponse.json(
      { success: false, error: 'personas 배열이 필요합니다.' },
      { status: 400 }
    );
  }

  const { data: setting, error: settingError } = await supabase
    .from('mcw_inheritance_settings')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  if (settingError) {
    console.error('[PATCH /api/inheritance]', settingError);
    return NextResponse.json(
      { success: false, error: '피상속인 설정 조회에 실패했습니다.' },
      { status: 500 }
    );
  }

  if (!setting) {
    return NextResponse.json(
      { success: false, error: '피상속인이 지정되어 있지 않습니다. 먼저 피상속인을 지정해주세요.' },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const upsertData = body.personas.map((p: any) => ({
    inheritance_id: setting.id,
    persona_id: p.personaId,
    allowed: p.allowed,
    updated_at: now,
  }));

  const { error: upsertError } = await supabase
    .from('mcw_inheritance_persona_settings')
    .upsert(upsertData, { onConflict: 'inheritance_id,persona_id' });

  if (upsertError) {
    console.error('[PATCH /api/inheritance] upsert 오류:', upsertError);
    return NextResponse.json(
      { success: false, error: '페르소나 설정 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        updatedCount: body.personas.length,
        message: '페르소나 허용 여부가 업데이트되었습니다.',
      },
    },
    { status: 200 }
  );
}

// ============================
// DELETE /api/inheritance
// ============================

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();
  const { userId, error: authError } = await authenticate(
    supabase,
    request.headers.get('authorization')
  );
  if (authError || !userId) {
    return NextResponse.json({ success: false, error: authError }, { status: 401 });
  }

  const { data: setting } = await supabase
    .from('mcw_inheritance_settings')
    .select('id, heir_email')
    .eq('owner_id', userId)
    .maybeSingle();

  if (!setting) {
    return NextResponse.json(
      { success: false, error: '지정된 피상속인이 없습니다.' },
      { status: 404 }
    );
  }

  // 페르소나 설정 먼저 삭제
  await supabase
    .from('mcw_inheritance_persona_settings')
    .delete()
    .eq('inheritance_id', setting.id);

  const { error: deleteError } = await supabase
    .from('mcw_inheritance_settings')
    .delete()
    .eq('id', setting.id);

  if (deleteError) {
    console.error('[DELETE /api/inheritance]', deleteError);
    return NextResponse.json(
      { success: false, error: '피상속인 해제에 실패했습니다.' },
      { status: 500 }
    );
  }

  await supabase.from('mcw_inheritance_event_logs').insert({
    inheritance_id: setting.id,
    event_type: 'heir_removed',
    actor_id: userId,
    target_email: setting.heir_email,
    metadata: {},
    created_at: new Date().toISOString(),
  });

  void request; // satisfy lint — no body needed
  return NextResponse.json(
    { success: true, data: { message: '피상속인 지정이 해제되었습니다.' } },
    { status: 200 }
  );
}
