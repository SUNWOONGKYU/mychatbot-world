/**
 * @task S4T4
 * @description 회귀 테스트 — 기존 핵심 API 안정성 검증
 *   - 인증(Google OAuth callback), 챗봇 목록, 대화, 사용자 프로필, 봇 생성
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
describe('Regression — Auth API', () => {
  beforeEach(() => {
    global.fetch = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. Google OAuth callback — 성공
  // -------------------------------------------------------------------------
  test('POST /Security/google-callback — 유효한 code로 토큰 발급 (200)', async () => {
    const mockAuth = {
      access_token: 'eyJhbGci...mock',
      token_type: 'Bearer',
      expires_in: 3600,
      user: {
        id: 'user-google-001',
        email: 'user@example.com',
        name: '홍길동',
        avatar_url: 'https://lh3.googleusercontent.com/...',
      },
    };
    global.fetch = mockFetch(200, { success: true, data: mockAuth });

    const response = await fetch(
      `${BASE_URL}/api/Security/google-callback`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'valid-oauth-code-123' }),
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('access_token');
    expect(data.data).toHaveProperty('user');
    expect(data.data.user).toHaveProperty('email');
  });

  // -------------------------------------------------------------------------
  // 2. Google OAuth callback — 잘못된 코드 → 400
  // -------------------------------------------------------------------------
  test('POST /Security/google-callback — 잘못된 code 400', async () => {
    global.fetch = mockFetch(400, {
      success: false,
      error: 'Invalid authorization code',
    });

    const response = await fetch(
      `${BASE_URL}/api/Security/google-callback`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'invalid-code' }),
      }
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/invalid/i);
  });
});

// ---------------------------------------------------------------------------
describe('Regression — Chatbot List API', () => {
  beforeEach(() => {
    global.fetch = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 3. 챗봇 목록 조회
  // -------------------------------------------------------------------------
  test('GET /Backend_APIs/chatbot-list — 챗봇 목록 반환 (200)', async () => {
    const mockBots = [
      {
        id: 'bot-001',
        name: '고객지원봇',
        model: 'claude-sonnet-4-6',
        is_active: true,
        created_at: '2026-01-10T00:00:00Z',
      },
      {
        id: 'bot-002',
        name: '판매봇',
        model: 'claude-haiku-4-6',
        is_active: false,
        created_at: '2026-02-15T00:00:00Z',
      },
    ];
    global.fetch = mockFetch(200, { success: true, data: mockBots, total: 2 });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/chatbot-list`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data[0]).toHaveProperty('id');
    expect(data.data[0]).toHaveProperty('name');
    expect(data.data[0]).toHaveProperty('is_active');
  });

  // -------------------------------------------------------------------------
  // 4. 챗봇 목록 — 인증 없을 때 401
  // -------------------------------------------------------------------------
  test('GET /Backend_APIs/chatbot-list — 인증 없을 때 401', async () => {
    global.fetch = mockFetch(401, { success: false, error: 'Unauthorized' });

    const response = await fetch(`${BASE_URL}/api/Backend_APIs/chatbot-list`);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe('Regression — Chat Send API', () => {
  beforeEach(() => {
    global.fetch = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 5. 대화 전송 — 성공
  // -------------------------------------------------------------------------
  test('POST /Backend_APIs/chat-send — 메시지 전송 및 응답 수신 (200)', async () => {
    const mockChat = {
      message_id: 'msg-001',
      bot_id: 'bot-001',
      user_message: '안녕하세요',
      bot_response: '안녕하세요! 무엇을 도와드릴까요?',
      tokens_used: 45,
      created_at: '2026-03-05T10:00:00Z',
    };
    global.fetch = mockFetch(200, { success: true, data: mockChat });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/chat-send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({
          bot_id: 'bot-001',
          message: '안녕하세요',
          session_id: 'sess-abc',
        }),
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('bot_response');
    expect(data.data).toHaveProperty('tokens_used');
    expect(typeof data.data.bot_response).toBe('string');
    expect(data.data.bot_response.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // 6. 빈 메시지 전송 → 400
  // -------------------------------------------------------------------------
  test('POST /Backend_APIs/chat-send — 빈 메시지 전송 시 400', async () => {
    global.fetch = mockFetch(400, {
      success: false,
      error: 'message cannot be empty',
    });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/chat-send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({ bot_id: 'bot-001', message: '' }),
      }
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/empty/i);
  });
});

// ---------------------------------------------------------------------------
describe('Regression — User Profile API', () => {
  beforeEach(() => {
    global.fetch = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 7. 사용자 프로필 조회
  // -------------------------------------------------------------------------
  test('GET /Backend_APIs/user-profile — 프로필 반환 (200)', async () => {
    const mockProfile = {
      id: 'user-abc',
      email: 'user@example.com',
      name: '홍길동',
      avatar_url: 'https://example.com/avatar.jpg',
      plan: 'pro',
      chatbot_count: 3,
      created_at: '2025-12-01T00:00:00Z',
    };
    global.fetch = mockFetch(200, { success: true, data: mockProfile });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/user-profile`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('email');
    expect(data.data).toHaveProperty('plan');
    expect(data.data).toHaveProperty('chatbot_count');
  });

  // -------------------------------------------------------------------------
  // 8. 프로필 조회 — 인증 없을 때 401
  // -------------------------------------------------------------------------
  test('GET /Backend_APIs/user-profile — 인증 없을 때 401', async () => {
    global.fetch = mockFetch(401, { success: false, error: 'Unauthorized' });

    const response = await fetch(`${BASE_URL}/api/Backend_APIs/user-profile`);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe('Regression — Bot Manage API', () => {
  beforeEach(() => {
    global.fetch = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 9. 봇 생성 — 성공
  // -------------------------------------------------------------------------
  test('POST /Backend_APIs/bot-manage?action=create — 봇 생성 성공 (201)', async () => {
    const mockBot = {
      id: 'bot-003',
      name: '신규봇',
      model: 'claude-sonnet-4-6',
      system_prompt: '당신은 친절한 도우미입니다.',
      is_active: true,
      created_at: '2026-03-05T00:00:00Z',
    };
    global.fetch = mockFetch(201, { success: true, data: mockBot });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/bot-manage?action=create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({
          name: '신규봇',
          model: 'claude-sonnet-4-6',
          system_prompt: '당신은 친절한 도우미입니다.',
        }),
      }
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.data.name).toBe('신규봇');
    expect(data.data.is_active).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 10. 봇 생성 — 이름 없음 → 400
  // -------------------------------------------------------------------------
  test('POST /Backend_APIs/bot-manage?action=create — 이름 누락 시 400', async () => {
    global.fetch = mockFetch(400, {
      success: false,
      error: 'Bot name is required',
    });

    const response = await fetch(
      `${BASE_URL}/api/Backend_APIs/bot-manage?action=create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({ model: 'claude-sonnet-4-6' }),
      }
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/name/i);
  });
});
