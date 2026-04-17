/**
 * Skills Marketplace 데이터 레이어
 * S4BA8: SKILLS[] 하드코딩 제거 → /api/skills DB 조회로 전환
 */

export interface SkillItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  systemPrompt: string;
  isFree: boolean;
  price?: number;
  installs: number;
  rating: number;
}

export interface SkillPreset {
  label: string;
  icon: string;
  skills: string[];
}

export const SKILL_CATEGORIES = ['전체', '분석', '보안', '관리', '지식', 'UI', '비즈니스', '연동'] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

/**
 * /api/skills 엔드포인트에서 스킬 목록을 가져와 SkillItem[] 형태로 반환
 * (브라우저 전용 — SSR 환경에서는 직접 DB 쿼리 권장)
 */
export async function fetchSkillsFromAPI(opts?: { q?: string; category?: string }): Promise<SkillItem[]> {
  const params = new URLSearchParams();
  if (opts?.q) params.set('q', opts.q);
  if (opts?.category) params.set('category', opts.category);

  const url = `/api/skills${params.toString() ? `?${params}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  // SkillCatalogItem → SkillItem 매핑
  return (data.skills ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    icon: s.icon ?? '',
    category: s.category ?? '',
    description: s.description ?? '',
    systemPrompt: s.systemPrompt ?? '',
    isFree: s.isFree ?? (s.price === 0),
    price: s.price ?? 0,
    installs: s.install_count ?? 0,
    rating: s.avg_rating ?? 4.0,
  }));
}

export const SKILL_PRESETS: Record<string, SkillPreset> = {
  avatar:     { label: '분신 아바타 기본',  icon: '🤖', skills: ['emoji-react', 'multilang', 'faq-auto', 'tts-basic'] },
  business:   { label: '비즈니스 상담',      icon: '💼', skills: ['reservation', 'lead-collect', 'survey', 'email-send'] },
  counseling: { label: '심리 상담',          icon: '💙', skills: ['sentiment', 'emoji-react', 'multilang', 'survey'] },
  support:    { label: '고객 지원',          icon: '🎧', skills: ['faq-auto', 'profanity-filter', 'spam-block', 'email-send'] },
  commerce:   { label: '커머스 운영',        icon: '🛍️', skills: ['reservation', 'coupon', 'lead-collect', 'kakao-noti'] },
  helper:     { label: 'AI 도우미',          icon: '✨', skills: ['faq-auto', 'stats-analysis', 'backup', 'google-cal'] },
};

/* ── localStorage 헬퍼 (브라우저 전용) ── */

function getCurrentBotKey(): string {
  if (typeof window === 'undefined') return 'default_default';
  const botId = localStorage.getItem('mcw_current_bot') ?? (() => {
    try {
      const bots = JSON.parse(localStorage.getItem('mcw_bots') ?? '[]') as { id: string }[];
      return bots[0]?.id ?? 'default';
    } catch { return 'default'; }
  })();
  const personaId = (() => {
    try {
      const bots = JSON.parse(localStorage.getItem('mcw_bots') ?? '[]') as { id: string; personas?: { id: string }[] }[];
      const bot = bots.find(b => b.id === botId);
      return bot?.personas?.[0]?.id ?? 'default';
    } catch { return 'default'; }
  })();
  return `mcw_skills_${botId}_${personaId}`;
}

export function getInstalledIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(getCurrentBotKey()) ?? '[]') as string[];
  } catch { return []; }
}

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const mod = await import('@/lib/supabase');
    const { data } = await mod.default.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export function installSkillById(skillId: string): void {
  // 로컬 즉시 반영
  const list = getInstalledIds();
  if (!list.includes(skillId)) {
    list.push(skillId);
    localStorage.setItem(getCurrentBotKey(), JSON.stringify(list));
  }
  // 서버 영속화 (fire-and-forget)
  (async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      await fetch('/api/skills/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skill_id: skillId }),
      });
    } catch {/* 네트워크 실패 시 무시 — 다음 세션에 재시도 */}
  })();
}

export function removeSkillById(skillId: string): void {
  const list = getInstalledIds().filter(id => id !== skillId);
  localStorage.setItem(getCurrentBotKey(), JSON.stringify(list));
  (async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      await fetch('/api/skills/install', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skill_id: skillId }),
      });
    } catch {/* 무시 */}
  })();
}

export function isSkillInstalled(skillId: string): boolean {
  return getInstalledIds().includes(skillId);
}

export function getInstalledSkills(): SkillItem[] {
  // SKILLS 하드코딩 제거 (S4BA8) — 대신 /api/skills/my 사용
  return [];
}

/* ── 별점 문자열 생성 ── */
export function buildStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}
