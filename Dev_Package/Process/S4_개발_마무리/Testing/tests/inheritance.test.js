/**
 * @task S4T4
 * @description 상속(Inheritance) API 통합 테스트
 *   - 상속 설정 생성, 목록 조회, 수락, 거부, 인증 검증
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_TOKEN = 'test-auth-token';

// ---------------------------------------------------------------------------
// Helper: fetch mock builder
// ---------------------------------------------------------------------------
function mockFetch(status, body) {
  return jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  });
}

// ---------------------------------------------------------------------------
describe('Inheritance API', () => {
  beforeEach(() => {
    global.fetch = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. 상속 설정 생성
  // -------------------------------------------------------------------------
  test('POST /inheritance?action=create — 상속 설정 생성 성공 (201)', async () => {
    const mockInheritance = {
      id: 'inh-001',
      owner_id: 'user-alpha',
      heir_id: 'user-beta',
      chatbot_id: 'bot-xyz',
      status: 'pending',
      created_at: '2026-03-05T00:00:00Z',
    };
    global.fetch = mockFetch(201, { success: true, data: mockInheritance });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/inheritance?action=create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({
          heir_id: 'user-beta',
          chatbot_id: 'bot-xyz',
          message: '봇을 상속합니다.',
        }),
      }
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.data.status).toBe('pending');
    expect(data.data.heir_id).toBe('user-beta');
  });

  // -------------------------------------------------------------------------
  // 2. 자기 자신에게 상속 → 400
  // -------------------------------------------------------------------------
  test('POST /inheritance?action=create — 자기 자신에게 상속 시 400', async () => {
    global.fetch = mockFetch(400, {
      success: false,
      error: 'Cannot inherit to yourself',
    });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/inheritance?action=create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({
          heir_id: 'user-alpha', // 자기 자신
          chatbot_id: 'bot-xyz',
        }),
      }
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/yourself/i);
  });

  // -------------------------------------------------------------------------
  // 3. 상속 목록 조회
  // -------------------------------------------------------------------------
  test('GET /inheritance?action=list — 상속 목록 반환 (200)', async () => {
    const mockList = [
      {
        id: 'inh-001',
        owner_id: 'user-alpha',
        heir_id: 'user-beta',
        chatbot_id: 'bot-xyz',
        status: 'pending',
      },
      {
        id: 'inh-002',
        owner_id: 'user-gamma',
        heir_id: 'user-alpha',
        chatbot_id: 'bot-abc',
        status: 'accepted',
      },
    ];
    global.fetch = mockFetch(200, { success: true, data: mockList, total: 2 });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/inheritance?action=list`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
    expect(data.data[0]).toHaveProperty('status');
  });

  // -------------------------------------------------------------------------
  // 4. 상속 수락
  // -------------------------------------------------------------------------
  test('PATCH /inheritance?action=accept&id=inh-001 — 상속 수락 성공 (200)', async () => {
    const mockAccepted = {
      id: 'inh-001',
      status: 'accepted',
      accepted_at: '2026-03-05T01:00:00Z',
    };
    global.fetch = mockFetch(200, { success: true, data: mockAccepted });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/inheritance?action=accept&id=inh-001`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('accepted');
    expect(data.data).toHaveProperty('accepted_at');
  });

  // -------------------------------------------------------------------------
  // 5. 상속 거부
  // -------------------------------------------------------------------------
  test('PATCH /inheritance?action=reject&id=inh-001 — 상속 거부 성공 (200)', async () => {
    const mockRejected = {
      id: 'inh-001',
      status: 'rejected',
      rejected_at: '2026-03-05T02:00:00Z',
    };
    global.fetch = mockFetch(200, { success: true, data: mockRejected });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/inheritance?action=reject&id=inh-001`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('rejected');
    expect(data.data).toHaveProperty('rejected_at');
  });

  // -------------------------------------------------------------------------
  // 6. 인증 없이 접근 → 401
  // -------------------------------------------------------------------------
  test('GET /inheritance?action=list — 인증 토큰 없을 때 401', async () => {
    global.fetch = mockFetch(401, { success: false, error: 'Unauthorized' });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/inheritance?action=list`
      // Authorization 헤더 없음
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/unauthorized/i);
  });

  // -------------------------------------------------------------------------
  // 7. 이미 처리된 상속 재수락 → 409
  // -------------------------------------------------------------------------
  test('PATCH /inheritance?action=accept&id=inh-002 — 이미 처리된 상속 409', async () => {
    global.fetch = mockFetch(409, {
      success: false,
      error: 'Inheritance already processed',
    });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/inheritance?action=accept&id=inh-002`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/already processed/i);
  });

  // -------------------------------------------------------------------------
  // 8. 존재하지 않는 상속 조회 → 404
  // -------------------------------------------------------------------------
  test('PATCH /inheritance?action=accept&id=nonexistent — 없는 상속 404', async () => {
    global.fetch = mockFetch(404, {
      success: false,
      error: 'Inheritance record not found',
    });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/inheritance?action=accept&id=nonexistent`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/not found/i);
  });
});
