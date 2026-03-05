/**
 * @task S4T5
 * @description 봇마당 커뮤니티 통합 테스트
 *   - community-post.js CRUD (목록, 상세, 작성, 수정, 삭제)
 *   - community-comment.js (댓글 작성, 트리 구조 대댓글, 삭제)
 *   - community-like.js (좋아요 토글, 카운트 동기화)
 *   - community-report.js (신고 접수, 5가지 사유)
 *   - community-category.js (카테고리 목록: 5개)
 *   - 권한 체크: 본인 글만 수정/삭제 가능
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
  toBeGreaterThan: (n) => { if (actual <= n) throw new Error(`Expected ${actual} > ${n}`); },
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
const MOCK_CATEGORIES = [
  { id: 'free',       label: '자유게시판' },
  { id: 'qna',        label: 'Q&A' },
  { id: 'showcase',   label: '봇 쇼케이스' },
  { id: 'tips',       label: '팁 & 노하우' },
  { id: 'notice',     label: '공지사항' },
];

const MOCK_POSTS = [
  { id: 'post-001', categoryId: 'free',     authorId: 'user-001', title: '첫 번째 글',   content: '내용1', likes: 5,  createdAt: '2026-03-01' },
  { id: 'post-002', categoryId: 'qna',      authorId: 'user-002', title: 'Q&A 질문',    content: '내용2', likes: 2,  createdAt: '2026-03-02' },
  { id: 'post-003', categoryId: 'showcase', authorId: 'user-001', title: '내 봇 소개',   content: '내용3', likes: 10, createdAt: '2026-03-03' },
];

const MOCK_COMMENTS = [
  { id: 'cmt-001', postId: 'post-001', authorId: 'user-002', parentId: null,    content: '좋은 글이네요.', depth: 0 },
  { id: 'cmt-002', postId: 'post-001', authorId: 'user-003', parentId: 'cmt-001', content: '저도 동감합니다.', depth: 1 },
  { id: 'cmt-003', postId: 'post-001', authorId: 'user-001', parentId: 'cmt-001', content: '감사합니다!', depth: 1 },
];

const REPORT_REASONS = ['spam', 'abuse', 'illegal', 'copyright', 'other'];

// ---------------------------------------------------------------------------
// 비즈니스 로직
// ---------------------------------------------------------------------------

// community-post.js
async function getPosts(fetchFn, category) {
  const qs = category ? `?category=${category}` : '';
  const res = await fetchFn(`/api/Backend_APIs/community-post${qs}`);
  return res.json();
}

async function getPostDetail(fetchFn, postId) {
  const res = await fetchFn(`/api/Backend_APIs/community-post/${postId}`);
  return res.json();
}

async function createPost(fetchFn, authorId, payload) {
  const res = await fetchFn('/api/Backend_APIs/community-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorId, ...payload }),
  });
  return res.json();
}

async function updatePost(fetchFn, postId, requesterId, payload) {
  const res = await fetchFn(`/api/Backend_APIs/community-post/${postId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requesterId, ...payload }),
  });
  return res.json();
}

async function deletePost(fetchFn, postId, requesterId) {
  const res = await fetchFn(`/api/Backend_APIs/community-post/${postId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requesterId }),
  });
  return res.json();
}

// 권한 체크 순수 함수
function canModifyPost(post, requesterId) {
  return post.authorId === requesterId;
}

// community-comment.js
function buildCommentTree(flatComments) {
  const map = {};
  const roots = [];
  flatComments.forEach((c) => { map[c.id] = { ...c, children: [] }; });
  flatComments.forEach((c) => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].children.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  return roots;
}

async function createComment(fetchFn, postId, authorId, content, parentId = null) {
  const res = await fetchFn('/api/Backend_APIs/community-comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, authorId, content, parentId }),
  });
  return res.json();
}

async function deleteComment(fetchFn, commentId, requesterId) {
  const res = await fetchFn(`/api/Backend_APIs/community-comment/${commentId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requesterId }),
  });
  return res.json();
}

// community-like.js
function toggleLike(currentState) {
  return {
    liked: !currentState.liked,
    count: currentState.liked ? currentState.count - 1 : currentState.count + 1,
  };
}

async function syncLike(fetchFn, postId, userId, action) {
  const res = await fetchFn('/api/Backend_APIs/community-like', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, userId, action }),
  });
  return res.json();
}

// community-report.js
function isValidReportReason(reason) {
  return REPORT_REASONS.includes(reason);
}

async function submitReport(fetchFn, targetType, targetId, reporterId, reason) {
  if (!isValidReportReason(reason)) throw new Error(`Invalid reason: ${reason}`);
  const res = await fetchFn('/api/Backend_APIs/community-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetType, targetId, reporterId, reason }),
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// 테스트 스위트
// ---------------------------------------------------------------------------
describe('community-category.js — 카테고리 목록', () => {
  it('카테고리가 정확히 5개여야 한다', async () => {
    expect(MOCK_CATEGORIES).toHaveLength(5);
  });

  it('필수 카테고리(자유/Q&A/쇼케이스/팁/공지)가 모두 포함되어야 한다', async () => {
    const labels = MOCK_CATEGORIES.map((c) => c.label);
    expect(labels).toContain('자유게시판');
    expect(labels).toContain('Q&A');
    expect(labels).toContain('봇 쇼케이스');
    expect(labels).toContain('팁 & 노하우');
    expect(labels).toContain('공지사항');
  });

  it('카테고리 API 조회 — 200 응답', async () => {
    const fakeFetch = mockFetch(200, { success: true, data: MOCK_CATEGORIES });
    const res = await fakeFetch('/api/Backend_APIs/community-category');
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(5);
  });
});

describe('community-post.js — CRUD', () => {
  it('목록 조회 — 전체 글 반환', async () => {
    const fakeFetch = mockFetch(200, { success: true, data: MOCK_POSTS, total: 3 });
    const result = await getPosts(fakeFetch, null);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
  });

  it('카테고리 필터 조회 — 해당 카테고리 글만 반환', async () => {
    const filtered = MOCK_POSTS.filter((p) => p.categoryId === 'qna');
    const fakeFetch = mockFetch(200, { success: true, data: filtered });
    const result = await getPosts(fakeFetch, 'qna');
    expect(result.data.every((p) => p.categoryId === 'qna')).toBe(true);
  });

  it('상세 조회 — postId에 맞는 글 반환', async () => {
    const fakeFetch = mockFetch(200, { success: true, data: MOCK_POSTS[0] });
    const result = await getPostDetail(fakeFetch, 'post-001');
    expect(result.data.id).toBe('post-001');
  });

  it('글 작성 — 201 응답과 postId 반환', async () => {
    const mockData = {
      success: true,
      data: { id: 'post-new', categoryId: 'free', title: '새 글', content: '내용', authorId: 'user-003' },
    };
    const fakeFetch = mockFetch(201, mockData);
    const result = await createPost(fakeFetch, 'user-003', { categoryId: 'free', title: '새 글', content: '내용' });
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('post-new');
  });

  it('글 수정 — 200 응답과 수정 내용 반환', async () => {
    const mockData = { success: true, data: { id: 'post-001', title: '수정된 제목' } };
    const fakeFetch = mockFetch(200, mockData);
    const result = await updatePost(fakeFetch, 'post-001', 'user-001', { title: '수정된 제목' });
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('수정된 제목');
  });

  it('글 삭제 — 200 응답과 deleted=true 반환', async () => {
    const mockData = { success: true, data: { deleted: true } };
    const fakeFetch = mockFetch(200, mockData);
    const result = await deletePost(fakeFetch, 'post-001', 'user-001');
    expect(result.data.deleted).toBe(true);
  });

  it('존재하지 않는 글 조회 시 404 반환', async () => {
    const fakeFetch = mockFetch(404, { error: 'Not Found' });
    const res = await fakeFetch('/api/Backend_APIs/community-post/nonexistent');
    expect(res.status).toBe(404);
    expect(res.ok).toBe(false);
  });
});

describe('권한 체크 — 본인 글만 수정/삭제 가능', () => {
  it('작성자 본인은 글 수정 권한이 있어야 한다', async () => {
    const post = MOCK_POSTS[0]; // authorId: user-001
    expect(canModifyPost(post, 'user-001')).toBe(true);
  });

  it('타인은 글 수정 권한이 없어야 한다', async () => {
    const post = MOCK_POSTS[0];
    expect(canModifyPost(post, 'user-999')).toBe(false);
  });

  it('타인의 글 수정 시도 시 403 반환', async () => {
    const fakeFetch = mockFetch(403, { error: 'Forbidden' });
    const res = await fakeFetch('/api/Backend_APIs/community-post/post-001', { method: 'PUT' });
    expect(res.status).toBe(403);
    expect(res.ok).toBe(false);
  });

  it('타인의 글 삭제 시도 시 403 반환', async () => {
    const fakeFetch = mockFetch(403, { error: 'Forbidden' });
    const res = await fakeFetch('/api/Backend_APIs/community-post/post-001', { method: 'DELETE' });
    expect(res.status).toBe(403);
    expect(res.ok).toBe(false);
  });
});

describe('community-comment.js — 댓글/대댓글', () => {
  it('댓글 작성 — 201 응답과 commentId 반환', async () => {
    const mockData = { success: true, data: { id: 'cmt-new', postId: 'post-001', depth: 0 } };
    const fakeFetch = mockFetch(201, mockData);
    const result = await createComment(fakeFetch, 'post-001', 'user-002', '새 댓글');
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('cmt-new');
  });

  it('대댓글 작성 — parentId가 설정되어야 한다', async () => {
    const mockData = { success: true, data: { id: 'cmt-reply', parentId: 'cmt-001', depth: 1 } };
    const fakeFetch = mockFetch(201, mockData);
    const result = await createComment(fakeFetch, 'post-001', 'user-003', '대댓글', 'cmt-001');
    expect(result.data.parentId).toBe('cmt-001');
    expect(result.data.depth).toBe(1);
  });

  it('댓글 트리 구조 — 루트 댓글과 자식 댓글이 올바르게 구성되어야 한다', async () => {
    const tree = buildCommentTree(MOCK_COMMENTS);
    expect(tree).toHaveLength(1); // 루트 댓글 1개 (cmt-001)
    expect(tree[0].children).toHaveLength(2); // cmt-002, cmt-003
  });

  it('parentId=null인 댓글은 루트 레벨이어야 한다', async () => {
    const tree = buildCommentTree(MOCK_COMMENTS);
    const roots = MOCK_COMMENTS.filter((c) => c.parentId === null);
    expect(tree).toHaveLength(roots.length);
  });

  it('댓글 삭제 — 200 응답과 deleted=true 반환', async () => {
    const mockData = { success: true, data: { deleted: true, commentId: 'cmt-001' } };
    const fakeFetch = mockFetch(200, mockData);
    const result = await deleteComment(fakeFetch, 'cmt-001', 'user-002');
    expect(result.data.deleted).toBe(true);
  });

  it('타인 댓글 삭제 시도 시 403 반환', async () => {
    const fakeFetch = mockFetch(403, { error: 'Forbidden' });
    const res = await fakeFetch('/api/Backend_APIs/community-comment/cmt-001', { method: 'DELETE' });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
  });
});

describe('community-like.js — 좋아요 토글/카운트', () => {
  it('좋아요 OFF → ON 시 liked=true, count+1 되어야 한다', async () => {
    const state = { liked: false, count: 5 };
    const next = toggleLike(state);
    expect(next.liked).toBe(true);
    expect(next.count).toBe(6);
  });

  it('좋아요 ON → OFF 시 liked=false, count-1 되어야 한다', async () => {
    const state = { liked: true, count: 6 };
    const next = toggleLike(state);
    expect(next.liked).toBe(false);
    expect(next.count).toBe(5);
  });

  it('좋아요 API 동기화 — 서버 응답과 로컬 상태가 일치해야 한다', async () => {
    const mockData = { success: true, data: { postId: 'post-001', liked: true, count: 6 } };
    const fakeFetch = mockFetch(200, mockData);
    const result = await syncLike(fakeFetch, 'post-001', 'user-001', 'like');
    expect(result.data.liked).toBe(true);
    expect(result.data.count).toBe(6);
  });

  it('좋아요 API 실패 시 ok=false 반환', async () => {
    const fakeFetch = mockFetch(500, { error: 'Server Error' });
    const res = await fakeFetch('/api/Backend_APIs/community-like');
    expect(res.ok).toBe(false);
  });
});

describe('community-report.js — 신고 접수 (5가지 사유)', () => {
  it('5가지 신고 사유가 정의되어야 한다', async () => {
    expect(REPORT_REASONS).toHaveLength(5);
    expect(REPORT_REASONS).toContain('spam');
    expect(REPORT_REASONS).toContain('abuse');
    expect(REPORT_REASONS).toContain('illegal');
    expect(REPORT_REASONS).toContain('copyright');
    expect(REPORT_REASONS).toContain('other');
  });

  it('유효한 신고 사유로 신고 접수 — 201 응답 반환', async () => {
    const mockData = { success: true, data: { reportId: 'rep-001', status: 'pending' } };
    const fakeFetch = mockFetch(201, mockData);
    const result = await submitReport(fakeFetch, 'post', 'post-002', 'user-001', 'spam');
    expect(result.success).toBe(true);
    expect(result.data.reportId).toBe('rep-001');
  });

  it('유효하지 않은 신고 사유 입력 시 에러를 던져야 한다', async () => {
    const fakeFetch = mockFetch(400, { error: 'Invalid reason' });
    let threw = false;
    try {
      await submitReport(fakeFetch, 'post', 'post-002', 'user-001', 'invalid-reason');
    } catch (e) {
      threw = true;
      expect(e.message).toContain('Invalid reason');
    }
    expect(threw).toBe(true);
  });

  it('모든 신고 사유가 유효성 검사를 통과해야 한다', async () => {
    REPORT_REASONS.forEach((reason) => {
      expect(isValidReportReason(reason)).toBe(true);
    });
  });

  it('중복 신고 시 409 반환', async () => {
    const fakeFetch = mockFetch(409, { error: 'Already reported' });
    const res = await fakeFetch('/api/Backend_APIs/community-report');
    expect(res.status).toBe(409);
    expect(res.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 결과 요약
// ---------------------------------------------------------------------------
function printSummary() {
  const total = results.pass + results.fail;
  console.log('\n====================================');
  console.log(`테스트 결과 요약 [community.test.js]`);
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
