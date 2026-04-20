import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mychatbot.world';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPaths: Array<{ path: string; priority: number; change: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
    { path: '/',                 priority: 1.0, change: 'daily' },
    { path: '/marketplace',      priority: 0.9, change: 'daily' },
    { path: '/community',        priority: 0.8, change: 'hourly' },
    { path: '/skills',           priority: 0.8, change: 'weekly' },
    { path: '/jobs',             priority: 0.7, change: 'daily' },
    { path: '/guest',             priority: 0.6, change: 'monthly' },
    { path: '/customer-service', priority: 0.5, change: 'yearly' },
    { path: '/terms',            priority: 0.3, change: 'yearly' },
    { path: '/privacy',          priority: 0.3, change: 'yearly' },
    { path: '/refund',           priority: 0.3, change: 'yearly' },
    { path: '/login',            priority: 0.2, change: 'yearly' },
    { path: '/signup',           priority: 0.2, change: 'yearly' },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map(({ path, priority, change }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: change,
    priority,
  }));

  // 공개 봇 동적 추가 — Supabase 실패 시 정적만 반환 (빌드 안전)
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return staticEntries;
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await client
      .from('mcw_bots')
      .select('url_slug, updated_at')
      .eq('is_public', true)
      .limit(500);
    if (!Array.isArray(data)) return staticEntries;
    const dyn: MetadataRoute.Sitemap = data
      .filter((r) => typeof r.url_slug === 'string')
      .map((r) => ({
        url: `${SITE_URL}/bot/${r.url_slug}`,
        lastModified: r.updated_at ? new Date(r.updated_at) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    return [...staticEntries, ...dyn];
  } catch {
    return staticEntries;
  }
}
