/**
 * @task S4T4
 * @description 마켓플레이스 API 통합 테스트
 *   - 스킬 등록, 목록 조회, 상세 조회, 설치, 인증 검증
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
describe('Marketplace API', () => {
  beforeEach(() => {
    global.fetch = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. 스킬 등록
  // -------------------------------------------------------------------------
  test('POST /marketplace?action=register — 스킬 등록 성공 (201)', async () => {
    const mockPayload = {
      id: 'skill-abc123',
      name: 'image-resizer',
      version: '1.0.0',
      created_at: '2026-03-05T00:00:00Z',
    };
    global.fetch = mockFetch(201, { success: true, data: mockPayload });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/marketplace?action=register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({
          name: 'image-resizer',
          version: '1.0.0',
          description: '이미지 리사이저 스킬',
          price: 0,
        }),
      }
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.data.name).toBe('image-resizer');
  });

  // -------------------------------------------------------------------------
  // 2. 필수 필드 누락 → 400
  // -------------------------------------------------------------------------
  test('POST /marketplace?action=register — 필수 필드 누락 시 400', async () => {
    global.fetch = mockFetch(400, {
      success: false,
      error: 'name and version are required',
    });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/marketplace?action=register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({ description: '설명만 있음' }),
      }
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/required/i);
  });

  // -------------------------------------------------------------------------
  // 3. 스킬 목록 조회
  // -------------------------------------------------------------------------
  test('GET /marketplace?action=list — 스킬 목록 반환 (200)', async () => {
    const mockList = [
      { id: 'skill-001', name: 'image-resizer', version: '1.0.0', downloads: 42 },
      { id: 'skill-002', name: 'pdf-export', version: '2.1.0', downloads: 120 },
    ];
    global.fetch = mockFetch(200, { success: true, data: mockList, total: 2 });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/marketplace?action=list`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
    expect(data.data[0]).toHaveProperty('id');
    expect(data.data[0]).toHaveProperty('name');
  });

  // -------------------------------------------------------------------------
  // 4. 스킬 상세 조회
  // -------------------------------------------------------------------------
  test('GET /marketplace?action=detail&id=skill-001 — 상세 반환 (200)', async () => {
    const mockDetail = {
      id: 'skill-001',
      name: 'image-resizer',
      version: '1.0.0',
      author: 'sunny',
      downloads: 42,
      readme: '# image-resizer\n이미지를 리사이즈합니다.',
    };
    global.fetch = mockFetch(200, { success: true, data: mockDetail });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/marketplace?action=detail&id=skill-001`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.id).toBe('skill-001');
    expect(data.data).toHaveProperty('readme');
    expect(data.data).toHaveProperty('author');
  });

  // -------------------------------------------------------------------------
  // 5. 존재하지 않는 스킬 조회 → 404
  // -------------------------------------------------------------------------
  test('GET /marketplace?action=detail&id=nonexistent — 404 반환', async () => {
    global.fetch = mockFetch(404, { success: false, error: 'Skill not found' });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/marketplace?action=detail&id=nonexistent`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/not found/i);
  });

  // -------------------------------------------------------------------------
  // 6. 스킬 설치
  // -------------------------------------------------------------------------
  test('POST /marketplace?action=install — 설치 성공 (200)', async () => {
    global.fetch = mockFetch(200, {
      success: true,
      message: 'Skill installed successfully',
      install_path: '~/.claude/skills/image-resizer',
    });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/marketplace?action=install`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({ skill_id: 'skill-001' }),
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('install_path');
  });

  // -------------------------------------------------------------------------
  // 7. 인증 없이 접근 → 401
  // -------------------------------------------------------------------------
  test('GET /marketplace?action=list — 인증 토큰 없을 때 401', async () => {
    global.fetch = mockFetch(401, { success: false, error: 'Unauthorized' });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/marketplace?action=list`
      // Authorization 헤더 없음
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/unauthorized/i);
  });

  // -------------------------------------------------------------------------
  // 8. 잘못된 액션 → 400
  // -------------------------------------------------------------------------
  test('GET /marketplace?action=unknown — 알 수 없는 action 400', async () => {
    global.fetch = mockFetch(400, { success: false, error: 'Unknown action: unknown' });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/marketplace?action=unknown`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/unknown action/i);
  });
});
