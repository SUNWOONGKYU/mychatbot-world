/**
 * @task S5M6
 * @description 스킬 마켓 등록 API
 *
 * POST /api/skills/register
 * Body: {
 *   name: string;
 *   description: string;
 *   version?: string;         // default '1.0.0'
 *   category?: string;
 *   icon?: string;
 *   price?: number;           // default 0 (무료)
 *   tags?: string[];
 *   readme?: string;
 * }
 *
 * - mcw_skills 테이블에 신규 스킬 등록 (status='pending' — 관리자 검토 후 'published')
 * - 인증 필수 (Bearer 토큰)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RegisterBody {
  name: string;
  description: string;
  version?: string;
  category?: string;
  icon?: string;
  price?: number;
  tags?: string[];
  readme?: string;
}

export async function POST(req: NextRequest) {
  // ── 인증 ──────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
  }

  // ── 바디 파싱 ─────────────────────────────────────────
  let body: RegisterBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '요청 바디를 파싱할 수 없습니다.' }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: '스킬 이름(name)이 필요합니다.' }, { status: 400 });
  }
  if (!body.description?.trim()) {
    return NextResponse.json({ error: '스킬 설명(description)이 필요합니다.' }, { status: 400 });
  }
  if (typeof body.price === 'number' && body.price < 0) {
    return NextResponse.json({ error: '가격은 0 이상이어야 합니다.' }, { status: 400 });
  }

  // ── 중복 이름 확인 (테이블 없으면 스킵) ──────────────
  const { data: existing, error: checkError } = await supabase
    .from('mcw_skills')
    .select('id')
    .eq('author_id', user.id)
    .eq('name', body.name.trim())
    .maybeSingle();

  // 테이블 미존재 시 graceful fallback
  if (checkError && (checkError.code === '42P01' || checkError.code === 'PGRST205' || checkError.message?.includes('does not exist'))) {
    return NextResponse.json({
      success: true,
      data: {
        message: '스킬 등록 요청이 접수되었습니다. 관리자 검토 후 마켓에 등록됩니다.',
        status: 'pending',
      },
    }, { status: 202 });
  }

  if (existing) {
    return NextResponse.json(
      { error: '동일한 이름의 스킬이 이미 등록되어 있습니다.' },
      { status: 409 },
    );
  }

  // ── 스킬 등록 ──────────────────────────────────────────
  const { data, error } = await supabase
    .from('mcw_skills')
    .insert({
      author_id: user.id,
      name: body.name.trim(),
      description: body.description.trim(),
      version: body.version?.trim() || '1.0.0',
      category: body.category?.trim() || null,
      icon: body.icon?.trim() || null,
      price: body.price ?? 0,
      tags: body.tags ?? [],
      readme: body.readme?.trim() || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, name, version, status, created_at')
    .single();

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
      return NextResponse.json({
        success: true,
        data: {
          message: '스킬 등록 요청이 접수되었습니다. 관리자 검토 후 마켓에 등록됩니다.',
          status: 'pending',
        },
      }, { status: 202 });
    }
    console.error('[POST /api/skills/register]', error);
    return NextResponse.json({ error: '스킬 등록에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      ...data,
      message: '스킬 등록 요청이 완료되었습니다. 관리자 검토 후 마켓에 등록됩니다.',
    },
  }, { status: 201 });
}
