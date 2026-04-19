/**
 * @task S4BA7
 * @description 관리자 스킬 관리 API
 *
 * Endpoints:
 * - GET    /api/admin/skills   전체 스킬 목록 (설치 건수 포함)
 * - POST   /api/admin/skills   새 스킬 등록 (향후 확장용)
 * - DELETE /api/admin/skills   스킬 삭제 또는 비활성화
 *
 * GET 응답:
 *  스킬 목록 + 각 스킬별 설치(skill_installations) 건수
 *
 * POST 요청 바디:
 *  { name, description, category, price?, metadata? }
 *
 * DELETE 요청 바디:
 *  { skillId, mode?: 'soft' | 'hard' }  (기본값: soft = is_active: false)
 *
 * 보안:
 * - requireAdmin() — X-Admin-Key 헤더 검증
 * - service_role 키로 RLS 우회
 */


import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminSupabase } from '@/lib/admin-auth';
import { rateLimit, RATE_ADMIN } from '@/lib/rate-limiter';

// ── 타입 ──────────────────────────────────────────────────────────────────

interface SkillRow {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  is_active?: boolean;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

interface PostBody {
  name: string;
  description?: string;
  category?: string;
  price?: number;
  metadata?: Record<string, unknown>;
}

interface DeleteBody {
  skillId: string;
  mode?: 'soft' | 'hard';
}

// ── GET /api/admin/skills ─────────────────────────────────────────────────

/**
 * 전체 스킬 목록 조회 (설치 건수 포함)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getAdminSupabase();

    // 스킬 목록 조회 — 페이지네이션 (기본 100건, 최대 500건)
    const { searchParams } = new URL(req.url);
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') ?? '100', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10));

    const { data: skills, error: skillsError } = await (supabase as any)
      .from('mcw_skills')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (skillsError) {
      console.error('[GET /api/admin/skills] Skills query error:', skillsError.message);
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }

    // 스킬별 설치 건수 집계 (skill_installations 테이블)
    const { data: installCounts, error: installError } = await (supabase as any)
      .from('skill_installations')
      .select('skill_id');

    if (installError) {
      console.warn('[GET /api/admin/skills] Install count warn:', installError.message);
    }

    // 설치 건수 매핑
    const installMap = new Map<string, number>();
    (installCounts ?? []).forEach((row: { skill_id: string }) => {
      installMap.set(row.skill_id, (installMap.get(row.skill_id) ?? 0) + 1);
    });

    const result = (skills ?? []).map((skill: SkillRow) => ({
      ...skill,
      installCount: installMap.get(skill.id) ?? 0,
    }));

    return NextResponse.json({ skills: result, total: result.length });
  } catch (err) {
    console.error('[GET /api/admin/skills] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/admin/skills ────────────────────────────────────────────────

/**
 * 새 스킬 등록 (향후 확장용)
 * Body: { name, description?, category?, price?, metadata? }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getAdminSupabase();

    let body: PostBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { name, description, category, price, metadata } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const { data, error } = await (supabase as any)
      .from('mcw_skills')
      .insert({
        name: name.trim(),
        description: description ?? null,
        category: category ?? null,
        price: price ?? 0,
        metadata: metadata ?? null,
        is_active: true,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/admin/skills] Insert error:', error.message);
      return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
    }

    return NextResponse.json({ skill: data, message: '스킬이 등록되었습니다.' }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/skills] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE /api/admin/skills ──────────────────────────────────────────────

/**
 * 스킬 삭제 또는 비활성화
 * Body: { skillId, mode?: 'soft' | 'hard' }
 * - soft (기본값): is_active = false (복구 가능)
 * - hard: 레코드 영구 삭제
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getAdminSupabase();

    let body: DeleteBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { skillId, mode = 'soft' } = body;

    if (!skillId || typeof skillId !== 'string') {
      return NextResponse.json({ error: 'skillId is required' }, { status: 400 });
    }

    // 스킬 존재 확인
    const { data: skill, error: fetchError } = await (supabase as any)
      .from('mcw_skills')
      .select('id, name')
      .eq('id', skillId)
      .maybeSingle();

    if (fetchError) {
      console.error('[DELETE /api/admin/skills] Fetch error:', fetchError.message);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    if (mode === 'hard') {
      // 영구 삭제
      const { error: deleteError } = await (supabase as any)
        .from('mcw_skills')
        .delete()
        .eq('id', skillId);

      if (deleteError) {
        console.error('[DELETE /api/admin/skills] Hard delete error:', deleteError.message);
        return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
      }

      return NextResponse.json({
        skillId,
        mode: 'hard',
        message: `스킬 "${skill.name}"이(가) 영구 삭제되었습니다.`,
      });
    } else {
      // 소프트 삭제 (비활성화)
      const { error: updateError } = await (supabase as any)
        .from('mcw_skills')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', skillId);

      if (updateError) {
        console.error('[DELETE /api/admin/skills] Soft delete error:', updateError.message);
        return NextResponse.json({ error: 'Failed to deactivate skill' }, { status: 500 });
      }

      return NextResponse.json({
        skillId,
        mode: 'soft',
        message: `스킬 "${skill.name}"이(가) 비활성화되었습니다.`,
      });
    }
  } catch (err) {
    console.error('[DELETE /api/admin/skills] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
