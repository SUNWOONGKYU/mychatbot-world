/**
 * @task S5T3
 * @description Zod 스키마 + withAuth 패턴 단위 테스트
 */

import { describe, it, expect } from 'vitest';
import { ChatRequestSchema } from '../../lib/validations/chat';
import {
  AdminUsersQuerySchema,
  AdminUserUpdateSchema,
  AdminCreditGrantSchema,
} from '../../lib/validations/admin';

// ── ChatRequestSchema ────────────────────────────────────────────────────────

describe('ChatRequestSchema', () => {
  it('유효한 최소 요청을 통과시킨다', () => {
    const result = ChatRequestSchema.safeParse({
      botId: 'bot-123',
      message: '안녕하세요',
      emotionLevel: 50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.costTier).toBe('standard'); // 기본값
    }
  });

  it('costTier 기본값이 standard다', () => {
    const result = ChatRequestSchema.safeParse({
      botId: 'bot-123',
      message: '안녕하세요',
      emotionLevel: 50,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.costTier).toBe('standard');
  });

  it('botId 빈 문자열을 거부한다', () => {
    const result = ChatRequestSchema.safeParse({
      botId: '',
      message: '안녕하세요',
      emotionLevel: 50,
    });
    expect(result.success).toBe(false);
  });

  it('message 빈 문자열을 거부한다', () => {
    const result = ChatRequestSchema.safeParse({
      botId: 'bot-123',
      message: '',
      emotionLevel: 50,
    });
    expect(result.success).toBe(false);
  });

  it('message 4001자를 거부한다', () => {
    const result = ChatRequestSchema.safeParse({
      botId: 'bot-123',
      message: 'a'.repeat(4001),
      emotionLevel: 50,
    });
    expect(result.success).toBe(false);
  });

  it('message 4000자를 허용한다', () => {
    const result = ChatRequestSchema.safeParse({
      botId: 'bot-123',
      message: 'a'.repeat(4000),
      emotionLevel: 50,
    });
    expect(result.success).toBe(true);
  });

  it('emotionLevel 0을 거부한다', () => {
    const result = ChatRequestSchema.safeParse({
      botId: 'bot-123',
      message: '안녕',
      emotionLevel: 0,
    });
    expect(result.success).toBe(false);
  });

  it('emotionLevel 101을 거부한다', () => {
    const result = ChatRequestSchema.safeParse({
      botId: 'bot-123',
      message: '안녕',
      emotionLevel: 101,
    });
    expect(result.success).toBe(false);
  });

  it('emotionLevel 1과 100을 허용한다', () => {
    for (const level of [1, 50, 100]) {
      const result = ChatRequestSchema.safeParse({
        botId: 'bot-123',
        message: '안녕',
        emotionLevel: level,
      });
      expect(result.success, `emotionLevel ${level}`).toBe(true);
    }
  });

  it('유효하지 않은 costTier를 거부한다', () => {
    const result = ChatRequestSchema.safeParse({
      botId: 'bot-123',
      message: '안녕',
      emotionLevel: 50,
      costTier: 'ultra',
    });
    expect(result.success).toBe(false);
  });

  it('conversationId는 선택 필드다', () => {
    const withId = ChatRequestSchema.safeParse({
      botId: 'bot-123',
      message: '안녕',
      emotionLevel: 50,
      conversationId: 'conv-abc',
    });
    const withoutId = ChatRequestSchema.safeParse({
      botId: 'bot-123',
      message: '안녕',
      emotionLevel: 50,
    });
    expect(withId.success).toBe(true);
    expect(withoutId.success).toBe(true);
  });
});

// ── AdminUsersQuerySchema ────────────────────────────────────────────────────

describe('AdminUsersQuerySchema', () => {
  it('기본값이 올바르게 적용된다', () => {
    const result = AdminUsersQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('limit 100을 허용한다', () => {
    const result = AdminUsersQuerySchema.safeParse({ limit: '100' });
    expect(result.success).toBe(true);
  });

  it('limit 101을 거부한다', () => {
    const result = AdminUsersQuerySchema.safeParse({ limit: '101' });
    expect(result.success).toBe(false);
  });

  it('page 0을 거부한다', () => {
    const result = AdminUsersQuerySchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });

  it('search 100자를 허용한다', () => {
    const result = AdminUsersQuerySchema.safeParse({ search: 'a'.repeat(100) });
    expect(result.success).toBe(true);
  });

  it('search 101자를 거부한다', () => {
    const result = AdminUsersQuerySchema.safeParse({ search: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });
});

// ── AdminUserUpdateSchema ────────────────────────────────────────────────────

describe('AdminUserUpdateSchema', () => {
  it('userId 없으면 거부한다', () => {
    const result = AdminUserUpdateSchema.safeParse({ role: 'admin' });
    expect(result.success).toBe(false);
  });

  it('유효한 role 업데이트를 허용한다', () => {
    for (const role of ['user', 'moderator', 'admin'] as const) {
      const result = AdminUserUpdateSchema.safeParse({ userId: 'uid-1', role });
      expect(result.success, `role ${role}`).toBe(true);
    }
  });

  it('유효하지 않은 role을 거부한다', () => {
    const result = AdminUserUpdateSchema.safeParse({ userId: 'uid-1', role: 'superadmin' });
    expect(result.success).toBe(false);
  });
});

// ── AdminCreditGrantSchema ───────────────────────────────────────────────────

describe('AdminCreditGrantSchema', () => {
  it('유효한 크레딧 지급을 허용한다', () => {
    const result = AdminCreditGrantSchema.safeParse({
      userId: 'uid-1',
      amount: 1000,
    });
    expect(result.success).toBe(true);
  });

  it('amount 0을 거부한다', () => {
    const result = AdminCreditGrantSchema.safeParse({ userId: 'uid-1', amount: 0 });
    expect(result.success).toBe(false);
  });

  it('amount 1_000_001을 거부한다', () => {
    const result = AdminCreditGrantSchema.safeParse({ userId: 'uid-1', amount: 1_000_001 });
    expect(result.success).toBe(false);
  });

  it('reason 200자를 허용한다', () => {
    const result = AdminCreditGrantSchema.safeParse({
      userId: 'uid-1',
      amount: 100,
      reason: 'a'.repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it('reason 201자를 거부한다', () => {
    const result = AdminCreditGrantSchema.safeParse({
      userId: 'uid-1',
      amount: 100,
      reason: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });
});
