/**
 * @task S3BA2, S4BA8
 * @description 스킬 마켓 목록/검색 API
 *
 * GET /api/skills — 스킬 목록 + 검색 + 카테고리 필터
 *
 * 쿼리 파라미터:
 *   q         — 검색어 (이름, 설명, 태그 대상)
 *   category  — 카테고리 필터
 *
 * 응답: SkillCatalogItem[] (설치 수, 평균 평점 포함)
 *
 * S4BA8: JSON 파일 로더 → mcw_skills 테이블 DB 조회로 전환
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================
// 타입 정의
// ============================

export interface PromptSkillDef {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  type: 'prompt' | 'integration';
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
// GET /api/skills
// ============================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') ?? '').toLowerCase().trim();
    const category = searchParams.get('category')?.trim();

    const supabase = getSupabaseServer();

    // 1. mcw_skills 테이블에서 ready-made 스킬 조회
    let dbQuery = supabase
      .from('mcw_skills')
      .select('id, name, description, category, price, metadata, skill_content, use_count')
      .eq('is_active', true)
      .eq('origin', 'ready-made');

    if (category) {
      dbQuery = dbQuery.ilike('category', category);
    }

    const { data: skillRows, error } = await dbQuery;

    if (error) throw error;

    // 2. DB rows → PromptSkillDef 변환
    let allSkills: PromptSkillDef[] = (skillRows ?? []).map((row: any) => ({
      id: row.metadata?.legacy_id ?? row.id,
      name: row.name,
      icon: row.metadata?.icon ?? '',
      category: row.category ?? '',
      description: row.description ?? '',
      type: (row.metadata?.type ?? 'prompt') as 'prompt' | 'integration',
      isFree: row.metadata?.isFree ?? (Number(row.price) === 0),
      price: Number(row.price) ?? 0,
      systemPrompt: row.skill_content ?? '',
      examples: row.metadata?.examples ?? [],
      tags: row.metadata?.tags ?? [],
    }));

    // 3. 검색 필터 (카테고리는 DB 쿼리에서 처리, 텍스트 검색은 클라이언트 필터)
    if (query) {
      allSkills = allSkills.filter(
        s =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          (s.tags ?? []).some((t: string) => t.toLowerCase().includes(query))
      );
    }

    // 4. 설치 수 / 평균 평점 집계 (skill_id = metadata.legacy_id)
    const legacyIds = allSkills.map(s => s.id);

    const { data: installCounts } = await supabase
      .from('skill_installations')
      .select('skill_id')
      .eq('status', 'active')
      .in('skill_id', legacyIds);

    const installCountMap: Record<string, number> = {};
    for (const row of installCounts ?? []) {
      installCountMap[row.skill_id] = (installCountMap[row.skill_id] ?? 0) + 1;
    }

    const { data: reviews } = await supabase
      .from('skill_reviews')
      .select('skill_id, rating')
      .in('skill_id', legacyIds);

    const ratingMap: Record<string, { sum: number; count: number }> = {};
    for (const row of reviews ?? []) {
      if (!ratingMap[row.skill_id]) {
        ratingMap[row.skill_id] = { sum: 0, count: 0 };
      }
      ratingMap[row.skill_id].sum += row.rating;
      ratingMap[row.skill_id].count += 1;
    }

    // 5. 결과 조합
    const result: SkillCatalogItem[] = allSkills.map(skill => {
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

    return NextResponse.json({ skills: result, total: result.length }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('[GET /api/skills] error:', error);
    return NextResponse.json(
      { error: '스킬 목록을 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
