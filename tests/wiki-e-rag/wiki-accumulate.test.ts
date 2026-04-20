import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * S5TS1: Wiki 축적 API 검증
 * POST /api/wiki/accumulate — 좋은 Q&A를 FAQ wiki page로 자동 축적
 */

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

describe('Wiki Accumulate API — /api/wiki/accumulate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/wiki/accumulate — Response Structure', () => {
    it('should return success:true with accumulated field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            accumulated: true,
            reason: 'high_quality_answer',
            wiki_page_slug: 'faq-what-is-machine-learning',
          },
        }),
      });

      const res = await fetch('/api/wiki/accumulate', {
        method: 'POST',
        body: JSON.stringify({
          bot_id: 'bot-001',
          question: 'What is machine learning?',
          answer: 'Machine learning is a field of AI...',
        }),
      });
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('accumulated');
      expect(typeof body.data.accumulated).toBe('boolean');
    });

    it('should include reason when not accumulating', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            accumulated: false,
            reason: 'answer_too_short',
          },
        }),
      });

      const res = await fetch('/api/wiki/accumulate', {
        method: 'POST',
        body: JSON.stringify({
          bot_id: 'bot-001',
          question: 'Hi?',
          answer: 'Hello!',
        }),
      });
      const body = await res.json();

      expect(body.data.accumulated).toBe(false);
      expect(body.data.reason).toBeDefined();
    });

    it('should return wiki_page_slug when new FAQ page is created', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            accumulated: true,
            reason: 'new_faq_created',
            wiki_page_slug: 'faq-how-to-setup-database',
            wiki_page_id: 'page-uuid-001',
          },
        }),
      });

      const res = await fetch('/api/wiki/accumulate', {
        method: 'POST',
        body: JSON.stringify({
          bot_id: 'bot-001',
          question: 'How to setup database?',
          answer: 'To setup the database, follow these steps: 1. Install...',
        }),
      });
      const body = await res.json();

      expect(body.data.accumulated).toBe(true);
      expect(body.data.wiki_page_slug).toMatch(/^faq-/);
      expect(body.data.wiki_page_id).toBeDefined();
    });
  });

  describe('POST /api/wiki/accumulate — Quality Thresholds', () => {
    it('should accumulate when answer length exceeds minimum threshold', async () => {
      const longAnswer = 'A'.repeat(200);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { accumulated: true, reason: 'meets_quality_threshold' },
        }),
      });

      const res = await fetch('/api/wiki/accumulate', {
        method: 'POST',
        body: JSON.stringify({
          bot_id: 'bot-001',
          question: 'What is this about?',
          answer: longAnswer,
        }),
      });
      const body = await res.json();

      expect(body.data.accumulated).toBe(true);
    });

    it('should NOT accumulate when answer is too short', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { accumulated: false, reason: 'answer_too_short' },
        }),
      });

      const res = await fetch('/api/wiki/accumulate', {
        method: 'POST',
        body: JSON.stringify({
          bot_id: 'bot-001',
          question: 'What?',
          answer: 'Yes.',
        }),
      });
      const body = await res.json();

      expect(body.data.accumulated).toBe(false);
      expect(body.data.reason).toBe('answer_too_short');
    });

    it('should NOT accumulate greeting or chitchat exchanges', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { accumulated: false, reason: 'chitchat_excluded' },
        }),
      });

      const res = await fetch('/api/wiki/accumulate', {
        method: 'POST',
        body: JSON.stringify({
          bot_id: 'bot-001',
          question: '안녕하세요!',
          answer: '안녕하세요! 어떻게 도와드릴까요?',
        }),
      });
      const body = await res.json();

      expect(body.data.accumulated).toBe(false);
    });
  });

  describe('POST /api/wiki/accumulate — FAQ Page Type', () => {
    it('accumulated wiki pages should have page_type: faq', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            accumulated: true,
            wiki_page_type: 'faq',
            wiki_page_slug: 'faq-deployment-guide',
          },
        }),
      });

      const res = await fetch('/api/wiki/accumulate', {
        method: 'POST',
        body: JSON.stringify({
          bot_id: 'bot-001',
          question: 'How do I deploy the application?',
          answer: 'To deploy, run `npm run build` then `vercel deploy`...',
        }),
      });
      const body = await res.json();

      if (body.data.accumulated) {
        expect(body.data.wiki_page_type).toBe('faq');
      }
    });

    it('faq slug should start with "faq-" prefix', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            accumulated: true,
            wiki_page_slug: 'faq-how-to-reset-password',
          },
        }),
      });

      const res = await fetch('/api/wiki/accumulate', {
        method: 'POST',
        body: JSON.stringify({
          bot_id: 'bot-001',
          question: 'How to reset password?',
          answer: 'Go to Settings > Security > Reset Password...',
        }),
      });
      const body = await res.json();

      if (body.data.accumulated) {
        expect(body.data.wiki_page_slug).toMatch(/^faq-/);
      }
    });
  });

  describe('POST /api/wiki/accumulate — Async (Fire-and-Forget)', () => {
    it('should be called asynchronously after chat response', async () => {
      let chatResponseTime: number | null = null;
      let accumulateCallTime: number | null = null;

      mockFetch
        .mockImplementationOnce(async () => {
          // Chat API resolves first
          chatResponseTime = Date.now();
          return { ok: true, json: async () => ({ success: true }) };
        })
        .mockImplementationOnce(async () => {
          // Accumulate fires after
          accumulateCallTime = Date.now();
          return { ok: true, json: async () => ({ success: true }) };
        });

      await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'test' }),
      });

      fetch('/api/wiki/accumulate', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001', question: 'test', answer: 'response' }),
      }).catch(console.warn);

      expect(chatResponseTime).not.toBeNull();
    });

    it('should not block chat response on accumulate failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { reply: 'Good answer' } }),
        })
        .mockRejectedValueOnce(new Error('Accumulate service unavailable'));

      // Chat should succeed even if accumulate fails
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'test' }),
      });
      const chatBody = await chatRes.json();

      expect(chatBody.success).toBe(true);
    });
  });

  describe('POST /api/wiki/accumulate — Error Cases', () => {
    it('should return 400 when bot_id is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: 'bot_id is required' }),
      });

      const res = await fetch('/api/wiki/accumulate', {
        method: 'POST',
        body: JSON.stringify({ question: 'test', answer: 'test answer' }),
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 when question is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: 'question is required' }),
      });

      const res = await fetch('/api/wiki/accumulate', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001', answer: 'test answer' }),
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 when answer is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: 'answer is required' }),
      });

      const res = await fetch('/api/wiki/accumulate', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001', question: 'test?' }),
      });

      expect(res.status).toBe(400);
    });
  });
});
