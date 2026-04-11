/**
 * @task H1 — 아바타 업로드 API
 * POST /api/auth/me/avatar — multipart/form-data로 아바타 이미지 업로드
 * Supabase Storage 'avatars' 버킷에 저장 후 profiles.avatar_url 업데이트
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: '유효하지 않은 토큰' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'file 필드 필수' }, { status: 400 });

    const ext = file.name.split('.').pop() || 'png';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, arrayBuffer, { contentType: file.type, upsert: true });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = urlData.publicUrl;

    await supabase.from('profiles').upsert({ id: user.id, avatar_url: avatarUrl });

    return NextResponse.json({ success: true, avatar_url: avatarUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
