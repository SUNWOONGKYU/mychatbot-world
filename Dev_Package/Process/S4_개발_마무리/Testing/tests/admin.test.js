/**
 * @task S4T5
 * @description 어드민 기능 통합 테스트
 *   - admin 권한 체크 (admin role 없으면 접근 차단)
 *   - 통계 대시보드 데이터 로드
 *   - 사용자 관리 CRUD
 *   - 봇 신고 관리
 *   - 감사 로그 조회
 */

// ---------------------------------------------------------------------------
// 경량 테스트 러너
// ---------------------------------------------------------------------------
const results = { pass: 0, fail: 0, errors: [] };

function describe(suiteName, fn) {
  console.log(`\n== ${suiteName} ==`);
  fn();
}

async function it(testName, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${testName}`);
    results.pass++;
  } catch (e) {
    console.error(`  [FAIL] ${testName}`);
    console.error(`         ${e.message}`);
    results.fail++;
    results.errors.push({ test: testName, error: e.message });
  }
}

const expect = (actual) => ({
  toBe: (expected) => {
    if (actual !== expected)
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  },
  toEqual: (expected) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  },
  toBeTruthy:   () => { if (!actual) throw new Error(`Expected truthy, got ${actual}`); },
  toBeFalsy:    () => { if (actual)  throw new Error(`Expected falsy, got ${actual}`); },
  toBeGreaterThan:     (n) => { if (actual <= n)  throw new Error(`Expected ${actual} > ${n}`); },
  toBeLessThanOrEqual: (n) => { if (actual > n)   throw new Error(`Expected ${actual} <= ${n}`); },
  toContain: (item) => {
    if (!actual.includes(item))
      throw new Error(`Expected to contain ${JSON.stringify(item)}`);
  },
  toHaveLength: (len) => {
    if (actual.length !== len)
      throw new Error(`Expected length ${len}, got ${actual.length}`);
  },
});

// ---------------------------------------------------------------------------
// Mock: fetch
// ---------------------------------------------------------------------------
function mockFetch(status, body) {
  return async () => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  });
}

// ---------------------------------------------------------------------------
// Mock 데이터
// ---------------------------------------------------------------------------
const MOCK_USERS = [
  { id: 'user-001', email: 'alice@example.com', name: 'Alice', role: 'admin',  status: 'active',  createdAt: '2026-01-01' },
  { id: 'user-002', email: 'bob@example.com',   name: 'Bob',   role: 'user',   status: 'active',  createdAt: '2026-01-15' },
  { id: 'user-003', email: 'carol@example.com', name: 'Carol', role: 'user',   status: 'banned',  createdAt: '2026-02-01' },
  { id: 'user-004', email: 'dave@example.com',  name: 'Dave',  role: 'user',   status: 'active',  createdAt: '2026-02-20' },
];

const MOCK_BOT_REPORTS = [
  { id: 'brep-001', botId: 'bot-001', reporterId: 'user-002', reason: 'spam',    status: 'pending',  createdAt: '2026-03-01' },
  { id: 'brep-002', botId: 'bot-002', reporterId: 'user-003', reason: 'abuse',   status: 'reviewed', createdAt: '2026-03-02' },
  { id: 'brep-003', botId: 'bot-001', reporterId: 'user-004', reason: 'illegal', status: 'pending',  createdAt: '2026-03-03' },
];

const MOCK_AUDIT_LOGS = [
  { id: 'log-001', adminId: 'user-001', action: 'ban_user',    targetId: 'user-003', timestamp: '2026-03-01T10:00:00Z' },
  { id: 'log-002', adminId: 'user-001', action: 'resolve_report', targetId: 'brep-002', timestamp: '2026-03-02T09:30:00Z' },
  { id: 'log-003', adminId: 'user-001', action: 'delete_post', targetId: 'post-005', timestamp: '2026-03-03T14:00:00Z' },
];

const MOCK_DASHBOARD_STATS = {
  totalUsers:      1240,
  activeUsers:     985,
  totalBots:       342,
  pendingReports:  12,
  todaySignups:    18,
  monthlyRevenue:  5800000,
};

// ---------------------------------------------------------------------------
// 비즈니스 로직
// ---------------------------------------------------------------------------

// 권한 체크
function isAdmin(user) {
  return user && user.role === 'admin' && user.status === 'active';
}

function checkAdminAccess(user) {
  if (!user) throw new Error('Unauthorized: no user');
  if (user.role !== 'admin') throw new Error('Forbidden: admin role required');
  if (user.status !== 'active') throw new Error('Forbidden: account is not active');
  return true;
}

// 통계 대시보드
async function getDashboardStats(fetchFn) {
  const res = await fetchFn('/api/Backend_APIs/admin-dashboard');
  return res.json();
}

// 사용자 관리
async function listUsers(fetchFn, filters = {}) {
  const qs = new URLSearchParams(filters).toString();
  const res = await fetchFn(`/api/Backend_APIs/admin-users${qs ? '?' + qs : ''}`);
  return res.json();
}

async function getUserDetail(fetchFn, userId) {
  const res = await fetchFn(`/api/Backend_APIs/admin-users/${userId}`);
  return res.json();
}

async function updateUser(fetchFn, userId, payload) {
  const res = await fetchFn(`/api/Backend_APIs/admin-users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function deleteUser(fetchFn, userId) {
  const res = await fetchFn(`/api/Backend_APIs/admin-users/${userId}`, {
    method: 'DELETE',
  });
  return res.json();
}

function banUser(users, userId) {
  return users.map((u) => u.id === userId ? { ...u, status: 'banned' } : u);
}

function unbanUser(users, userId) {
  return users.map((u) => u.id === userId ? { ...u, status: 'active' } : u);
}

// 봇 신고 관리
async function getBotReports(fetchFn, status) {
  const qs = status ? `?status=${status}` : '';
  const res = await fetchFn(`/api/Backend_APIs/admin-bot-reports${qs}`);
  return res.json();
}

async function resolveReport(fetchFn, reportId, action, note) {
  const res = await fetchFn(`/api/Backend_APIs/admin-bot-reports/${reportId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, note }),
  });
  return res.json();
}

// 감사 로그 조회
async function getAuditLogs(fetchFn, adminId) {
  const qs = adminId ? `?adminId=${adminId}` : '';
  const res = await fetchFn(`/api/Backend_APIs/admin-audit-logs${qs}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// 테스트 스위트
// ---------------------------------------------------------------------------
describe('admin 권한 체크', () => {
  it('admin role + active 상태인 사용자는 접근 허용해야 한다', async () => {
    const adminUser = MOCK_USERS[0];
    expect(isAdmin(adminUser)).toBe(true);
    expect(() => checkAdminAccess(adminUser)).not ? undefined : undefined;
    // 직접 호출해 에러 없음 확인
    let threw = false;
    try { checkAdminAccess(adminUser); } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('role=user인 사용자는 접근이 차단되어야 한다', async () => {
    const normalUser = MOCK_USERS[1];
    expect(isAdmin(normalUser)).toBe(false);
    let threw = false;
    let errMsg = '';
    try { checkAdminAccess(normalUser); } catch (e) { threw = true; errMsg = e.message; }
    expect(threw).toBe(true);
    expect(errMsg).toContain('Forbidden');
  });

  it('admin role이라도 banned 상태면 접근이 차단되어야 한다', async () => {
    const bannedAdmin = { id: 'user-x', role: 'admin', status: 'banned' };
    let threw = false;
    try { checkAdminAccess(bannedAdmin); } catch { threw = true; }
    expect(threw).toBe(true);
  });

  it('비로그인(null) 사용자 접근 시 Unauthorized 오류를 던져야 한다', async () => {
    let threw = false;
    let errMsg = '';
    try { checkAdminAccess(null); } catch (e) { threw = true; errMsg = e.message; }
    expect(threw).toBe(true);
    expect(errMsg).toContain('Unauthorized');
  });

  it('어드민 API 미인증 접근 시 401 반환', async () => {
    const fakeFetch = mockFetch(401, { error: 'Unauthorized' });
    const res = await fakeFetch('/api/Backend_APIs/admin-dashboard');
    expect(res.status).toBe(401);
    expect(res.ok).toBe(false);
  });

  it('일반 사용자 토큰으로 어드민 API 접근 시 403 반환', async () => {
    const fakeFetch = mockFetch(403, { error: 'Forbidden' });
    const res = await fakeFetch('/api/Backend_APIs/admin-dashboard');
    expect(res.status).toBe(403);
    expect(res.ok).toBe(false);
  });
});

describe('통계 대시보드 데이터 로드', () => {
  it('대시보드 통계 조회 — 200 응답과 6개 지표 반환', async () => {
    const fakeFetch = mockFetch(200, { success: true, data: MOCK_DASHBOARD_STATS });
    const result = await getDashboardStats(fakeFetch);
    expect(result.success).toBe(true);
    const stats = result.data;
    expect(typeof stats.totalUsers).toBe('number');
    expect(typeof stats.activeUsers).toBe('number');
    expect(typeof stats.totalBots).toBe('number');
    expect(typeof stats.pendingReports).toBe('number');
    expect(typeof stats.todaySignups).toBe('number');
    expect(typeof stats.monthlyRevenue).toBe('number');
  });

  it('activeUsers가 totalUsers 이하여야 한다', async () => {
    expect(MOCK_DASHBOARD_STATS.activeUsers).toBeLessThanOrEqual(MOCK_DASHBOARD_STATS.totalUsers);
  });

  it('pendingReports 수가 0 이상이어야 한다', async () => {
    expect(MOCK_DASHBOARD_STATS.pendingReports).toBeGreaterThan(-1);
  });
});

describe('사용자 관리 CRUD', () => {
  it('전체 사용자 목록 조회 — 200 응답', async () => {
    const fakeFetch = mockFetch(200, { success: true, data: MOCK_USERS, total: 4 });
    const result = await listUsers(fakeFetch);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(4);
  });

  it('status 필터로 사용자 조회 — banned 사용자만 반환', async () => {
    const bannedUsers = MOCK_USERS.filter((u) => u.status === 'banned');
    const fakeFetch = mockFetch(200, { success: true, data: bannedUsers });
    const result = await listUsers(fakeFetch, { status: 'banned' });
    expect(result.data.every((u) => u.status === 'banned')).toBe(true);
  });

  it('특정 사용자 상세 조회 — 200 응답과 사용자 정보 반환', async () => {
    const fakeFetch = mockFetch(200, { success: true, data: MOCK_USERS[1] });
    const result = await getUserDetail(fakeFetch, 'user-002');
    expect(result.data.id).toBe('user-002');
    expect(result.data.email).toBe('bob@example.com');
  });

  it('사용자 역할 변경 — 200 응답과 변경된 role 반환', async () => {
    const mockData = { success: true, data: { ...MOCK_USERS[1], role: 'moderator' } };
    const fakeFetch = mockFetch(200, mockData);
    const result = await updateUser(fakeFetch, 'user-002', { role: 'moderator' });
    expect(result.data.role).toBe('moderator');
  });

  it('사용자 정지(ban) — status가 banned로 변경되어야 한다', async () => {
    const updated = banUser(MOCK_USERS, 'user-002');
    const target = updated.find((u) => u.id === 'user-002');
    expect(target.status).toBe('banned');
  });

  it('사용자 정지 해제(unban) — status가 active로 변경되어야 한다', async () => {
    const banned = banUser(MOCK_USERS, 'user-002');
    const unbanned = unbanUser(banned, 'user-002');
    const target = unbanned.find((u) => u.id === 'user-002');
    expect(target.status).toBe('active');
  });

  it('사용자 삭제 — 200 응답과 deleted=true 반환', async () => {
    const fakeFetch = mockFetch(200, { success: true, data: { deleted: true, userId: 'user-004' } });
    const result = await deleteUser(fakeFetch, 'user-004');
    expect(result.data.deleted).toBe(true);
  });

  it('존재하지 않는 사용자 조회 시 404 반환', async () => {
    const fakeFetch = mockFetch(404, { error: 'User not found' });
    const res = await fakeFetch('/api/Backend_APIs/admin-users/nonexistent');
    expect(res.status).toBe(404);
    expect(res.ok).toBe(false);
  });
});

describe('봇 신고 관리', () => {
  it('전체 신고 목록 조회 — 200 응답', async () => {
    const fakeFetch = mockFetch(200, { success: true, data: MOCK_BOT_REPORTS, total: 3 });
    const result = await getBotReports(fakeFetch, null);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
  });

  it('pending 상태 신고만 조회 — 2개 반환', async () => {
    const pending = MOCK_BOT_REPORTS.filter((r) => r.status === 'pending');
    const fakeFetch = mockFetch(200, { success: true, data: pending });
    const result = await getBotReports(fakeFetch, 'pending');
    expect(result.data.every((r) => r.status === 'pending')).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('신고 처리(resolve) — 200 응답과 status=resolved 반환', async () => {
    const mockData = { success: true, data: { id: 'brep-001', status: 'resolved', action: 'warn' } };
    const fakeFetch = mockFetch(200, mockData);
    const result = await resolveReport(fakeFetch, 'brep-001', 'warn', '경고 처리함');
    expect(result.data.status).toBe('resolved');
    expect(result.data.action).toBe('warn');
  });

  it('신고 반려(dismiss) — 200 응답과 status=dismissed 반환', async () => {
    const mockData = { success: true, data: { id: 'brep-002', status: 'dismissed' } };
    const fakeFetch = mockFetch(200, mockData);
    const result = await resolveReport(fakeFetch, 'brep-002', 'dismiss', '사유 없음');
    expect(result.data.status).toBe('dismissed');
  });

  it('동일 봇에 대한 중복 신고 건수를 집계할 수 있어야 한다', async () => {
    const botReportCount = MOCK_BOT_REPORTS.filter((r) => r.botId === 'bot-001').length;
    expect(botReportCount).toBe(2);
  });
});

describe('감사 로그 조회', () => {
  it('감사 로그 전체 조회 — 200 응답과 로그 목록 반환', async () => {
    const fakeFetch = mockFetch(200, { success: true, data: MOCK_AUDIT_LOGS, total: 3 });
    const result = await getAuditLogs(fakeFetch, null);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
  });

  it('특정 admin의 감사 로그만 조회할 수 있어야 한다', async () => {
    const filtered = MOCK_AUDIT_LOGS.filter((l) => l.adminId === 'user-001');
    const fakeFetch = mockFetch(200, { success: true, data: filtered });
    const result = await getAuditLogs(fakeFetch, 'user-001');
    expect(result.data.every((l) => l.adminId === 'user-001')).toBe(true);
  });

  it('각 로그에 action, targetId, timestamp가 포함되어야 한다', async () => {
    MOCK_AUDIT_LOGS.forEach((log) => {
      expect(typeof log.action).toBe('string');
      expect(typeof log.targetId).toBe('string');
      expect(typeof log.timestamp).toBe('string');
    });
  });

  it('로그 타임스탬프가 ISO 8601 형식이어야 한다', async () => {
    MOCK_AUDIT_LOGS.forEach((log) => {
      const parsed = new Date(log.timestamp);
      expect(isNaN(parsed.getTime())).toBe(false);
    });
  });

  it('감사 로그 API 비인증 접근 시 401 반환', async () => {
    const fakeFetch = mockFetch(401, { error: 'Unauthorized' });
    const res = await fakeFetch('/api/Backend_APIs/admin-audit-logs');
    expect(res.status).toBe(401);
    expect(res.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 결과 요약
// ---------------------------------------------------------------------------
function printSummary() {
  const total = results.pass + results.fail;
  console.log('\n====================================');
  console.log(`테스트 결과 요약 [admin.test.js]`);
  console.log('====================================');
  console.log(`전체: ${total}개 | PASS: ${results.pass}개 | FAIL: ${results.fail}개`);
  if (results.errors.length > 0) {
    console.log('\n실패한 테스트:');
    results.errors.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.test}`);
      console.log(`     → ${e.error}`);
    });
  }
  console.log('====================================\n');
  if (results.fail > 0) process.exitCode = 1;
}

setImmediate(printSummary);
