/**
 * @task S4FE3
 * @description Marketplace 페이지 — 목록, 상세, 업로드
 * Route: /marketplace/[id]
 * API: GET /api/Backend_APIs/marketplace?action=detail&id=:id
 * SSR(서버 컴포넌트) — SEO 최적화
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MarketplaceDetailClient from './detail-client';

// ── 타입 ──────────────────────────────────────────────────────────

export interface SkillDetail {
  id: string;
  skill_name: string;
  name?: string;
  description: string;
  long_description?: string;
  creator_name?: string;
  author?: string;
  category: string;
  price: number;
  install_count: number;
  rating?: number;
  rating_count?: number;
  is_free?: boolean;
  tags?: string[];
  thumbnail_url?: string | null;
  plans?: SubscriptionPlan[];
  reviews?: Review[];
  related?: RelatedSkill[];
  created_at?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

export interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface RelatedSkill {
  id: string;
  skill_name: string;
  name?: string;
  category: string;
  price: number;
  rating?: number;
}

// ── 서버 사이드 데이터 페치 ────────────────────────────────────────

async function fetchSkillDetail(id: string): Promise<SkillDetail | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const res = await fetch(
      `${baseUrl}/api/Backend_APIs/marketplace?action=detail&id=${encodeURIComponent(id)}`,
      { next: { revalidate: 60 } },
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data?.data ?? data ?? null;
  } catch {
    return null;
  }
}

// ── 메타데이터 생성 (SSR) ─────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const skill = await fetchSkillDetail((await params).id);
  if (!skill) {
    return { title: '스킬을 찾을 수 없습니다 — CoCoBot' };
  }
  const title = skill.skill_name || skill.name || '스킬 상세';
  return {
    title: `${title} — CoCoBot`,
    description: skill.description,
  };
}

// ── 서버 컴포넌트 (SSR) ────────────────────────────────────────────

export default async function MarketplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const skill = await fetchSkillDetail((await params).id);

  if (!skill) {
    notFound();
  }

  return <MarketplaceDetailClient skill={skill} />;
}
