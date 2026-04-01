/**
 * @task S3BA2
 * @description 스킬 마켓 목록/검색 API
 *
 * GET /api/skills — 스킬 목록 + 검색 + 카테고리 필터
 *
 * 쿼리 파라미터:
 *   q         — 검색어 (이름, 설명, 태그 대상)
 *   category  — 카테고리 필터
 *
 * 응답: SkillCatalogItem[] (설치 수, 평균 평점 포함)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

// ============================
// 타입 정의
// ============================

export interface PromptSkillDef {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  type: 'prompt';
  isFree: boolean;
  price: number;
  systemPrompt: string;
  examples?: string[];
  tags?: string[];
}

export interface SkillCatalogItem extends PromptSkillDef {
  install_count: number;
  avg_rating: number | null;
  review_count: number;
}

// ============================
// Supabase 서버 클라이언트
// ============================

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// ============================
// 스킬 정의 파일 로더
// ============================

/**
 * skill-market/prompt-skills/*.json 파일을 모두 로드하여 반환
 */
async function loadPromptSkills(): Promise<PromptSkillDef[]> {
  const skillsDir = path.join(process.cwd(), 'skill-market', 'prompt-skills');
  let files: string[] = [];

  try {
    files = await fs.readdir(skillsDir);
  } catch {
    // 디렉터리가 없으면 빈 배열 반환
    return [];
  }

  const skills: PromptSkillDef[] = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(path.join(skillsDir, file), 'utf-8');
      const skill = JSON.parse(raw) as PromptSkillDef;
      skills.push(skill);
    } catch {
      // 개별 파일 파싱 실패 시 건너뜀
    }
  }

  return skills;
}

// ============================
// GET /api/skills
// ============================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') ?? '').toLowerCase().trim();
    const category = searchParams.get('category')?.trim();

    // 1. 스킬 정의 파일 로드
    const allSkills = await loadPromptSkills();

    // 2. 검색 + 카테고리 필터
    let filtered = allSkills;

    if (query) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          (s.tags ?? []).some((t) => t.toLowerCase().includes(query))
      );
    }

    if (category) {
      filtered = filtered.filter(
        (s) => s.category.toLowerCase() === category.toLowerCase()
      );
    }

    // 3. 설치 수 / 평균 평점 집계
    const supabase = getSupabaseServer();

    // skill_installations: 설치 수
    const { data: installCounts } = await supabase
      .from('skill_installations')
      .select('skill_id')
      .eq('status', 'active');

    const installCountMap: Record<string, number> = {};
    for (const row of installCounts ?? []) {
      installCountMap[row.skill_id] = (installCountMap[row.skill_id] ?? 0) + 1;
    }

    // skill_reviews: 평균 평점 + 리뷰 수
    const { data: reviews } = await supabase
      .from('skill_reviews')
      .select('skill_id, rating');

    const ratingMap: Record<string, { sum: number; count: number }> = {};
    for (const row of reviews ?? []) {
      if (!ratingMap[row.skill_id]) {
        ratingMap[row.skill_id] = { sum: 0, count: 0 };
      }
      ratingMap[row.skill_id].sum += row.rating;
      ratingMap[row.skill_id].count += 1;
    }

    // 4. 결과 조합
    const result: SkillCatalogItem[] = filtered.map((skill) => {
      const ratingData = ratingMap[skill.id];
      return {
        ...skill,
        install_count: installCountMap[skill.id] ?? 0,
        avg_rating: ratingData
          ? Math.round((ratingData.sum / ratingData.count) * 10) / 10
          : null,
        review_count: ratingData?.count ?? 0,
      };
    });

    return NextResponse.json({ skills: result, total: result.length });
  } catch (error) {
    console.error('[GET /api/skills] error:', error);
    return NextResponse.json(
      { error: '스킬 목록을 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
