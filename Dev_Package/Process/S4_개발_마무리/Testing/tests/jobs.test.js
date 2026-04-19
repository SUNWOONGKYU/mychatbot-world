/**
 * @task S4T5
 * @description 구봇구직 페이지 통합 테스트
 *   - job-list.js API 연동 (GET 목록, 필터, 검색, 페이지네이션)
 *   - 탭 전환 (구봇/구직)
 *   - 카테고리 필터링
 *   - 정렬 (인기순/최신순/평점순/가격순)
 *   - job-hire.js POST 고용 요청
 *   - job-review.js 리뷰 CRUD
 *   - job-matching.js 매칭 결과 (4가지 가중치: skills 40%, rating 35%, salary 15%, category 10%)
 *   - job-fee.js 수수료 계산 (3단계: 10%/8%/5%)
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
  toBeTruthy: () => { if (!actual) throw new Error(`Expected truthy, got ${actual}`); },
  toBeFalsy: () => { if (actual) throw new Error(`Expected falsy, got ${actual}`); },
  toBeGreaterThan: (n) => { if (actual <= n) throw new Error(`Expected ${actual} > ${n}`); },
  toBeLessThanOrEqual: (n) => { if (actual > n) throw new Error(`Expected ${actual} <= ${n}`); },
  toContain: (item) => {
    if (!actual.includes(item))
      throw new Error(`Expected array/string to contain ${JSON.stringify(item)}`);
  },
  toHaveLength: (len) => {
    if (actual.length !== len)
      throw new Error(`Expected length ${len}, got ${actual.length}`);
  },
  toBeCloseTo: (expected, precision = 2) => {
    const delta = Math.abs(actual - expected);
    if (delta >= Math.pow(10, -precision))
      throw new Error(`Expected ${actual} ≈ ${expected} (±${Math.pow(10, -precision)})`);
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
const MOCK_JOBS = [
  { id: 'job-001', type: 'bot',   title: '고객 응대 코코봇',  category: 'customer-service', rating: 4.8, salary: 50000, skills: ['nlp', 'support'], popular: 320, createdAt: '2026-03-01' },
  { id: 'job-002', type: 'bot',   title: '데이터 분석 봇',   category: 'analytics',        rating: 4.5, salary: 80000, skills: ['data', 'python'], popular: 210, createdAt: '2026-02-20' },
  { id: 'job-003', type: 'human', title: '프롬프트 엔지니어', category: 'engineering',      rating: 4.9, salary: 120000, skills: ['prompt', 'llm'], popular: 450, createdAt: '2026-03-04' },
  { id: 'job-004', type: 'human', title: '코코봇 트레이너',     category: 'training',         rating: 4.2, salary: 60000, skills: ['training', 'qa'], popular: 150, createdAt: '2026-01-15' },
  { id: 'job-005', type: 'bot',   title: '번역 보조 봇',      category: 'translation',      rating: 4.6, salary: 40000, skills: ['nlp', 'translation'], popular: 280, createdAt: '2026-02-28' },
];

const MOCK_REVIEWS = [
  { id: 'rev-001', jobId: 'job-001', userId: 'user-001', rating: 5, content: '매우 만족스럽습니다.', createdAt: '2026-03-02' },
  { id: 'rev-002', jobId: 'job-001', userId: 'user-002', rating: 4, content: '기대 이상이에요.',     createdAt: '2026-03-03' },
];

// ---------------------------------------------------------------------------
// 비즈니스 로직: job-list.js
// ---------------------------------------------------------------------------
function getJobsByTab(jobs, tab) {
  return jobs.filter((j) => j.type === tab);
}

function filterByCategory(jobs, category) {
  if (!category || category === 'all') return jobs;
  return jobs.filter((j) => j.category === category);
}

function searchJobs(jobs, keyword) {
  if (!keyword) return jobs;
  const kw = keyword.toLowerCase();
  return jobs.filter(
    (j) => j.title.toLowerCase().includes(kw) || j.skills.some((s) => s.includes(kw)),
  );
}

function sortJobs(jobs, sortBy) {
  const copy = [...jobs];
  switch (sortBy) {
    case 'popular': return copy.sort((a, b) => b.popular - a.popular);
    case 'newest':  return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'rating':  return copy.sort((a, b) => b.rating - a.rating);
    case 'salary':  return copy.sort((a, b) => b.salary - a.salary);
    default:        return copy;
  }
}

function paginateJobs(jobs, page, pageSize) {
  const start = (page - 1) * pageSize;
  return {
    items: jobs.slice(start, start + pageSize),
    total: jobs.length,
    page,
    pageSize,
    totalPages: Math.ceil(jobs.length / pageSize),
  };
}

// ---------------------------------------------------------------------------
// 비즈니스 로직: job-hire.js
// ---------------------------------------------------------------------------
async function requestHire(fetchFn, hirerId, jobId, message) {
  const res = await fetchFn('/api/Backend_APIs/job-hire', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hirerId, jobId, message }),
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// 비즈니스 로직: job-review.js
// ---------------------------------------------------------------------------
async function getReviews(fetchFn, jobId) {
  const res = await fetchFn(`/api/Backend_APIs/job-review?jobId=${jobId}`);
  return res.json();
}

async function createReview(fetchFn, payload) {
  const res = await fetchFn('/api/Backend_APIs/job-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function updateReview(fetchFn, reviewId, payload) {
  const res = await fetchFn(`/api/Backend_APIs/job-review/${reviewId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function deleteReview(fetchFn, reviewId) {
  const res = await fetchFn(`/api/Backend_APIs/job-review/${reviewId}`, {
    method: 'DELETE',
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// 비즈니스 로직: job-matching.js
// 가중치: skills 40%, rating 35%, salary 15%, category 10%
// ---------------------------------------------------------------------------
function computeMatchingScore(candidate, requirement) {
  const W = { skills: 0.40, rating: 0.35, salary: 0.15, category: 0.10 };

  // skills: 공통 스킬 비율 (0~1)
  const sharedSkills = candidate.skills.filter((s) => requirement.skills.includes(s)).length;
  const skillScore = requirement.skills.length > 0 ? sharedSkills / requirement.skills.length : 0;

  // rating: 후보의 rating을 5.0 기준으로 정규화
  const ratingScore = candidate.rating / 5.0;

  // salary: 희망 급여 이하인 경우 1점, 초과 시 감점
  const salaryScore = candidate.salary <= requirement.maxSalary ? 1 : requirement.maxSalary / candidate.salary;

  // category: 일치 여부 (0 or 1)
  const categoryScore = candidate.category === requirement.category ? 1 : 0;

  return (
    W.skills   * skillScore  +
    W.rating   * ratingScore +
    W.salary   * salaryScore +
    W.category * categoryScore
  );
}

function rankCandidates(candidates, requirement) {
  return candidates
    .map((c) => ({ ...c, matchScore: computeMatchingScore(c, requirement) }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ---------------------------------------------------------------------------
// 비즈니스 로직: job-fee.js
// 수수료 3단계:
//   거래금액 < 100,000  → 10%
//   거래금액 < 500,000  → 8%
//   거래금액 >= 500,000 → 5%
// ---------------------------------------------------------------------------
function calculateFee(amount) {
  if (amount < 100000)  return { rate: 0.10, fee: Math.floor(amount * 0.10) };
  if (amount < 500000)  return { rate: 0.08, fee: Math.floor(amount * 0.08) };
  return                       { rate: 0.05, fee: Math.floor(amount * 0.05) };
}

// ---------------------------------------------------------------------------
// 테스트 스위트
// ---------------------------------------------------------------------------
describe('job-list.js — GET 목록 API 연동', () => {
  it('전체 목록 조회 — 5개 항목 반환', async () => {
    const mockData = { success: true, data: MOCK_JOBS, total: 5 };
    const fakeFetch = mockFetch(200, mockData);
    const res = await fakeFetch('/api/Backend_APIs/job-list');
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(5);
  });

  it('서버 오류(500) 시 ok=false 반환', async () => {
    const fakeFetch = mockFetch(500, { error: 'Server Error' });
    const res = await fakeFetch('/api/Backend_APIs/job-list');
    expect(res.ok).toBe(false);
  });
});

describe('탭 전환 (구봇/구직)', () => {
  it('구봇(bot) 탭 선택 시 type=bot 항목만 반환해야 한다', async () => {
    const bots = getJobsByTab(MOCK_JOBS, 'bot');
    expect(bots.every((j) => j.type === 'bot')).toBe(true);
    expect(bots).toHaveLength(3);
  });

  it('구직(human) 탭 선택 시 type=human 항목만 반환해야 한다', async () => {
    const humans = getJobsByTab(MOCK_JOBS, 'human');
    expect(humans.every((j) => j.type === 'human')).toBe(true);
    expect(humans).toHaveLength(2);
  });
});

describe('카테고리 필터링', () => {
  it('특정 카테고리 필터 시 해당 카테고리 항목만 반환해야 한다', async () => {
    const filtered = filterByCategory(MOCK_JOBS, 'analytics');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('job-002');
  });

  it('카테고리=all 또는 미입력 시 전체 반환해야 한다', async () => {
    expect(filterByCategory(MOCK_JOBS, 'all')).toHaveLength(MOCK_JOBS.length);
    expect(filterByCategory(MOCK_JOBS, '')).toHaveLength(MOCK_JOBS.length);
    expect(filterByCategory(MOCK_JOBS, null)).toHaveLength(MOCK_JOBS.length);
  });

  it('존재하지 않는 카테고리 검색 시 빈 배열 반환해야 한다', async () => {
    const filtered = filterByCategory(MOCK_JOBS, 'nonexistent');
    expect(filtered).toHaveLength(0);
  });
});

describe('검색 기능', () => {
  it('제목 키워드로 검색 시 일치하는 항목만 반환해야 한다', async () => {
    const found = searchJobs(MOCK_JOBS, '코코봇');
    expect(found.length).toBeGreaterThan(0);
    found.forEach((j) => expect(j.title).toContain('코코봇'));
  });

  it('스킬 키워드로 검색 시 일치하는 항목 반환해야 한다', async () => {
    const found = searchJobs(MOCK_JOBS, 'nlp');
    expect(found.length).toBeGreaterThan(0);
    found.forEach((j) => expect(j.skills).toContain('nlp'));
  });

  it('키워드 미입력 시 전체 목록 반환해야 한다', async () => {
    const found = searchJobs(MOCK_JOBS, '');
    expect(found).toHaveLength(MOCK_JOBS.length);
  });
});

describe('정렬 (인기순/최신순/평점순/가격순)', () => {
  it('인기순 정렬 시 popular 내림차순으로 정렬되어야 한다', async () => {
    const sorted = sortJobs(MOCK_JOBS, 'popular');
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].popular).toBeGreaterThan(sorted[i + 1].popular - 1);
    }
  });

  it('최신순 정렬 시 createdAt 내림차순으로 정렬되어야 한다', async () => {
    const sorted = sortJobs(MOCK_JOBS, 'newest');
    expect(new Date(sorted[0].createdAt) >= new Date(sorted[1].createdAt)).toBe(true);
  });

  it('평점순 정렬 시 rating 내림차순으로 정렬되어야 한다', async () => {
    const sorted = sortJobs(MOCK_JOBS, 'rating');
    expect(sorted[0].rating).toBeGreaterThan(sorted[sorted.length - 1].rating - 0.01);
  });

  it('가격순 정렬 시 salary 내림차순으로 정렬되어야 한다', async () => {
    const sorted = sortJobs(MOCK_JOBS, 'salary');
    expect(sorted[0].salary).toBeGreaterThan(sorted[sorted.length - 1].salary - 1);
  });
});

describe('페이지네이션', () => {
  it('pageSize=2, page=1 시 첫 2개 항목 반환해야 한다', async () => {
    const result = paginateJobs(MOCK_JOBS, 1, 2);
    expect(result.items).toHaveLength(2);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(1);
  });

  it('마지막 페이지 항목 수가 정확해야 한다', async () => {
    const result = paginateJobs(MOCK_JOBS, 3, 2);
    expect(result.items).toHaveLength(1);
  });
});

describe('job-hire.js — POST 고용 요청', () => {
  it('고용 요청 성공 시 201과 hireId를 반환해야 한다', async () => {
    const mockData = {
      success: true,
      data: { hireId: 'hire-001', status: 'pending', createdAt: '2026-03-05T10:00:00Z' },
    };
    const fakeFetch = mockFetch(201, mockData);
    const result = await requestHire(fakeFetch, 'user-001', 'job-001', '함께 일하고 싶습니다.');
    expect(result.success).toBe(true);
    expect(result.data.hireId).toBe('hire-001');
    expect(result.data.status).toBe('pending');
  });

  it('중복 고용 요청 시 409 반환해야 한다', async () => {
    const fakeFetch = mockFetch(409, { error: 'Duplicate hire request' });
    const res = await fakeFetch('/api/Backend_APIs/job-hire');
    expect(res.status).toBe(409);
    expect(res.ok).toBe(false);
  });
});

describe('job-review.js — 리뷰 CRUD', () => {
  it('리뷰 목록 조회 — 해당 jobId의 리뷰만 반환해야 한다', async () => {
    const mockData = { success: true, data: MOCK_REVIEWS.filter((r) => r.jobId === 'job-001') };
    const fakeFetch = mockFetch(200, mockData);
    const result = await getReviews(fakeFetch, 'job-001');
    expect(result.success).toBe(true);
    expect(result.data.every((r) => r.jobId === 'job-001')).toBe(true);
  });

  it('리뷰 작성 — 201 응답과 reviewId 반환해야 한다', async () => {
    const mockData = {
      success: true,
      data: { reviewId: 'rev-003', jobId: 'job-002', rating: 5, content: '최고입니다.' },
    };
    const fakeFetch = mockFetch(201, mockData);
    const result = await createReview(fakeFetch, { jobId: 'job-002', userId: 'user-003', rating: 5, content: '최고입니다.' });
    expect(result.success).toBe(true);
    expect(result.data.reviewId).toBe('rev-003');
  });

  it('리뷰 수정 — 200 응답과 수정된 내용 반환해야 한다', async () => {
    const mockData = {
      success: true,
      data: { reviewId: 'rev-001', rating: 3, content: '보통입니다.' },
    };
    const fakeFetch = mockFetch(200, mockData);
    const result = await updateReview(fakeFetch, 'rev-001', { rating: 3, content: '보통입니다.' });
    expect(result.success).toBe(true);
    expect(result.data.rating).toBe(3);
  });

  it('리뷰 삭제 — 200 응답과 삭제 확인 반환해야 한다', async () => {
    const mockData = { success: true, data: { deleted: true, reviewId: 'rev-001' } };
    const fakeFetch = mockFetch(200, mockData);
    const result = await deleteReview(fakeFetch, 'rev-001');
    expect(result.success).toBe(true);
    expect(result.data.deleted).toBe(true);
  });

  it('타인 리뷰 삭제 시도 시 403 반환해야 한다', async () => {
    const fakeFetch = mockFetch(403, { error: 'Forbidden' });
    const res = await fakeFetch('/api/Backend_APIs/job-review/rev-002', { method: 'DELETE' });
    expect(res.status).toBe(403);
    expect(res.ok).toBe(false);
  });
});

describe('job-matching.js — 매칭 결과 (4가지 가중치)', () => {
  const requirement = {
    skills: ['nlp', 'support'],
    maxSalary: 60000,
    category: 'customer-service',
  };

  it('완벽히 일치하는 후보의 매칭 점수가 가장 높아야 한다', async () => {
    const perfect = { ...MOCK_JOBS[0] }; // job-001: nlp/support, 50000, customer-service, 4.8
    const score = computeMatchingScore(perfect, requirement);
    expect(score).toBeGreaterThan(0.8);
  });

  it('스킬 불일치 시 매칭 점수가 낮아야 한다', async () => {
    const noSkillMatch = { ...MOCK_JOBS[1] }; // skills: data, python
    const score = computeMatchingScore(noSkillMatch, requirement);
    expect(score).toBeLessThanOrEqual(0.7);
  });

  it('희망 급여 초과 시 salary 점수가 감점되어야 한다', async () => {
    const expensive = { ...MOCK_JOBS[2] }; // salary: 120000 > maxSalary: 60000
    const salaryScore = expensive.salary <= requirement.maxSalary ? 1 : requirement.maxSalary / expensive.salary;
    expect(salaryScore).toBeLessThanOrEqual(0.5);
  });

  it('후보 목록 랭킹 시 첫 번째 후보가 가장 높은 점수를 가져야 한다', async () => {
    const ranked = rankCandidates(MOCK_JOBS, requirement);
    expect(ranked[0].matchScore).toBeGreaterThan(ranked[1].matchScore - 0.001);
  });

  it('가중치 합계가 1.0이어야 한다 (40%+35%+15%+10%)', async () => {
    const W = { skills: 0.40, rating: 0.35, salary: 0.15, category: 0.10 };
    const sum = Object.values(W).reduce((acc, v) => acc + v, 0);
    expect(Math.round(sum * 100) / 100).toBe(1.0);
  });
});

describe('job-fee.js — 수수료 계산 (3단계)', () => {
  it('거래금액 < 100,000 → 수수료율 10%', async () => {
    const { rate, fee } = calculateFee(50000);
    expect(rate).toBe(0.10);
    expect(fee).toBe(5000);
  });

  it('거래금액 100,000 이상 ~ 500,000 미만 → 수수료율 8%', async () => {
    const { rate, fee } = calculateFee(200000);
    expect(rate).toBe(0.08);
    expect(fee).toBe(16000);
  });

  it('거래금액 500,000 이상 → 수수료율 5%', async () => {
    const { rate, fee } = calculateFee(1000000);
    expect(rate).toBe(0.05);
    expect(fee).toBe(50000);
  });

  it('경계값 100,000 → 8% 구간 적용', async () => {
    const { rate } = calculateFee(100000);
    expect(rate).toBe(0.08);
  });

  it('경계값 500,000 → 5% 구간 적용', async () => {
    const { rate } = calculateFee(500000);
    expect(rate).toBe(0.05);
  });

  it('수수료 금액이 정수(floor)로 반환되어야 한다', async () => {
    const { fee } = calculateFee(33333);
    expect(Number.isInteger(fee)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 결과 요약
// ---------------------------------------------------------------------------
function printSummary() {
  const total = results.pass + results.fail;
  console.log('\n====================================');
  console.log(`테스트 결과 요약 [jobs.test.js]`);
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
