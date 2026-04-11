/**
 * @task S5FE6 — 마이페이지 프로필 API
 * GET    /api/auth/me — Bearer 토큰으로 유저 프로필 조회
 * PATCH  /api/auth/me — 유저 프로필 업데이트 (display_name, bio, notification_enabled, language)
 * DELETE /api/auth/me — 계정 삭제
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 토큰으로 유저 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    // profiles 테이블에서 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 프로필이 없으면 기본 데이터 반환
    if (profileError || !profile) {
      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          bio: null,
          avatar_url: null,
          created_at: user.created_at,
          notification_enabled: true,
          language: 'ko',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        email: user.email,
        full_name: profile.display_name || user.email?.split('@')[0] || '',
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        notification_enabled: profile.notification_enabled ?? true,
        language: profile.language ?? 'ko',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.full_name !== undefined) updates.display_name = body.full_name;
  if (body.bio !== undefined) updates.bio = body.bio;
  if (body.notification_enabled !== undefined) updates.notification_enabled = body.notification_enabled;
  if (body.language !== undefined) updates.language = body.language;

  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...updates })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      full_name: profile?.display_name ?? '',
      bio: profile?.bio ?? null,
      avatar_url: profile?.avatar_url ?? null,
      notification_enabled: profile?.notification_enabled ?? true,
      language: profile?.language ?? 'ko',
    },
  });
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
  }

  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
