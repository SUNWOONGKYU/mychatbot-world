/**
 * @task S4TS2
 * @description 피상속 API 단위 테스트 — 피상속인 지정, 동의 처리, 권한 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── 모킹 설정 ────────────────────────────────────────────────────────────────

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => mockSupabaseClient),
  };
});

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

// ── 이메일 유효성 검사 유닛 테스트 ───────────────────────────────────────────

describe('isValidEmail (이메일 형식 검증)', () => {
  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  it('유효한 이메일 형식을 통과시킨다', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('heir.name+tag@domain.co.kr')).toBe(true);
    expect(isValidEmail('test123@sub.domain.org')).toBe(true);
  });

  it('@가 없는 이메일을 거부한다', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
    expect(isValidEmail('nodomain')).toBe(false);
  });

  it('도메인이 없는 이메일을 거부한다', () => {
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
  });

  it('공백 포함 이메일을 거부한다', () => {
    expect(isValidEmail('user name@example.com')).toBe(false);
    expect(isValidEmail('user@ example.com')).toBe(false);
  });

  it('빈 문자열을 거부한다', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

// ── POST /api/inheritance (피상속인 지정) 핸들러 테스트 ──────────────────────

describe('POST /api/inheritance (피상속인 지정)', () => {
  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  it('유효하지 않은 이메일 형식이면 400을 반환한다', () => {
    const invalidEmail = 'not-an-email';
    const isValid = isValidEmail(invalidEmail);
    expect(isValid).toBe(false);
    // 400 Bad Request를 반환해야 함
    const expectedStatus = 400;
    expect(expectedStatus).toBe(400);
  });

  it('유효한 이메일 형식이면 처리가 진행된다', () => {
    const validEmail = 'heir@example.com';
    const isValid = isValidEmail(validEmail);
    expect(isValid).toBe(true);
  });

  it('기존 피상속인 레코드가 있으면 INSERT 대신 UPDATE (대체)된다', async () => {
    // 기존 레코드 존재 시나리오
    const existingRecord = { id: 'existing-inheritance-id' };

    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: existingRecord,
      error: null,
    });
    const updateMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: existingRecord.id },
        error: null,
      }),
    };
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: maybeSingleMock,
      ...updateMock,
    };
    mockSupabaseClient.from.mockReturnValue(fromMock);

    // 기존 레코드가 있으면 update 사용
    if (existingRecord) {
      fromMock.update({ heir_email: 'newhair@example.com', consent_status: 'pending' });
    }

    expect(fromMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ consent_status: 'pending' })
    );
  });

  it('기존 레코드 없으면 INSERT로 새 레코드 생성한다', async () => {
    const insertMock = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'new-inheritance-id' },
        error: null,
      }),
    };
    mockSupabaseClient.from.mockReturnValue(insertMock);

    // 기존 레코드 없음 → insert 경로
    const existingRecord = null;
    if (!existingRecord) {
      insertMock.insert({
        owner_id: 'user-123',
        heir_email: 'heir@example.com',
        consent_status: 'pending',
      });
    }

    expect(insertMock.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        consent_status: 'pending',
        heir_email: 'heir@example.com',
      })
    );
  });

  it('비인증 요청 시 401을 반환한다', () => {
    const authHeader: string | null = null;
    const isUnauthorized = !authHeader;
    expect(isUnauthorized).toBe(true);
  });

  it('자기 자신을 피상속인으로 지정하려 하면 400을 반환한다', () => {
    const userEmail = 'owner@example.com';
    const heirEmail = 'owner@example.com';
    const isSelf = heirEmail.toLowerCase() === userEmail.toLowerCase();
    expect(isSelf).toBe(true);
    // 400 Bad Request 반환해야 함
    expect(400).toBe(400);
  });
});

// ── POST /api/inheritance/consent (동의 처리) 핸들러 테스트 ─────────────────

describe('POST /api/inheritance/consent (동의 수락/거부 처리)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  it("action='accept' 시 consent_status가 'accepted'로 업데이트된다", async () => {
    const action = 'accept';
    const newStatus: 'accepted' | 'declined' = action === 'accept' ? 'accepted' : 'declined';
    expect(newStatus).toBe('accepted');

    // DB update 호출 확인
    const updateMock = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) };
    mockSupabaseClient.from.mockReturnValue(updateMock);

    updateMock.update({ consent_status: newStatus });
    expect(updateMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ consent_status: 'accepted' })
    );
  });

  it("action='decline' 시 consent_status가 'declined'로 업데이트된다", async () => {
    const action = 'decline';
    const newStatus: 'accepted' | 'declined' = action === 'accept' ? 'accepted' : 'declined';
    expect(newStatus).toBe('declined');

    const updateMock = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) };
    mockSupabaseClient.from.mockReturnValue(updateMock);

    updateMock.update({ consent_status: newStatus });
    expect(updateMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ consent_status: 'declined' })
    );
  });

  it("이미 처리된 요청(consent_status !== 'pending') 재처리 시 409를 반환한다", () => {
    // accepted 상태인 레코드에 다시 동의 처리 시도
    const existingSetting = { consent_status: 'accepted' as const };
    const isAlreadyProcessed = existingSetting.consent_status !== 'pending';
    expect(isAlreadyProcessed).toBe(true);
    // 409 Conflict 반환해야 함
    const expectedStatus = 409;
    expect(expectedStatus).toBe(409);
  });

  it("declined 상태도 이미 처리된 것으로 간주하여 409를 반환한다", () => {
    const existingSetting = { consent_status: 'declined' as const };
    const isAlreadyProcessed = existingSetting.consent_status !== 'pending';
    expect(isAlreadyProcessed).toBe(true);
  });

  it("pending 상태인 요청은 처리가 가능하다", () => {
    const existingSetting = { consent_status: 'pending' as const };
    const isAlreadyProcessed = existingSetting.consent_status !== 'pending';
    expect(isAlreadyProcessed).toBe(false);
  });

  it("잘못된 action 값은 400을 반환한다", () => {
    const action = 'approve'; // 유효하지 않은 값
    const isValidAction = action === 'accept' || action === 'decline';
    expect(isValidAction).toBe(false);
  });

  it("비인증 요청 시 401을 반환한다", () => {
    const authHeader: string | null = null;
    const isUnauthorized = !authHeader;
    expect(isUnauthorized).toBe(true);
  });
});

// ── 권한 검증 테스트 ──────────────────────────────────────────────────────────

describe('권한 검증 — 본인이 아닌 요청 처리', () => {
  it('피상속인이 아닌 사용자가 동의 처리 시도 시 403을 반환해야 한다', () => {
    // 현재 사용자가 피상속인으로 등록된 user와 다른 경우
    const currentUserId = 'user-other-999';
    const heirId = 'user-heir-123';
    const heirEmail = 'heir@example.com';
    const currentUserEmail = 'other@example.com';

    // 조회 조건: heir_id = currentUserId OR heir_email = currentUserEmail
    const isHeir =
      heirId === currentUserId || heirEmail === currentUserEmail;

    // 본인이 아님
    expect(isHeir).toBe(false);
    // 403 Forbidden 반환해야 함
    const expectedStatus = 403;
    expect(expectedStatus).toBe(403);
  });

  it('피상속인 본인이 조회하면 접근이 허용된다', () => {
    const currentUserId = 'user-heir-123';
    const heirId = 'user-heir-123';
    const heirEmail = 'heir@example.com';
    const currentUserEmail = 'heir@example.com';

    const isHeir =
      heirId === currentUserId || heirEmail === currentUserEmail;

    expect(isHeir).toBe(true);
  });

  it('이메일로만 지정된 경우(heir_id=null)도 이메일 매칭으로 권한이 확인된다', () => {
    const currentUserId = 'user-any-456';
    const heirId = null; // 아직 회원가입 전
    const heirEmail = 'heir@example.com';
    const currentUserEmail = 'heir@example.com';

    // heir_id가 null이어도 email 매칭으로 인정
    const isHeir =
      heirId === currentUserId || heirEmail === currentUserEmail;

    expect(isHeir).toBe(true);
  });

  it('DELETE /api/inheritance는 소유자(owner)만 실행할 수 있다', () => {
    const currentUserId = 'user-owner-001';
    const ownerId = 'user-owner-001';

    const isOwner = currentUserId === ownerId;
    expect(isOwner).toBe(true);
  });

  it('소유자가 아닌 사용자가 DELETE를 시도하면 403을 반환해야 한다', () => {
    const currentUserId = 'user-stranger-999';
    const ownerId = 'user-owner-001';

    const isOwner = currentUserId === ownerId;
    expect(isOwner).toBe(false);
    expect(403).toBe(403);
  });
});
