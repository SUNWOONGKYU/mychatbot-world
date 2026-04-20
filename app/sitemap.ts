import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mychatbot.world';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths: Array<{ path: string; priority: number; change: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
    { path: '/',                 priority: 1.0, change: 'daily' },
    { path: '/marketplace',      priority: 0.9, change: 'daily' },
    { path: '/community',        priority: 0.8, change: 'hourly' },
    { path: '/skills',           priority: 0.8, change: 'weekly' },
    { path: '/jobs',             priority: 0.7, change: 'daily' },
    { path: '/guest',            priority: 0.6, change: 'monthly' },
    { path: '/customer-service', priority: 0.5, change: 'yearly' },
    { path: '/terms',            priority: 0.3, change: 'yearly' },
    { path: '/privacy',          priority: 0.3, change: 'yearly' },
    { path: '/login',            priority: 0.2, change: 'yearly' },
    { path: '/signup',           priority: 0.2, change: 'yearly' },
  ];

  return staticPaths.map(({ path, priority, change }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: change,
    priority,
  }));
}
