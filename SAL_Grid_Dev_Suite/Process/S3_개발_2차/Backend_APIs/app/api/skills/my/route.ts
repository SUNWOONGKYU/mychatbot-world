/**
 * @task S3BA2
 * @description 내 스킬 목록 API
 *
 * GET /api/skills/my — 현재 사용자가 설치한 스킬 목록
 *
 * 응답 포함:
 *   - 설치일 (installed_at)
 *   - 실행 횟수 (execution_count)
 *   - 마지막 사용일 (last_used_at)
 *   - 스킬 정의 메타데이터 (name, icon, category 등)
 *
 * 인증: Supabase Auth 세션 필요
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

// ============================
// 타입 정의
// ============================

interface SkillDefMeta {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  type: string;
  isFree: boolean;
  price: number;
  tags?: string[];
}

interface MySkillItem {
  installation_id: string;
  skill_id: string;
  installed_at: string;
  status: string;
  execution_count: number;
  last_used_at: string | null;
  skill_meta: SkillDefMeta | null;
}

// ============================
// Supabase 클라이언트
// ============================

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

function getSupabaseUser(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

// ============================
// 스킬 정의 로더 (단건)
// ============================

async function loadSkillMeta(skillId: string): Promise<SkillDefMeta | null> {
  const filePath = path.join(
    process.cwd(),
    'skill-market',
    'prompt-skills',
    `${skillId}.json`
  );
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const def = JSON.parse(raw);
    // 필요한 필드만 추출 (systemPrompt 등 민감 정보 제외)
    return {
      id: def.id,
      name: def.name,
      icon: def.icon,
      category: def.category,
      description: def.description,
      type: def.type,
      isFree: def.isFree,
      price: def.price,
      tags: def.tags,
    };
  } catch {
    return null;
  }
}

// ============================
// GET /api/skills/my
// ============================

export async function GET(req: NextRequest) {
  try {
    // 인증 확인
    const supabaseUser = getSupabaseUser(req);
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    // 설치된 스킬 목록 조회
    const { data: installations, error: installError } = await supabase
      .from('skill_installations')
      .select('id, skill_id, skill_name, installed_at, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('installed_at', { ascending: false });

    if (installError) {
      console.error('[GET /api/skills/my] install query error:', installError);
      throw installError;
    }

    if (!installations || installations.length === 0) {
      return NextResponse.json({ skills: [], total: 0 });
    }

    const skillIds = installations.map((i) => i.skill_id);

    // 실행 횟수 + 마지막 사용일 집계
    const { data: executions, error: execError } = await supabase
      .from('skill_executions')
      .select('skill_id, executed_at')
      .eq('user_id', user.id)
      .in('skill_id', skillIds)
      .eq('status', 'success');

    if (execError) {
      console.error('[GET /api/skills/my] exec query error:', execError);
      // 실행 통계 실패 시 빈 값으로 진행
    }

    // 집계 맵 생성
    const execMap: Record<string, { count: number; lastUsed: string | null }> =
      {};
    for (const exec of executions ?? []) {
      if (!execMap[exec.skill_id]) {
        execMap[exec.skill_id] = { count: 0, lastUsed: null };
      }
      execMap[exec.skill_id].count += 1;
      const current = execMap[exec.skill_id].lastUsed;
      if (!current || exec.executed_at > current) {
        execMap[exec.skill_id].lastUsed = exec.executed_at;
      }
    }

    // 스킬 메타데이터 병렬 로드
    const metaResults = await Promise.all(
      installations.map((inst) => loadSkillMeta(inst.skill_id))
    );

    // 최종 결과 조합
    const skills: MySkillItem[] = installations.map((inst, idx) => {
      const stats = execMap[inst.skill_id] ?? { count: 0, lastUsed: null };
      return {
        installation_id: inst.id,
        skill_id: inst.skill_id,
        installed_at: inst.installed_at,
        status: inst.status,
        execution_count: stats.count,
        last_used_at: stats.lastUsed,
        skill_meta: metaResults[idx],
      };
    });

    return NextResponse.json({ skills, total: skills.length });
  } catch (error) {
    console.error('[GET /api/skills/my] error:', error);
    return NextResponse.json(
      { error: '내 스킬 목록을 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
