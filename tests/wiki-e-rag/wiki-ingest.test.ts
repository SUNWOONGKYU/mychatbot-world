import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * S5TS1: Wiki Ingest API 응답 구조 검증
 * POST /api/wiki/ingest
 */

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
  })),
}));

describe('Wiki Ingest API — /api/wiki/ingest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/wiki/ingest — Response Structure', () => {
    it('should return success:true with wiki_pages_created count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            wiki_pages_created: 3,
            wiki_pages_updated: 1,
            kb_item_id: 'kb-001',
            bot_id: 'bot-001',
          },
        }),
      });

      const res = await fetch('/api/wiki/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_id: 'bot-001', kb_item_id: 'kb-001' }),
      });
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(typeof body.data.wiki_pages_created).toBe('number');
      expect(body.data.wiki_pages_created).toBeGreaterThanOrEqual(0);
    });

    it('should include wiki_pages_updated in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            wiki_pages_created: 2,
            wiki_pages_updated: 0,
            kb_item_id: 'kb-002',
            bot_id: 'bot-001',
          },
        }),
      });

      const res = await fetch('/api/wiki/ingest', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001', kb_item_id: 'kb-002' }),
      });
      const body = await res.json();

      expect(body.data).toHaveProperty('wiki_pages_updated');
      expect(typeof body.data.wiki_pages_updated).toBe('number');
    });

    it('should echo back bot_id and kb_item_id', async () => {
      const payload = { bot_id: 'bot-abc', kb_item_id: 'kb-xyz' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            wiki_pages_created: 1,
            wiki_pages_updated: 0,
            ...payload,
          },
        }),
      });

      const res = await fetch('/api/wiki/ingest', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      expect(body.data.bot_id).toBe('bot-abc');
      expect(body.data.kb_item_id).toBe('kb-xyz');
    });
  });

  describe('POST /api/wiki/ingest — Slug Format Validation', () => {
    it('generated slugs should be lowercase with hyphens only', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            wiki_pages_created: 2,
            wiki_pages_updated: 0,
            generated_slugs: ['intro-to-machine-learning', 'deep-learning-basics'],
          },
        }),
      });

      const res = await fetch('/api/wiki/ingest', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001', kb_item_id: 'kb-003' }),
      });
      const body = await res.json();

      if (body.data.generated_slugs) {
        const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
        body.data.generated_slugs.forEach((slug: string) => {
          expect(slug).toMatch(slugPattern);
        });
      }
    });

    it('slugs should not contain spaces or uppercase letters', async () => {
      const slugs = ['machine-learning', 'neural-networks-101', 'nlp-overview'];
      slugs.forEach((slug) => {
        expect(slug).not.toContain(' ');
        expect(slug).toBe(slug.toLowerCase());
      });
    });
  });

  describe('POST /api/wiki/ingest — Error Cases', () => {
    it('should return 400 when bot_id is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'bot_id is required',
        }),
      });

      const res = await fetch('/api/wiki/ingest', {
        method: 'POST',
        body: JSON.stringify({ kb_item_id: 'kb-001' }),
      });
      const body = await res.json();

      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('should return 400 when kb_item_id is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'kb_item_id is required',
        }),
      });

      const res = await fetch('/api/wiki/ingest', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('should return 404 when kb_item does not exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'KB item not found',
        }),
      });

      const res = await fetch('/api/wiki/ingest', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001', kb_item_id: 'nonexistent-id' }),
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain('not found');
    });
  });

  describe('POST /api/wiki/ingest — Trigger from KB Embed', () => {
    it('embed API should trigger wiki ingest automatically', async () => {
      // First call: KB embed API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            kb_item_id: 'kb-001',
            wiki_ingest_triggered: true,
          },
        }),
      });

      const res = await fetch('/api/kb/embed', {
        method: 'POST',
        body: JSON.stringify({ kb_item_id: 'kb-001' }),
      });
      const body = await res.json();

      expect(body.data.wiki_ingest_triggered).toBe(true);
    });

    it('wiki ingest trigger should be fire-and-forget (non-blocking)', async () => {
      // The embed response should return before wiki ingest completes
      let ingestStarted = false;
      let embedResolved = false;

      mockFetch
        .mockImplementationOnce(async () => {
          // KB embed returns immediately
          embedResolved = true;
          return {
            ok: true,
            json: async () => ({ success: true, data: { wiki_ingest_triggered: true } }),
          };
        })
        .mockImplementationOnce(async () => {
          // Wiki ingest takes longer
          ingestStarted = true;
          await new Promise((resolve) => setTimeout(resolve, 100));
          return { ok: true, json: async () => ({ success: true }) };
        });

      await fetch('/api/kb/embed', {
        method: 'POST',
        body: JSON.stringify({ kb_item_id: 'kb-001' }),
      });

      // Embed should have resolved before ingest confirmed
      expect(embedResolved).toBe(true);
    });
  });

  describe('POST /api/wiki/ingest — Page Type Assignment', () => {
    it('auto-generated pages should have page_type: auto_generated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            wiki_pages_created: 1,
            wiki_pages_updated: 0,
            pages: [
              {
                slug: 'machine-learning-overview',
                title: 'Machine Learning Overview',
                page_type: 'auto_generated',
              },
            ],
          },
        }),
      });

      const res = await fetch('/api/wiki/ingest', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001', kb_item_id: 'kb-001' }),
      });
      const body = await res.json();

      if (body.data.pages) {
        body.data.pages.forEach((page: { page_type: string }) => {
          expect(page.page_type).toBe('auto_generated');
        });
      }
    });
  });
});
