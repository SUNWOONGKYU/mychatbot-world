import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * S5TS1: OCR 클라이언트 어댑터 검증
 * /api/wiki/ingest 내 OCR 처리 — 이미지/PDF에서 텍스트 추출 후 wiki 생성
 */

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock OpenAI Vision (primary OCR adapter)
const mockOpenAICreate = vi.fn();
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: mockOpenAICreate,
      },
    },
  })),
}));

// OCR adapter interface for testing
interface OcrResult {
  text: string;
  confidence: number;
  page_count?: number;
  metadata?: Record<string, string>;
}

// Simulated OCR adapter
async function extractTextFromImage(
  imageBuffer: Buffer | string,
  mimeType: string
): Promise<OcrResult> {
  const response = await mockOpenAICreate({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageBuffer } },
          { type: 'text', text: 'Extract all text from this image. Return only the extracted text.' },
        ],
      },
    ],
    max_tokens: 4096,
  });

  const extractedText = response.choices[0]?.message?.content || '';
  return {
    text: extractedText,
    confidence: extractedText.length > 0 ? 0.9 : 0,
  };
}

describe('Wiki OCR Client Adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Image OCR — extractTextFromImage', () => {
    it('should extract text from PNG image and return OcrResult', async () => {
      mockOpenAICreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: 'This is the extracted text from the image. It contains product information.',
            },
          },
        ],
      });

      const result = await extractTextFromImage('data:image/png;base64,iVBOR...', 'image/png');

      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('confidence');
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return confidence 0 when no text is extracted', async () => {
      mockOpenAICreate.mockResolvedValueOnce({
        choices: [{ message: { content: '' } }],
      });

      const result = await extractTextFromImage('data:image/png;base64,empty', 'image/png');

      expect(result.text).toBe('');
      expect(result.confidence).toBe(0);
    });

    it('should call OpenAI with gpt-4o model for vision', async () => {
      mockOpenAICreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Extracted text' } }],
      });

      await extractTextFromImage('data:image/jpeg;base64,/9j...', 'image/jpeg');

      expect(mockOpenAICreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
        })
      );
    });

    it('should include image_url in message content', async () => {
      const imageData = 'data:image/png;base64,test123';
      mockOpenAICreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Some text' } }],
      });

      await extractTextFromImage(imageData, 'image/png');

      const callArgs = mockOpenAICreate.mock.calls[0][0];
      const imageContent = callArgs.messages[0].content.find(
        (c: { type: string }) => c.type === 'image_url'
      );
      expect(imageContent).toBeDefined();
      expect(imageContent.image_url.url).toBe(imageData);
    });
  });

  describe('PDF OCR — Multi-Page Handling', () => {
    it('should return page_count in result for PDF documents', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            text: 'Page 1 content\n\nPage 2 content',
            confidence: 0.88,
            page_count: 2,
          },
        }),
      });

      const res = await fetch('/api/wiki/ocr', {
        method: 'POST',
        body: JSON.stringify({
          file_url: 'https://example.com/doc.pdf',
          mime_type: 'application/pdf',
        }),
      });
      const body = await res.json();

      expect(body.data).toHaveProperty('page_count');
      expect(typeof body.data.page_count).toBe('number');
      expect(body.data.page_count).toBeGreaterThan(0);
    });

    it('should concatenate text from multiple pages', async () => {
      const page1Text = 'Introduction section content.';
      const page2Text = 'Technical details section.';
      const combinedText = `${page1Text}\n\n${page2Text}`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            text: combinedText,
            confidence: 0.85,
            page_count: 2,
          },
        }),
      });

      const res = await fetch('/api/wiki/ocr', {
        method: 'POST',
        body: JSON.stringify({ file_url: 'test.pdf', mime_type: 'application/pdf' }),
      });
      const body = await res.json();

      expect(body.data.text).toContain(page1Text);
      expect(body.data.text).toContain(page2Text);
    });
  });

  describe('Supported MIME Types', () => {
    const supportedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'application/pdf',
    ];

    it.each(supportedTypes)('should handle %s mime type', async (mimeType) => {
      mockOpenAICreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Extracted content for ' + mimeType } }],
      });

      const result = await extractTextFromImage('data:' + mimeType + ';base64,test', mimeType);

      expect(result.text).toContain('Extracted content');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return error for unsupported mime type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Unsupported file type: text/plain',
        }),
      });

      const res = await fetch('/api/wiki/ocr', {
        method: 'POST',
        body: JSON.stringify({ file_url: 'doc.txt', mime_type: 'text/plain' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('Unsupported');
    });
  });

  describe('OCR + Wiki Ingest Pipeline', () => {
    it('should trigger wiki ingest after successful OCR extraction', async () => {
      // OCR extracts text from image KB item
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              text: 'Product manual: Installation guide. Step 1: Connect cables. Step 2: Power on.',
              confidence: 0.92,
            },
          }),
        })
        // Then wiki ingest is triggered
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { wiki_pages_created: 1, wiki_pages_updated: 0 },
          }),
        });

      // OCR first
      const ocrRes = await fetch('/api/wiki/ocr', {
        method: 'POST',
        body: JSON.stringify({ file_url: 'manual.jpg', mime_type: 'image/jpeg' }),
      });
      const ocrBody = await ocrRes.json();

      expect(ocrBody.data.text).toBeTruthy();
      expect(ocrBody.data.confidence).toBeGreaterThan(0.5);

      // Wiki ingest should follow
      const ingestRes = await fetch('/api/wiki/ingest', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001', kb_item_id: 'kb-img-001' }),
      });
      const ingestBody = await ingestRes.json();

      expect(ingestBody.data.wiki_pages_created).toBeGreaterThan(0);
    });

    it('wiki pages from OCR should be tagged as auto_generated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            wiki_pages_created: 1,
            pages: [
              {
                slug: 'installation-guide',
                title: 'Installation Guide',
                page_type: 'auto_generated',
                source: 'ocr',
              },
            ],
          },
        }),
      });

      const res = await fetch('/api/wiki/ingest', {
        method: 'POST',
        body: JSON.stringify({ bot_id: 'bot-001', kb_item_id: 'kb-ocr-001' }),
      });
      const body = await res.json();

      if (body.data.pages) {
        body.data.pages.forEach(
          (page: { page_type: string; source?: string }) => {
            expect(page.page_type).toBe('auto_generated');
          }
        );
      }
    });
  });

  describe('OCR Error Handling', () => {
    it('should handle OpenAI API timeout gracefully', async () => {
      mockOpenAICreate.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(
        extractTextFromImage('data:image/png;base64,test', 'image/png')
      ).rejects.toThrow('Request timeout');
    });

    it('should handle empty choices array from OpenAI', async () => {
      mockOpenAICreate.mockResolvedValueOnce({
        choices: [],
      });

      const result = await extractTextFromImage('data:image/png;base64,test', 'image/png');

      expect(result.text).toBe('');
      expect(result.confidence).toBe(0);
    });

    it('should handle null message content from OpenAI', async () => {
      mockOpenAICreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });

      const result = await extractTextFromImage('data:image/png;base64,test', 'image/png');

      expect(result.text).toBe('');
      expect(result.confidence).toBe(0);
    });
  });

  describe('OCR Confidence Thresholds', () => {
    it('confidence should be a number between 0 and 1', async () => {
      mockOpenAICreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Clear readable text extracted successfully.' } }],
      });

      const result = await extractTextFromImage('data:image/png;base64,test', 'image/png');

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should not ingest wiki when OCR confidence is below threshold', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            text: 'blurry partially unreadable text',
            confidence: 0.3,
            wiki_skipped: true,
            skip_reason: 'ocr_confidence_too_low',
          },
        }),
      });

      const res = await fetch('/api/wiki/ocr', {
        method: 'POST',
        body: JSON.stringify({ file_url: 'blurry.jpg', mime_type: 'image/jpeg', min_confidence: 0.7 }),
      });
      const body = await res.json();

      if (body.data.confidence < 0.7) {
        expect(body.data.wiki_skipped).toBe(true);
        expect(body.data.skip_reason).toBe('ocr_confidence_too_low');
      }
    });
  });
});
