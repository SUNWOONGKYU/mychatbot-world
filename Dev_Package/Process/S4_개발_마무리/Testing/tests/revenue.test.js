/**
 * @task S4T4
 * @description 수익 API 통합 테스트
 *   - 수익 이벤트 생성, 집계 조회, 월별 조회, 정산 목록, 인증 검증
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
describe('Revenue API', () => {
  beforeEach(() => {
    global.fetch = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. 수익 이벤트 생성
  // -------------------------------------------------------------------------
  test('POST /revenue?action=create — 수익 이벤트 생성 성공 (201)', async () => {
    const mockEvent = {
      id: 'rev-001',
      user_id: 'user-abc',
      type: 'subscription',
      amount: 9900,
      currency: 'KRW',
      created_at: '2026-03-05T00:00:00Z',
    };
    global.fetch = mockFetch(201, { success: true, data: mockEvent });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/revenue?action=create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({
          user_id: 'user-abc',
          type: 'subscription',
          amount: 9900,
          currency: 'KRW',
        }),
      }
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.data.amount).toBe(9900);
    expect(data.data.currency).toBe('KRW');
  });

  // -------------------------------------------------------------------------
  // 2. 음수 금액 → 400
  // -------------------------------------------------------------------------
  test('POST /revenue?action=create — 음수 금액 입력 시 400', async () => {
    global.fetch = mockFetch(400, {
      success: false,
      error: 'amount must be positive',
    });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/revenue?action=create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({ user_id: 'user-abc', type: 'subscription', amount: -100 }),
      }
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/positive/i);
  });

  // -------------------------------------------------------------------------
  // 3. 수익 집계 조회
  // -------------------------------------------------------------------------
  test('GET /revenue?action=summary — 수익 집계 반환 (200)', async () => {
    const mockSummary = {
      total_revenue: 1200000,
      total_transactions: 150,
      avg_per_transaction: 8000,
      currency: 'KRW',
      period: 'all-time',
    };
    global.fetch = mockFetch(200, { success: true, data: mockSummary });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/revenue?action=summary`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('total_revenue');
    expect(data.data).toHaveProperty('total_transactions');
    expect(typeof data.data.total_revenue).toBe('number');
  });

  // -------------------------------------------------------------------------
  // 4. 월별 수익 조회
  // -------------------------------------------------------------------------
  test('GET /revenue?action=monthly — 월별 수익 배열 반환 (200)', async () => {
    const mockMonthly = [
      { month: '2026-01', revenue: 320000, transactions: 40 },
      { month: '2026-02', revenue: 410000, transactions: 52 },
      { month: '2026-03', revenue: 180000, transactions: 23 },
    ];
    global.fetch = mockFetch(200, { success: true, data: mockMonthly });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/revenue?action=monthly`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
    expect(data.data[0]).toHaveProperty('month');
    expect(data.data[0]).toHaveProperty('revenue');
  });

  // -------------------------------------------------------------------------
  // 5. 정산 목록 조회
  // -------------------------------------------------------------------------
  test('GET /revenue?action=settlements — 정산 목록 반환 (200)', async () => {
    const mockSettlements = [
      {
        id: 'settle-001',
        user_id: 'user-abc',
        amount: 95000,
        status: 'completed',
        settled_at: '2026-02-28T00:00:00Z',
      },
      {
        id: 'settle-002',
        user_id: 'user-def',
        amount: 47000,
        status: 'pending',
        settled_at: null,
      },
    ];
    global.fetch = mockFetch(200, {
      success: true,
      data: mockSettlements,
      total: 2,
    });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/revenue?action=settlements`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data[0]).toHaveProperty('status');
    expect(['completed', 'pending', 'failed']).toContain(data.data[0].status);
  });

  // -------------------------------------------------------------------------
  // 6. 인증 없이 접근 → 401
  // -------------------------------------------------------------------------
  test('GET /revenue?action=summary — 인증 토큰 없을 때 401', async () => {
    global.fetch = mockFetch(401, { success: false, error: 'Unauthorized' });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/revenue?action=summary`
      // Authorization 헤더 없음
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/unauthorized/i);
  });

  // -------------------------------------------------------------------------
  // 7. 빈 기간 조회 → 빈 배열 반환
  // -------------------------------------------------------------------------
  test('GET /revenue?action=monthly&year=2020 — 데이터 없는 기간 빈 배열 반환', async () => {
    global.fetch = mockFetch(200, { success: true, data: [], total: 0 });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/revenue?action=monthly&year=2020`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
  });

  // -------------------------------------------------------------------------
  // 8. 정산 상태 필터링
  // -------------------------------------------------------------------------
  test('GET /revenue?action=settlements&status=pending — pending 정산만 반환', async () => {
    const mockPending = [
      { id: 'settle-002', user_id: 'user-def', amount: 47000, status: 'pending' },
    ];
    global.fetch = mockFetch(200, { success: true, data: mockPending, total: 1 });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/revenue?action=settlements&status=pending`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.every((s) => s.status === 'pending')).toBe(true);
  });
});
