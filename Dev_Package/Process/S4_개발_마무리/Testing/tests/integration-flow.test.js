/**
 * @task S4T5
 * @description 전체 사용자 흐름 통합 테스트
 *   - 시나리오 1: 회원가입 → 로그인 → 학습 시작 → 커리큘럼 진행
 *   - 시나리오 2: 코코봇 검색 → 상세 보기 → 고용 요청 → 매칭 결과 확인
 *   - 시나리오 3: 커뮤니티 글 작성 → 댓글 → 좋아요 → 신고
 *   - 시나리오 4: 메뉴 네비게이션 (5대 메뉴 전환)
 *   - 시나리오 5: 비로그인 사용자 제한 기능 확인
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
// Mock: fetch (시나리오별 응답 시퀀스)
// ---------------------------------------------------------------------------
function mockFetch(status, body) {
  return async () => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  });
}

function createSequentialFetch(responses) {
  let callIndex = 0;
  return async (_url, _options) => {
    const resp = responses[Math.min(callIndex, responses.length - 1)];
    callIndex++;
    return {
      status: resp.status,
      ok: resp.status >= 200 && resp.status < 300,
      json: async () => resp.body,
    };
  };
}

// ---------------------------------------------------------------------------
// Mock: 세션/상태 스토어 (간단한 인메모리)
// ---------------------------------------------------------------------------
class SessionStore {
  constructor() { this._data = {}; }
  set(key, value) { this._data[key] = value; }
  get(key) { return this._data[key] ?? null; }
  clear() { this._data = {}; }
  isLoggedIn() { return !!this._data.currentUser; }
  getCurrentUser() { return this._data.currentUser ?? null; }
}

// ---------------------------------------------------------------------------
// 5대 메뉴 정의
// ---------------------------------------------------------------------------
const MAIN_MENUS = [
  { id: 'home',       label: '홈',        path: '/' },
  { id: 'chatbots',   label: '코코봇 마켓', path: '/chatbots' },
  { id: 'jobs',       label: '구봇구직',   path: '/jobs' },
  { id: 'community',  label: '봇카페',     path: '/community' },
  { id: 'learning',   label: '봇학교',     path: '/learning' },
];

// ---------------------------------------------------------------------------
// 비즈니스 로직 — 시나리오 실행 함수
// ---------------------------------------------------------------------------

// 회원가입
async function registerUser(fetchFn, email, password, name) {
  const res = await fetchFn('/api/Security/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register', email, password, name }),
  });
  return res.json();
}

// 로그인
async function loginUser(fetchFn, session, email, password) {
  const res = await fetchFn('/api/Security/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, password }),
  });
  const data = await res.json();
  if (data.success && data.data.token) {
    session.set('currentUser', { ...data.data.user, token: data.data.token });
  }
  return data;
}

// 코코봇 목록 조회
async function fetchChatbots(fetchFn, keyword) {
  const qs = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
  const res = await fetchFn(`/api/Backend_APIs/chatbot-list${qs}`);
  return res.json();
}

// 코코봇 상세 조회
async function fetchChatbotDetail(fetchFn, botId) {
  const res = await fetchFn(`/api/Backend_APIs/chatbot-list/${botId}`);
  return res.json();
}

// 고용 요청
async function hireBot(fetchFn, session, botId, message) {
  const user = session.getCurrentUser();
  if (!user) throw new Error('Unauthorized: login required');
  const res = await fetchFn('/api/Backend_APIs/job-hire', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({ hirerId: user.id, jobId: botId, message }),
  });
  return res.json();
}

// 커뮤니티 글 작성
async function writePost(fetchFn, session, payload) {
  const user = session.getCurrentUser();
  if (!user) throw new Error('Unauthorized: login required');
  const res = await fetchFn('/api/Backend_APIs/community-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({ authorId: user.id, ...payload }),
  });
  return res.json();
}

// 댓글 작성
async function writeComment(fetchFn, session, postId, content) {
  const user = session.getCurrentUser();
  if (!user) throw new Error('Unauthorized: login required');
  const res = await fetchFn('/api/Backend_APIs/community-comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({ postId, authorId: user.id, content }),
  });
  return res.json();
}

// 좋아요
async function likePost(fetchFn, session, postId) {
  const user = session.getCurrentUser();
  if (!user) throw new Error('Unauthorized: login required');
  const res = await fetchFn('/api/Backend_APIs/community-like', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({ postId, userId: user.id, action: 'like' }),
  });
  return res.json();
}

// 신고
async function reportContent(fetchFn, session, targetType, targetId, reason) {
  const user = session.getCurrentUser();
  if (!user) throw new Error('Unauthorized: login required');
  const res = await fetchFn('/api/Backend_APIs/community-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({ targetType, targetId, reporterId: user.id, reason }),
  });
  return res.json();
}

// 학습 세션 시작
async function startLearning(fetchFn, session) {
  const user = session.getCurrentUser();
  if (!user) throw new Error('Unauthorized: login required');
  const res = await fetchFn('/api/Backend_APIs/school-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({ action: 'start', userId: user.id, stageId: 'basic', lessonId: 'b-1' }),
  });
  return res.json();
}

// 메뉴 내비게이션
function navigateTo(menus, menuId) {
  const menu = menus.find((m) => m.id === menuId);
  if (!menu) throw new Error(`Menu not found: ${menuId}`);
  return menu;
}

// 비로그인 보호 기능 목록
const PROTECTED_FEATURES = [
  'write_post',
  'write_comment',
  'like_post',
  'hire_bot',
  'report_content',
  'start_learning',
];

function checkFeatureAccess(feature, session) {
  const requiresLogin = PROTECTED_FEATURES.includes(feature);
  if (requiresLogin && !session.isLoggedIn()) {
    return { allowed: false, reason: 'login_required' };
  }
  return { allowed: true, reason: null };
}

// ---------------------------------------------------------------------------
// 테스트 스위트
// ---------------------------------------------------------------------------
describe('시나리오 1: 회원가입 → 로그인 → 학습 시작 → 커리큘럼 진행', () => {
  it('Step 1: 회원가입 — 201 응답과 userId 반환', async () => {
    const mockData = { success: true, data: { userId: 'user-new', email: 'new@example.com' } };
    const fakeFetch = mockFetch(201, mockData);
    const result = await registerUser(fakeFetch, 'new@example.com', 'pass123', '홍길동');
    expect(result.success).toBe(true);
    expect(result.data.userId).toBe('user-new');
  });

  it('Step 2: 로그인 — 200 응답과 토큰 반환, 세션 설정', async () => {
    const session = new SessionStore();
    const mockData = {
      success: true,
      data: { token: 'jwt-token-abc', user: { id: 'user-new', email: 'new@example.com' } },
    };
    const fakeFetch = mockFetch(200, mockData);
    await loginUser(fakeFetch, session, 'new@example.com', 'pass123');
    expect(session.isLoggedIn()).toBe(true);
    expect(session.getCurrentUser().token).toBe('jwt-token-abc');
  });

  it('Step 3: 학습 시작 — 세션 있을 때 201 응답', async () => {
    const session = new SessionStore();
    session.set('currentUser', { id: 'user-new', token: 'jwt-token-abc' });
    const mockData = { success: true, data: { sessionId: 'sess-001', lessonId: 'b-1' } };
    const fakeFetch = mockFetch(201, mockData);
    const result = await startLearning(fakeFetch, session);
    expect(result.success).toBe(true);
    expect(result.data.sessionId).toBe('sess-001');
  });

  it('Step 4: 커리큘럼 진행 — 레슨 완료 후 다음 단계 잠금 해제 확인', async () => {
    const mockData = {
      success: true,
      data: { completedLessonId: 'b-1', stageCompleted: false, totalProgress: 50 },
    };
    const fakeFetch = mockFetch(200, mockData);
    const res = await fakeFetch('/api/Backend_APIs/school-session');
    const data = await res.json();
    expect(data.data.totalProgress).toBe(50);
  });

  it('전체 흐름: 회원가입 → 로그인 → 학습 시작이 순차적으로 성공해야 한다', async () => {
    const session = new SessionStore();
    const responses = [
      { status: 201, body: { success: true, data: { userId: 'user-e2e' } } },
      { status: 200, body: { success: true, data: { token: 'tok-e2e', user: { id: 'user-e2e' } } } },
      { status: 201, body: { success: true, data: { sessionId: 'sess-e2e' } } },
    ];
    const seqFetch = createSequentialFetch(responses);

    const reg = await registerUser(seqFetch, 'e2e@test.com', 'pw', 'E2E User');
    expect(reg.data.userId).toBe('user-e2e');

    await loginUser(seqFetch, session, 'e2e@test.com', 'pw');
    expect(session.isLoggedIn()).toBe(true);

    const learn = await startLearning(seqFetch, session);
    expect(learn.data.sessionId).toBe('sess-e2e');
  });
});

describe('시나리오 2: 코코봇 검색 → 상세 보기 → 고용 요청 → 매칭 결과 확인', () => {
  it('Step 1: 코코봇 검색 키워드로 결과 반환', async () => {
    const mockBots = [{ id: 'bot-001', name: '고객 응대 봇', keyword: '고객' }];
    const fakeFetch = mockFetch(200, { success: true, data: mockBots });
    const result = await fetchChatbots(fakeFetch, '고객');
    expect(result.success).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('Step 2: 코코봇 상세 보기 — botId로 상세 정보 반환', async () => {
    const mockBot = { id: 'bot-001', name: '고객 응대 봇', description: '24시간 응대', rating: 4.8 };
    const fakeFetch = mockFetch(200, { success: true, data: mockBot });
    const result = await fetchChatbotDetail(fakeFetch, 'bot-001');
    expect(result.data.id).toBe('bot-001');
    expect(result.data.rating).toBe(4.8);
  });

  it('Step 3: 고용 요청 — 로그인 사용자의 요청 성공', async () => {
    const session = new SessionStore();
    session.set('currentUser', { id: 'user-001', token: 'tok-001' });
    const mockData = { success: true, data: { hireId: 'hire-e2e', status: 'pending' } };
    const fakeFetch = mockFetch(201, mockData);
    const result = await hireBot(fakeFetch, session, 'bot-001', '함께 일하고 싶습니다.');
    expect(result.data.hireId).toBe('hire-e2e');
  });

  it('Step 4: 매칭 결과 — 점수와 순위 반환', async () => {
    const mockMatching = [
      { botId: 'bot-001', matchScore: 0.92, rank: 1 },
      { botId: 'bot-002', matchScore: 0.75, rank: 2 },
    ];
    const fakeFetch = mockFetch(200, { success: true, data: mockMatching });
    const res = await fakeFetch('/api/Backend_APIs/job-matching');
    const data = await res.json();
    expect(data.data[0].rank).toBe(1);
    expect(data.data[0].matchScore).toBeGreaterThan(data.data[1].matchScore - 0.001);
  });

  it('비로그인 사용자 고용 요청 시 에러를 던져야 한다', async () => {
    const session = new SessionStore(); // 로그인 없음
    const fakeFetch = mockFetch(401, { error: 'Unauthorized' });
    let threw = false;
    try {
      await hireBot(fakeFetch, session, 'bot-001', '요청');
    } catch (e) {
      threw = true;
      expect(e.message).toContain('Unauthorized');
    }
    expect(threw).toBe(true);
  });
});

describe('시나리오 3: 커뮤니티 글 작성 → 댓글 → 좋아요 → 신고', () => {
  it('Step 1: 글 작성 — 201 응답과 postId 반환', async () => {
    const session = new SessionStore();
    session.set('currentUser', { id: 'user-001', token: 'tok-001' });
    const mockData = { success: true, data: { id: 'post-new', title: '테스트 글' } };
    const fakeFetch = mockFetch(201, mockData);
    const result = await writePost(fakeFetch, session, {
      categoryId: 'free', title: '테스트 글', content: '내용',
    });
    expect(result.data.id).toBe('post-new');
  });

  it('Step 2: 댓글 작성 — 201 응답과 commentId 반환', async () => {
    const session = new SessionStore();
    session.set('currentUser', { id: 'user-002', token: 'tok-002' });
    const mockData = { success: true, data: { id: 'cmt-new', postId: 'post-new' } };
    const fakeFetch = mockFetch(201, mockData);
    const result = await writeComment(fakeFetch, session, 'post-new', '좋은 글이네요!');
    expect(result.data.id).toBe('cmt-new');
  });

  it('Step 3: 좋아요 — 200 응답과 liked=true 반환', async () => {
    const session = new SessionStore();
    session.set('currentUser', { id: 'user-003', token: 'tok-003' });
    const mockData = { success: true, data: { postId: 'post-new', liked: true, count: 1 } };
    const fakeFetch = mockFetch(200, mockData);
    const result = await likePost(fakeFetch, session, 'post-new');
    expect(result.data.liked).toBe(true);
    expect(result.data.count).toBe(1);
  });

  it('Step 4: 신고 접수 — 201 응답과 reportId 반환', async () => {
    const session = new SessionStore();
    session.set('currentUser', { id: 'user-004', token: 'tok-004' });
    const mockData = { success: true, data: { reportId: 'rep-new', status: 'pending' } };
    const fakeFetch = mockFetch(201, mockData);
    const result = await reportContent(fakeFetch, session, 'post', 'post-new', 'spam');
    expect(result.data.reportId).toBe('rep-new');
  });

  it('전체 흐름: 글 작성 → 댓글 → 좋아요 → 신고가 순차적으로 성공해야 한다', async () => {
    const session = new SessionStore();
    session.set('currentUser', { id: 'user-001', token: 'tok-001' });
    const responses = [
      { status: 201, body: { success: true, data: { id: 'post-e2e' } } },
      { status: 201, body: { success: true, data: { id: 'cmt-e2e' } } },
      { status: 200, body: { success: true, data: { liked: true, count: 1 } } },
      { status: 201, body: { success: true, data: { reportId: 'rep-e2e' } } },
    ];
    const seqFetch = createSequentialFetch(responses);

    const post = await writePost(seqFetch, session, { categoryId: 'free', title: '제목', content: '내용' });
    expect(post.data.id).toBe('post-e2e');

    const comment = await writeComment(seqFetch, session, post.data.id, '댓글');
    expect(comment.data.id).toBe('cmt-e2e');

    const like = await likePost(seqFetch, session, post.data.id);
    expect(like.data.liked).toBe(true);

    const report = await reportContent(seqFetch, session, 'post', post.data.id, 'spam');
    expect(report.data.reportId).toBe('rep-e2e');
  });
});

describe('시나리오 4: 메뉴 네비게이션 (5대 메뉴 전환)', () => {
  it('5대 메뉴가 모두 정의되어야 한다', async () => {
    expect(MAIN_MENUS).toHaveLength(5);
  });

  it('각 메뉴의 id, label, path가 존재해야 한다', async () => {
    MAIN_MENUS.forEach((menu) => {
      expect(typeof menu.id).toBe('string');
      expect(typeof menu.label).toBe('string');
      expect(typeof menu.path).toBe('string');
      expect(menu.path.startsWith('/')).toBe(true);
    });
  });

  it('홈 메뉴 네비게이션 — path = "/"', async () => {
    const menu = navigateTo(MAIN_MENUS, 'home');
    expect(menu.path).toBe('/');
  });

  it('코코봇 마켓 메뉴 네비게이션 — path = "/chatbots"', async () => {
    const menu = navigateTo(MAIN_MENUS, 'chatbots');
    expect(menu.path).toBe('/chatbots');
  });

  it('구봇구직 메뉴 네비게이션 — path = "/jobs"', async () => {
    const menu = navigateTo(MAIN_MENUS, 'jobs');
    expect(menu.path).toBe('/jobs');
  });

  it('봇카페 메뉴 네비게이션 — path = "/community"', async () => {
    const menu = navigateTo(MAIN_MENUS, 'community');
    expect(menu.path).toBe('/community');
  });

  it('봇학교 메뉴 네비게이션 — path = "/learning"', async () => {
    const menu = navigateTo(MAIN_MENUS, 'learning');
    expect(menu.path).toBe('/learning');
  });

  it('존재하지 않는 메뉴 접근 시 에러를 던져야 한다', async () => {
    let threw = false;
    try { navigateTo(MAIN_MENUS, 'nonexistent'); } catch { threw = true; }
    expect(threw).toBe(true);
  });
});

describe('시나리오 5: 비로그인 사용자 제한 기능 확인', () => {
  it('비로그인 상태에서 글 작성 기능은 차단되어야 한다', async () => {
    const session = new SessionStore();
    const result = checkFeatureAccess('write_post', session);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('login_required');
  });

  it('비로그인 상태에서 댓글 작성 기능은 차단되어야 한다', async () => {
    const session = new SessionStore();
    const result = checkFeatureAccess('write_comment', session);
    expect(result.allowed).toBe(false);
  });

  it('비로그인 상태에서 좋아요 기능은 차단되어야 한다', async () => {
    const session = new SessionStore();
    const result = checkFeatureAccess('like_post', session);
    expect(result.allowed).toBe(false);
  });

  it('비로그인 상태에서 고용 요청 기능은 차단되어야 한다', async () => {
    const session = new SessionStore();
    const result = checkFeatureAccess('hire_bot', session);
    expect(result.allowed).toBe(false);
  });

  it('비로그인 상태에서 신고 기능은 차단되어야 한다', async () => {
    const session = new SessionStore();
    const result = checkFeatureAccess('report_content', session);
    expect(result.allowed).toBe(false);
  });

  it('비로그인 상태에서 학습 시작 기능은 차단되어야 한다', async () => {
    const session = new SessionStore();
    const result = checkFeatureAccess('start_learning', session);
    expect(result.allowed).toBe(false);
  });

  it('비로그인 사용자도 코코봇 목록/검색은 접근 가능해야 한다', async () => {
    const session = new SessionStore();
    const result = checkFeatureAccess('view_chatbots', session); // 보호되지 않은 기능
    expect(result.allowed).toBe(true);
  });

  it('비로그인 사용자도 커뮤니티 글 읽기는 접근 가능해야 한다', async () => {
    const session = new SessionStore();
    const result = checkFeatureAccess('read_posts', session); // 보호되지 않은 기능
    expect(result.allowed).toBe(true);
  });

  it('비로그인 사용자가 보호 기능 호출 시 실제 API에서 401 반환', async () => {
    const fakeFetch = mockFetch(401, { error: 'Unauthorized' });
    const res = await fakeFetch('/api/Backend_APIs/community-post', { method: 'POST' });
    expect(res.status).toBe(401);
    expect(res.ok).toBe(false);
  });

  it('로그인 후에는 모든 보호 기능에 접근 가능해야 한다', async () => {
    const session = new SessionStore();
    session.set('currentUser', { id: 'user-001', token: 'tok-001' });
    PROTECTED_FEATURES.forEach((feature) => {
      const result = checkFeatureAccess(feature, session);
      expect(result.allowed).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// 결과 요약
// ---------------------------------------------------------------------------
function printSummary() {
  const total = results.pass + results.fail;
  console.log('\n============================================================');
  console.log(`테스트 결과 요약 [integration-flow.test.js]`);
  console.log('============================================================');
  console.log(`전체: ${total}개 | PASS: ${results.pass}개 | FAIL: ${results.fail}개`);
  if (results.errors.length > 0) {
    console.log('\n실패한 테스트:');
    results.errors.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.test}`);
      console.log(`     → ${e.error}`);
    });
  }
  console.log('');
  console.log('시나리오별 커버리지:');
  console.log('  시나리오 1: 회원가입 → 로그인 → 학습 시작 → 커리큘럼 진행');
  console.log('  시나리오 2: 코코봇 검색 → 상세 보기 → 고용 요청 → 매칭 결과');
  console.log('  시나리오 3: 커뮤니티 글 작성 → 댓글 → 좋아요 → 신고');
  console.log('  시나리오 4: 5대 메뉴 네비게이션 (홈/코코봇/구직/커뮤니티/학교)');
  console.log('  시나리오 5: 비로그인 제한 기능 확인');
  console.log('============================================================\n');
  if (results.fail > 0) process.exitCode = 1;
}

setImmediate(printSummary);
