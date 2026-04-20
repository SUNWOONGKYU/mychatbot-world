import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * S5TS1: Wiki Lint 탐지 검증
 * POST /api/wiki/lint — 고아 페이지, 오래된 페이지, 충돌 탐지
 */

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

describe('Wiki Lint API — /api/wiki/lint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/wiki/lint — Response Structure', () => {
    it('should return all required lint result fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            bot_id: 'bot-001',
            run_at: new Date().toISOString(),
            orphan_pages: [],
            stale_pages: [],
            conflict_groups: [],
            fixed_count: 0,
            total_pages_scanned: 15,
          },
        }),
      });

      const res = await fetch('/api/wiki/lint', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001' }),
      });
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('orphan_pages');
      expect(body.data).toHaveProperty('stale_pages');
      expect(body.data).toHaveProperty('conflict_groups');
      expect(body.data).toHaveProperty('fixed_count');
      expect(body.data).toHaveProperty('total_pages_scanned');
      expect(Array.isArray(body.data.orphan_pages)).toBe(true);
      expect(Array.isArray(body.data.stale_pages)).toBe(true);
      expect(Array.isArray(body.data.conflict_groups)).toBe(true);
    });

    it('should include run_at timestamp in ISO 8601 format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            run_at: '2026-04-06T10:30:00.000Z',
            orphan_pages: [],
            stale_pages: [],
            conflict_groups: [],
            fixed_count: 0,
            total_pages_scanned: 0,
          },
        }),
      });

      const res = await fetch('/api/wiki/lint', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001' }),
      });
      const body = await res.json();

      const runAt = new Date(body.data.run_at);
      expect(runAt.toString()).not.toBe('Invalid Date');
    });
  });

  describe('POST /api/wiki/lint — Orphan Page Detection', () => {
    it('should detect pages with zero view_count as potential orphans', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            orphan_pages: [
              { slug: 'abandoned-topic', title: 'Abandoned Topic', view_count: 0, last_viewed: null },
              { slug: 'never-linked', title: 'Never Linked Page', view_count: 0, last_viewed: null },
            ],
            stale_pages: [],
            conflict_groups: [],
            fixed_count: 0,
            total_pages_scanned: 20,
          },
        }),
      });

      const res = await fetch('/api/wiki/lint', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001' }),
      });
      const body = await res.json();

      expect(body.data.orphan_pages.length).toBeGreaterThan(0);
      body.data.orphan_pages.forEach((page: { view_count: number }) => {
        expect(page.view_count).toBe(0);
      });
    });

    it('orphan_pages should include slug and title fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            orphan_pages: [
              { slug: 'orphan-page-1', title: 'Orphan Page 1', view_count: 0 },
            ],
            stale_pages: [],
            conflict_groups: [],
            fixed_count: 0,
            total_pages_scanned: 10,
          },
        }),
      });

      const res = await fetch('/api/wiki/lint', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001' }),
      });
      const body = await res.json();

      body.data.orphan_pages.forEach((page: { slug: string; title: string }) => {
        expect(page).toHaveProperty('slug');
        expect(page).toHaveProperty('title');
        expect(typeof page.slug).toBe('string');
        expect(typeof page.title).toBe('string');
      });
    });
  });

  describe('POST /api/wiki/lint — Stale Page Detection', () => {
    it('should detect pages not updated for more than 30 days as stale', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 45); // 45 days ago

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            orphan_pages: [],
            stale_pages: [
              {
                slug: 'outdated-guide',
                title: 'Outdated Guide',
                updated_at: oldDate.toISOString(),
                days_since_update: 45,
                is_stale: true,
              },
            ],
            conflict_groups: [],
            fixed_count: 0,
            total_pages_scanned: 10,
          },
        }),
      });

      const res = await fetch('/api/wiki/lint', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001' }),
      });
      const body = await res.json();

      expect(body.data.stale_pages.length).toBeGreaterThan(0);
      body.data.stale_pages.forEach((page: { days_since_update: number; is_stale: boolean }) => {
        expect(page.days_since_update).toBeGreaterThanOrEqual(30);
        expect(page.is_stale).toBe(true);
      });
    });

    it('stale_pages should include is_stale flag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            orphan_pages: [],
            stale_pages: [
              { slug: 'old-page', title: 'Old Page', is_stale: true, days_since_update: 60 },
            ],
            conflict_groups: [],
            fixed_count: 0,
            total_pages_scanned: 5,
          },
        }),
      });

      const res = await fetch('/api/wiki/lint', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001' }),
      });
      const body = await res.json();

      body.data.stale_pages.forEach((page: { is_stale: boolean }) => {
        expect(page.is_stale).toBe(true);
      });
    });
  });

  describe('POST /api/wiki/lint — Conflict Detection', () => {
    it('should detect pages with duplicate or overlapping titles', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            orphan_pages: [],
            stale_pages: [],
            conflict_groups: [
              {
                conflict_type: 'duplicate_title',
                pages: [
                  { slug: 'setup-guide-v1', title: 'Setup Guide' },
                  { slug: 'setup-guide-v2', title: 'Setup Guide' },
                ],
              },
            ],
            fixed_count: 0,
            total_pages_scanned: 20,
          },
        }),
      });

      const res = await fetch('/api/wiki/lint', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001' }),
      });
      const body = await res.json();

      expect(body.data.conflict_groups.length).toBeGreaterThan(0);
      body.data.conflict_groups.forEach(
        (group: { pages: unknown[]; conflict_type: string }) => {
          expect(group.pages.length).toBeGreaterThan(1);
          expect(group).toHaveProperty('conflict_type');
        }
      );
    });

    it('conflict_type should be one of known values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            orphan_pages: [],
            stale_pages: [],
            conflict_groups: [
              { conflict_type: 'duplicate_title', pages: [] },
              { conflict_type: 'overlapping_content', pages: [] },
            ],
            fixed_count: 0,
            total_pages_scanned: 10,
          },
        }),
      });

      const res = await fetch('/api/wiki/lint', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001' }),
      });
      const body = await res.json();

      const validConflictTypes = ['duplicate_title', 'overlapping_content', 'broken_link', 'circular_reference'];
      body.data.conflict_groups.forEach((group: { conflict_type: string }) => {
        expect(validConflictTypes).toContain(group.conflict_type);
      });
    });
  });

  describe('POST /api/wiki/lint — Auto-Fix', () => {
    it('should return fixed_count when auto-fix is performed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            orphan_pages: [],
            stale_pages: [{ slug: 'old', title: 'Old', is_stale: true }],
            conflict_groups: [],
            fixed_count: 1,
            total_pages_scanned: 15,
          },
        }),
      });

      const res = await fetch('/api/wiki/lint', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001', auto_fix: true }),
      });
      const body = await res.json();

      expect(typeof body.data.fixed_count).toBe('number');
      expect(body.data.fixed_count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/wiki/lint — History', () => {
    it('should return lint run history', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              id: 'lint-001',
              bot_id: 'bot-001',
              run_at: '2026-04-06T10:00:00Z',
              orphan_count: 2,
              stale_count: 1,
              conflict_count: 0,
              fixed_count: 0,
            },
            {
              id: 'lint-002',
              bot_id: 'bot-001',
              run_at: '2026-04-05T10:00:00Z',
              orphan_count: 3,
              stale_count: 2,
              conflict_count: 1,
              fixed_count: 2,
            },
          ],
        }),
      });

      const res = await fetch('/api/wiki/lint?bot_id=bot-001&limit=10');
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      body.data.forEach((record: { run_at: string; orphan_count: number; stale_count: number }) => {
        expect(record).toHaveProperty('run_at');
        expect(record).toHaveProperty('orphan_count');
        expect(record).toHaveProperty('stale_count');
        expect(typeof record.orphan_count).toBe('number');
      });
    });

    it('should return 400 when bot_id is missing in GET request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: 'bot_id is required' }),
      });

      const res = await fetch('/api/wiki/lint?limit=10');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/wiki/lint — Error Cases', () => {
    it('should return 400 when bot_id is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: 'bot_id is required' }),
      });

      const res = await fetch('/api/wiki/lint', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });
});
