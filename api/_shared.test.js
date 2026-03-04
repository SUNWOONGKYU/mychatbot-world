/**
 * Unit tests for api/_shared.js
 * Covers: key rotation, context overflow detection, skill/FAQ builders,
 *         DM policy, system message builder
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getAvailableKeys, markKeyFailed,
  isContextOverflow, buildSkillSection, buildFaqSection,
  checkDmPolicy, buildSystemMessage, MODEL_STACK,
  buildRagSection
} from './_shared.js';

// ─── getAvailableKeys + markKeyFailed ───

describe('getAvailableKeys', () => {
  const originalEnv = process.env.OPENROUTER_API_KEY;

  beforeEach(() => {
    // Reset cooldowns between tests (module-level state)
    process.env.OPENROUTER_API_KEY = 'key-a,key-b,key-c';
  });

  it('returns all keys from comma-separated env var', () => {
    const keys = getAvailableKeys();
    expect(keys).toHaveLength(3);
    expect(keys).toContain('key-a');
    expect(keys).toContain('key-b');
    expect(keys).toContain('key-c');
  });

  it('returns empty array when env var is empty', () => {
    process.env.OPENROUTER_API_KEY = '';
    expect(getAvailableKeys()).toHaveLength(0);
  });

  it('trims whitespace from keys', () => {
    process.env.OPENROUTER_API_KEY = ' key-x , key-y ';
    const keys = getAvailableKeys();
    expect(keys).toContain('key-x');
    expect(keys).toContain('key-y');
  });

  it('sorts failed keys to the end after markKeyFailed', () => {
    markKeyFailed('key-a');
    const keys = getAvailableKeys();
    // key-a should be last (in cooldown)
    expect(keys[keys.length - 1]).toBe('key-a');
  });

  afterEach(() => {
    process.env.OPENROUTER_API_KEY = originalEnv;
  });
});

// ─── isContextOverflow ───

describe('isContextOverflow', () => {
  it('returns false for null/ok responses', async () => {
    expect(await isContextOverflow(null)).toBe(false);
    expect(await isContextOverflow({ ok: true, status: 200 })).toBe(false);
  });

  it('returns false for non-400 errors', async () => {
    const resp = { ok: false, status: 500, clone: () => resp, json: async () => ({}) };
    expect(await isContextOverflow(resp)).toBe(false);
  });

  it('detects context overflow from error message', async () => {
    const body = { error: { message: 'This model maximum context length is 8192 tokens' } };
    const resp = {
      ok: false, status: 400,
      clone: () => ({ json: async () => body })
    };
    expect(await isContextOverflow(resp)).toBe(true);
  });

  it('detects token limit errors', async () => {
    const body = { error: { message: 'token limit exceeded' } };
    const resp = {
      ok: false, status: 400,
      clone: () => ({ json: async () => body })
    };
    expect(await isContextOverflow(resp)).toBe(true);
  });

  it('returns false for unrelated 400 errors', async () => {
    const body = { error: { message: 'invalid parameter: temperature' } };
    const resp = {
      ok: false, status: 400,
      clone: () => ({ json: async () => body })
    };
    expect(await isContextOverflow(resp)).toBe(false);
  });
});

// ─── buildSkillSection ───

describe('buildSkillSection', () => {
  it('returns empty string for no skills', () => {
    expect(buildSkillSection([])).toBe('');
    expect(buildSkillSection(null)).toBe('');
  });

  it('builds section with skill prompts', () => {
    const skills = [
      { name: '감정 분석', systemPrompt: '감정을 파악하세요' },
      { name: '욕설 필터', systemPrompt: '욕설을 차단하세요' }
    ];
    const result = buildSkillSection(skills);
    expect(result).toContain('[활성 스킬]');
    expect(result).toContain('감정 분석');
    expect(result).toContain('욕설 필터');
  });

  it('respects token budget', () => {
    const longSkills = Array.from({ length: 50 }, (_, i) => ({
      name: `skill-${i}`,
      systemPrompt: '이것은 매우 긴 시스템 프롬프트입니다. '.repeat(10)
    }));
    const result = buildSkillSection(longSkills, 100);
    // Should be truncated — not all 50 skills
    const skillCount = (result.match(/- skill-/g) || []).length;
    expect(skillCount).toBeLessThan(50);
    expect(skillCount).toBeGreaterThan(0);
  });

  it('skips skills without systemPrompt', () => {
    const skills = [
      { name: 'A', systemPrompt: '' },
      { name: 'B', systemPrompt: 'prompt' }
    ];
    const result = buildSkillSection(skills);
    expect(result).not.toContain('- A:');
    expect(result).toContain('- B:');
  });
});

// ─── buildFaqSection ───

describe('buildFaqSection', () => {
  it('returns empty string for no FAQs', () => {
    expect(buildFaqSection([])).toBe('');
    expect(buildFaqSection(null)).toBe('');
  });

  it('builds Q&A pairs', () => {
    const faqs = [
      { q: '영업시간은?', a: '9시~18시' },
      { q: '위치는?', a: '서울' }
    ];
    const result = buildFaqSection(faqs);
    expect(result).toContain('Q: 영업시간은?');
    expect(result).toContain('A: 9시~18시');
    expect(result).toContain('Q: 위치는?');
  });

  it('respects token budget', () => {
    const bigFaqs = Array.from({ length: 100 }, (_, i) => ({
      q: `질문 ${i} 입니다 `.repeat(5),
      a: `답변 ${i} 입니다 `.repeat(5)
    }));
    const result = buildFaqSection(bigFaqs, 50);
    const qCount = (result.match(/Q: /g) || []).length;
    expect(qCount).toBeLessThan(100);
    expect(qCount).toBeGreaterThan(0);
  });
});

// ─── checkDmPolicy ───

describe('checkDmPolicy', () => {
  it('allows access for public policy', () => {
    const result = checkDmPolicy({ dmPolicy: 'public' }, 'user@test.com');
    expect(result.blocked).toBe(false);
  });

  it('blocks non-allowed users in allowlist mode', () => {
    const config = { dmPolicy: 'allowlist', allowedUsers: ['admin@test.com'] };
    const result = checkDmPolicy(config, 'stranger@test.com');
    expect(result.blocked).toBe(true);
  });

  it('allows listed users in allowlist mode', () => {
    const config = { dmPolicy: 'allowlist', allowedUsers: ['user@test.com'] };
    const result = checkDmPolicy(config, 'user@test.com');
    expect(result.blocked).toBe(false);
  });

  it('blocks wrong pairing code', () => {
    const config = { dmPolicy: 'pairing', pairingCode: 'ABC123', userPairingCode: 'WRONG' };
    const result = checkDmPolicy(config, 'anon');
    expect(result.blocked).toBe(true);
  });

  it('allows correct pairing code', () => {
    const config = { dmPolicy: 'pairing', pairingCode: 'ABC123', userPairingCode: 'ABC123' };
    const result = checkDmPolicy(config, 'anon');
    expect(result.blocked).toBe(false);
  });

  it('defaults to public when no policy set', () => {
    const result = checkDmPolicy({}, 'anyone');
    expect(result.blocked).toBe(false);
  });
});

// ─── buildSystemMessage ───

describe('buildSystemMessage', () => {
  it('builds basic system message with bot name and persona', () => {
    const msg = buildSystemMessage({
      botName: 'TestBot',
      personaName: 'Helper',
      personality: '친절한 도우미',
      tone: '따뜻한 어조'
    });
    expect(msg).toContain('TestBot');
    expect(msg).toContain('Helper');
    expect(msg).toContain('친절한 도우미');
    expect(msg).toContain('한국어로 답변하세요');
  });

  it('applies military terms for CPC liaison persona', () => {
    const msg = buildSystemMessage({ personaName: 'Claude 연락병' });
    expect(msg).toContain('지휘관님');
    expect(msg).toContain('소대장');
    expect(msg).toContain('__SILENT__');
  });

  it('blocks military terms for avatar persona', () => {
    const msg = buildSystemMessage({ personaCategory: 'avatar', personaName: 'Customer Bot' });
    expect(msg).toContain('고객님');
    expect(msg).toContain('군사 용어를 절대 사용하지 마세요');
    // Should NOT contain CPC-specific instructions (e.g. addressing 소대장 directly)
    expect(msg).not.toContain('소대장이라고만 부르세요');
    expect(msg).not.toContain('__SILENT__');
  });

  it('injects FAQ section with budget', () => {
    const msg = buildSystemMessage({
      faqs: [{ q: '배송은?', a: '2~3일' }]
    });
    expect(msg).toContain('Q: 배송은?');
    expect(msg).toContain('A: 2~3일');
  });

  it('injects skill section', () => {
    const msg = buildSystemMessage({
      skills: [{ name: '감정 분석', systemPrompt: '감정 파악' }]
    });
    expect(msg).toContain('[활성 스킬]');
    expect(msg).toContain('감정 분석');
  });
});

// ─── MODEL_STACK ───

describe('MODEL_STACK', () => {
  it('contains expected models in priority order', () => {
    expect(MODEL_STACK).toHaveLength(5);
    expect(MODEL_STACK[0]).toBe('google/gemini-2.0-flash-exp:free');
    expect(MODEL_STACK[1]).toBe('google/gemini-2.5-flash');
    expect(MODEL_STACK).toContain('openai/gpt-4o');
  });
});

// ─── buildRagSection ───

describe('buildRagSection', () => {
  it('returns empty string for no chunks', () => {
    expect(buildRagSection([])).toBe('');
    expect(buildRagSection(null)).toBe('');
    expect(buildRagSection(undefined)).toBe('');
  });

  it('returns empty string for chunks with no content', () => {
    const chunks = [{ content: '' }, { content: null }];
    expect(buildRagSection(chunks)).toBe('');
  });

  it('builds section with chunk content', () => {
    const chunks = [
      { content: '공인회계사는 세무 신고를 도와드립니다.' },
      { content: '예약은 전화 또는 온라인으로 가능합니다.' }
    ];
    const result = buildRagSection(chunks);
    expect(result).toContain('[관련 지식베이스]');
    expect(result).toContain('공인회계사는 세무 신고를 도와드립니다.');
    expect(result).toContain('예약은 전화 또는 온라인으로 가능합니다.');
  });

  it('truncates long chunk content to 400 chars', () => {
    const longContent = 'A'.repeat(600);
    const chunks = [{ content: longContent }];
    const result = buildRagSection(chunks);
    expect(result).toContain('...');
    // Full 600 chars should NOT appear
    expect(result).not.toContain('A'.repeat(500));
  });

  it('respects maxChars budget', () => {
    const chunks = Array.from({ length: 20 }, (_, i) => ({
      content: `청크 내용 ${i}: `.padEnd(200, '내용')
    }));
    const result = buildRagSection(chunks, 500);
    // Should be significantly shorter than all 20 chunks × 200 chars
    expect(result.length).toBeLessThan(1000);
  });

  it('adds separator between chunks', () => {
    const chunks = [
      { content: '첫 번째 청크 내용' },
      { content: '두 번째 청크 내용' }
    ];
    const result = buildRagSection(chunks);
    expect(result).toContain('---');
  });
});
