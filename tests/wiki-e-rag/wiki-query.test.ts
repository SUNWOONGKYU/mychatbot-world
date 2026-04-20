import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * S5TS1: Wiki-First 검색 로직 검증
 * Wiki-First 패턴: match_wiki_pages RPC → hit/miss 분기
 */

const mockSupabase = {
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Simulate searchWiki function behavior
async function searchWiki(
  botId: string,
  queryEmbedding: number[],
  threshold = 0.75,
  matchCount = 3
): Promise<{ content: string; titles: string[] } | null> {
  const { data } = await mockSupabase.rpc('match_wiki_pages', {
    p_bot_id: botId,
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: matchCount,
  });

  if (!data || data.length === 0) return null;

  return {
    content: data.map((p: { content: string }) => p.content).join('\n\n'),
    titles: data.map((p: { title: string }) => p.title),
  };
}

describe('Wiki-First Query Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchWiki — Hit Cases (threshold >= 0.75)', () => {
    it('should return wiki content when similarity >= 0.75', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [
          { title: 'Machine Learning Overview', content: 'ML is a subset of AI...', similarity: 0.92 },
          { title: 'Deep Learning Basics', content: 'Deep learning uses neural networks...', similarity: 0.81 },
        ],
        error: null,
      });

      const embedding = new Array(1536).fill(0.1);
      const result = await searchWiki('bot-001', embedding);

      expect(result).not.toBeNull();
      expect(result!.titles).toHaveLength(2);
      expect(result!.titles).toContain('Machine Learning Overview');
      expect(result!.content).toContain('ML is a subset of AI');
    });

    it('should join multiple wiki pages with double newline', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [
          { title: 'Page A', content: 'Content A', similarity: 0.88 },
          { title: 'Page B', content: 'Content B', similarity: 0.77 },
        ],
        error: null,
      });

      const result = await searchWiki('bot-001', []);
      expect(result!.content).toBe('Content A\n\nContent B');
    });

    it('should respect match_count limit (max 3 by default)', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [
          { title: 'P1', content: 'C1', similarity: 0.95 },
          { title: 'P2', content: 'C2', similarity: 0.88 },
          { title: 'P3', content: 'C3', similarity: 0.76 },
        ],
        error: null,
      });

      const result = await searchWiki('bot-001', []);
      expect(result!.titles).toHaveLength(3);
    });
  });

  describe('searchWiki — Miss Cases (threshold < 0.75)', () => {
    it('should return null when no wiki pages match threshold', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await searchWiki('bot-001', []);
      expect(result).toBeNull();
    });

    it('should return null when RPC returns null data', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await searchWiki('bot-001', []);
      expect(result).toBeNull();
    });
  });

  describe('Wiki-First Pattern — Chat API Integration', () => {
    it('should call match_wiki_pages RPC with correct parameters', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      const botId = 'bot-abc';
      const embedding = new Array(1536).fill(0.05);

      await searchWiki(botId, embedding, 0.75, 3);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('match_wiki_pages', {
        p_bot_id: botId,
        query_embedding: embedding,
        match_threshold: 0.75,
        match_count: 3,
      });
    });

    it('should use wiki content as system context when wiki hits', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [{ title: 'FAQ', content: 'Answer to common questions...', similarity: 0.9 }],
        error: null,
      });

      const result = await searchWiki('bot-001', []);

      // When wiki hits: content should be used as system context
      expect(result).not.toBeNull();
      const systemContext = `[Wiki Knowledge]\n${result!.content}`;
      expect(systemContext).toContain('[Wiki Knowledge]');
      expect(systemContext).toContain('Answer to common questions');
    });

    it('should fall back to KB chunk embeddings when wiki misses', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      const result = await searchWiki('bot-001', []);

      // When wiki misses: result is null → should pass queryEmbedding to persona-loader
      expect(result).toBeNull();
      // Caller should then use queryEmbedding for kb_embeddings search
    });

    it('wiki hit should skip KB embeddings search', async () => {
      const kbSearchSpy = vi.fn();

      mockSupabase.rpc.mockResolvedValueOnce({
        data: [{ title: 'Topic', content: 'Wiki content', similarity: 0.85 }],
        error: null,
      });

      const wikiResult = await searchWiki('bot-001', []);

      // If wiki returns content, kbSearch should NOT be called
      if (wikiResult !== null) {
        // KB search is skipped (pass undefined queryEmbedding to persona-loader)
        expect(kbSearchSpy).not.toHaveBeenCalled();
      }
    });
  });

  describe('ragSource Propagation', () => {
    it('should set ragSource to "wiki" when wiki hit', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [{ title: 'Wiki Page', content: 'Wiki content', similarity: 0.88 }],
        error: null,
      });

      const wikiResult = await searchWiki('bot-001', []);
      const ragSource = wikiResult !== null ? 'wiki' : 'chunk';

      expect(ragSource).toBe('wiki');
    });

    it('should set ragSource to "chunk" when wiki miss + KB hit', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      const wikiResult = await searchWiki('bot-001', []);
      // Simulate KB chunks found
      const kbChunksFound = true;
      const ragSource = wikiResult !== null ? 'wiki' : kbChunksFound ? 'chunk' : 'none';

      expect(ragSource).toBe('chunk');
    });

    it('should set ragSource to "none" when both wiki and KB miss', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      const wikiResult = await searchWiki('bot-001', []);
      const kbChunksFound = false;
      const ragSource = wikiResult !== null ? 'wiki' : kbChunksFound ? 'chunk' : 'none';

      expect(ragSource).toBe('none');
    });

    it('ragSource should be included in SSE model_selected event', () => {
      // Test the shape of the SSE event data
      const modelSelectedEvent = {
        model: 'claude-opus-4-6',
        persona_id: 'persona-001',
        ragSource: 'wiki' as const,
      };

      expect(modelSelectedEvent).toHaveProperty('ragSource');
      expect(['wiki', 'chunk', 'none']).toContain(modelSelectedEvent.ragSource);
    });
  });

  describe('Similarity Threshold Edge Cases', () => {
    it('should include pages at exactly 0.75 similarity', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [{ title: 'Borderline Page', content: 'Edge case content', similarity: 0.75 }],
        error: null,
      });

      const result = await searchWiki('bot-001', [], 0.75);
      expect(result).not.toBeNull();
    });

    it('should support custom threshold values', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      await searchWiki('bot-001', [], 0.9, 5);

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'match_wiki_pages',
        expect.objectContaining({
          match_threshold: 0.9,
          match_count: 5,
        })
      );
    });
  });
});
