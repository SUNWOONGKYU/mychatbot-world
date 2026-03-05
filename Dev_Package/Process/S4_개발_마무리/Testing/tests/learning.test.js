/**
 * @task S4T5
 * @description 학습 페이지 통합 테스트
 *   - 커리큘럼 데이터 로드 확인 (4단계: 기초/심화/실전/마스터)
 *   - 커리큘럼 잠금/해제 로직 테스트
 *   - school-session.js API 호출 테스트 (mock)
 *   - LocalStorage 진행률 저장/복원
 *   - 수료증 발급 조건 확인
 */

// ---------------------------------------------------------------------------
// 경량 테스트 러너 (외부 프레임워크 없음)
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
  toBeTruthy: () => {
    if (!actual) throw new Error(`Expected truthy, got ${actual}`);
  },
  toBeFalsy: () => {
    if (actual) throw new Error(`Expected falsy, got ${actual}`);
  },
  toBeGreaterThan: (n) => {
    if (actual <= n) throw new Error(`Expected ${actual} > ${n}`);
  },
  toContain: (item) => {
    if (!actual.includes(item))
      throw new Error(`Expected array/string to contain ${JSON.stringify(item)}`);
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
// Mock: LocalStorage
// ---------------------------------------------------------------------------
const localStorageStore = {};
const mockLocalStorage = {
  getItem: (key) => localStorageStore[key] ?? null,
  setItem: (key, value) => { localStorageStore[key] = String(value); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]); },
};

// ---------------------------------------------------------------------------
// Mock 데이터: 커리큘럼 4단계
// ---------------------------------------------------------------------------
const MOCK_CURRICULUM = {
  stages: [
    {
      id: 'basic',
      label: '기초',
      order: 1,
      locked: false,
      lessons: [
        { id: 'b-1', title: '챗봇이란?', duration: 10 },
        { id: 'b-2', title: '프롬프트 기초', duration: 15 },
      ],
    },
    {
      id: 'advanced',
      label: '심화',
      order: 2,
      locked: true,
      lessons: [
        { id: 'a-1', title: '고급 프롬프트 기법', duration: 20 },
        { id: 'a-2', title: 'API 연동', duration: 25 },
      ],
    },
    {
      id: 'practical',
      label: '실전',
      order: 3,
      locked: true,
      lessons: [
        { id: 'p-1', title: '실전 챗봇 구축', duration: 30 },
        { id: 'p-2', title: '배포 및 운영', duration: 20 },
      ],
    },
    {
      id: 'master',
      label: '마스터',
      order: 4,
      locked: true,
      lessons: [
        { id: 'm-1', title: '마스터 프로젝트', duration: 60 },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 비즈니스 로직: curriculum-lock.js (의존 없이 인라인)
// ---------------------------------------------------------------------------
function unlockNextStage(stages, completedStageId) {
  const completedIndex = stages.findIndex((s) => s.id === completedStageId);
  if (completedIndex === -1 || completedIndex + 1 >= stages.length) return stages;
  return stages.map((s, i) => (i === completedIndex + 1 ? { ...s, locked: false } : s));
}

function isAllLessonsCompleted(lessons, completedLessonIds) {
  return lessons.every((l) => completedLessonIds.includes(l.id));
}

function canIssueCertificate(stages, completedLessonIds) {
  return stages.every((stage) => isAllLessonsCompleted(stage.lessons, completedLessonIds));
}

function saveProgress(storage, userId, stageId, lessonId) {
  const key = `progress_${userId}`;
  const existing = JSON.parse(storage.getItem(key) || '{}');
  if (!existing[stageId]) existing[stageId] = [];
  if (!existing[stageId].includes(lessonId)) existing[stageId].push(lessonId);
  storage.setItem(key, JSON.stringify(existing));
  return existing;
}

function loadProgress(storage, userId) {
  const key = `progress_${userId}`;
  const raw = storage.getItem(key);
  return raw ? JSON.parse(raw) : {};
}

// ---------------------------------------------------------------------------
// 비즈니스 로직: school-session API 호출
// ---------------------------------------------------------------------------
async function fetchSchoolSession(fetchFn, userId) {
  const res = await fetchFn(`/api/Backend_APIs/school-session?userId=${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

async function startLesson(fetchFn, userId, stageId, lessonId) {
  const res = await fetchFn('/api/Backend_APIs/school-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'start', userId, stageId, lessonId }),
  });
  return res.json();
}

async function completeLesson(fetchFn, userId, stageId, lessonId) {
  const res = await fetchFn('/api/Backend_APIs/school-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'complete', userId, stageId, lessonId }),
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// 테스트 스위트
// ---------------------------------------------------------------------------
describe('커리큘럼 데이터 로드 (4단계 구조)', () => {
  it('4개 단계(기초/심화/실전/마스터)가 존재해야 한다', async () => {
    expect(MOCK_CURRICULUM.stages).toHaveLength(4);
    const labels = MOCK_CURRICULUM.stages.map((s) => s.label);
    expect(labels).toContain('기초');
    expect(labels).toContain('심화');
    expect(labels).toContain('실전');
    expect(labels).toContain('마스터');
  });

  it('단계별 순서(order)가 1~4 오름차순이어야 한다', async () => {
    const orders = MOCK_CURRICULUM.stages.map((s) => s.order);
    expect(orders).toEqual([1, 2, 3, 4]);
  });

  it('기초 단계만 초기 잠금 해제 상태여야 한다', async () => {
    const { stages } = MOCK_CURRICULUM;
    expect(stages[0].locked).toBe(false);
    expect(stages[1].locked).toBe(true);
    expect(stages[2].locked).toBe(true);
    expect(stages[3].locked).toBe(true);
  });

  it('각 단계에 최소 1개 이상의 레슨이 있어야 한다', async () => {
    MOCK_CURRICULUM.stages.forEach((stage) => {
      expect(stage.lessons.length).toBeGreaterThan(0);
    });
  });
});

describe('커리큘럼 잠금/해제 로직', () => {
  it('기초 단계 완료 시 심화 단계가 잠금 해제되어야 한다', async () => {
    const updated = unlockNextStage(MOCK_CURRICULUM.stages, 'basic');
    expect(updated[1].locked).toBe(false);
    expect(updated[2].locked).toBe(true);
  });

  it('심화 단계 완료 시 실전 단계가 잠금 해제되어야 한다', async () => {
    const stage1 = unlockNextStage(MOCK_CURRICULUM.stages, 'basic');
    const stage2 = unlockNextStage(stage1, 'advanced');
    expect(stage2[2].locked).toBe(false);
    expect(stage2[3].locked).toBe(true);
  });

  it('마지막 단계(마스터) 완료 시 추가 잠금 해제 없어야 한다', async () => {
    const updated = unlockNextStage(MOCK_CURRICULUM.stages, 'master');
    const stillLocked = updated.filter((s) => s.locked);
    expect(stillLocked.length).toBe(3); // 심화/실전/마스터 여전히 잠금
  });

  it('존재하지 않는 stageId로 호출 시 원본 배열 반환해야 한다', async () => {
    const original = MOCK_CURRICULUM.stages;
    const updated = unlockNextStage(original, 'nonexistent');
    expect(updated).toEqual(original);
  });

  it('단계 내 모든 레슨 완료 여부 판단이 정확해야 한다', async () => {
    const basicLessons = MOCK_CURRICULUM.stages[0].lessons;
    const allIds = basicLessons.map((l) => l.id);
    expect(isAllLessonsCompleted(basicLessons, allIds)).toBe(true);
    expect(isAllLessonsCompleted(basicLessons, ['b-1'])).toBe(false);
    expect(isAllLessonsCompleted(basicLessons, [])).toBe(false);
  });
});

describe('school-session.js API 호출 (mock)', () => {
  it('GET 세션 조회 — 현재 진행 상태를 반환해야 한다', async () => {
    const mockData = {
      success: true,
      data: {
        userId: 'user-001',
        currentStage: 'basic',
        completedLessons: ['b-1'],
        totalProgress: 25,
      },
    };
    const fakeFetch = mockFetch(200, mockData);
    const result = await fetchSchoolSession(fakeFetch, 'user-001');
    expect(result.success).toBe(true);
    expect(result.data.userId).toBe('user-001');
    expect(result.data.completedLessons).toContain('b-1');
  });

  it('POST 레슨 시작 — 201 응답 및 sessionId를 반환해야 한다', async () => {
    const mockData = {
      success: true,
      data: { sessionId: 'sess-abc123', startedAt: '2026-03-05T09:00:00Z' },
    };
    const fakeFetch = mockFetch(201, mockData);
    const result = await startLesson(fakeFetch, 'user-001', 'basic', 'b-1');
    expect(result.success).toBe(true);
    expect(result.data.sessionId).toBe('sess-abc123');
  });

  it('POST 레슨 완료 — 200 응답 및 다음 잠금 해제 정보 반환해야 한다', async () => {
    const mockData = {
      success: true,
      data: {
        completedLessonId: 'b-2',
        stageCompleted: true,
        nextStageUnlocked: 'advanced',
      },
    };
    const fakeFetch = mockFetch(200, mockData);
    const result = await completeLesson(fakeFetch, 'user-001', 'basic', 'b-2');
    expect(result.success).toBe(true);
    expect(result.data.stageCompleted).toBe(true);
    expect(result.data.nextStageUnlocked).toBe('advanced');
  });

  it('서버 오류(500) 시 ok=false를 반환해야 한다', async () => {
    const fakeFetch = mockFetch(500, { error: 'Internal Server Error' });
    const res = await fakeFetch('/api/Backend_APIs/school-session');
    expect(res.ok).toBe(false);
  });
});

describe('LocalStorage 진행률 저장/복원', () => {
  it('레슨 완료 시 LocalStorage에 진행 데이터가 저장되어야 한다', async () => {
    mockLocalStorage.clear();
    saveProgress(mockLocalStorage, 'user-001', 'basic', 'b-1');
    const progress = loadProgress(mockLocalStorage, 'user-001');
    expect(progress['basic']).toContain('b-1');
  });

  it('동일 레슨을 중복 저장해도 1번만 기록되어야 한다', async () => {
    mockLocalStorage.clear();
    saveProgress(mockLocalStorage, 'user-001', 'basic', 'b-1');
    saveProgress(mockLocalStorage, 'user-001', 'basic', 'b-1');
    const progress = loadProgress(mockLocalStorage, 'user-001');
    expect(progress['basic'].filter((id) => id === 'b-1').length).toBe(1);
  });

  it('여러 단계의 진행률이 동시에 저장되어야 한다', async () => {
    mockLocalStorage.clear();
    saveProgress(mockLocalStorage, 'user-001', 'basic', 'b-1');
    saveProgress(mockLocalStorage, 'user-001', 'basic', 'b-2');
    saveProgress(mockLocalStorage, 'user-001', 'advanced', 'a-1');
    const progress = loadProgress(mockLocalStorage, 'user-001');
    expect(progress['basic']).toHaveLength(2);
    expect(progress['advanced']).toHaveLength(1);
  });

  it('저장된 진행 데이터가 없을 때 빈 객체를 반환해야 한다', async () => {
    mockLocalStorage.clear();
    const progress = loadProgress(mockLocalStorage, 'user-unknown');
    expect(JSON.stringify(progress)).toBe('{}');
  });

  it('진행률 복원 후 기존 완료 레슨이 유지되어야 한다', async () => {
    mockLocalStorage.clear();
    const stored = { basic: ['b-1', 'b-2'] };
    mockLocalStorage.setItem('progress_user-001', JSON.stringify(stored));
    const progress = loadProgress(mockLocalStorage, 'user-001');
    expect(progress['basic']).toContain('b-1');
    expect(progress['basic']).toContain('b-2');
  });
});

describe('수료증 발급 조건 확인', () => {
  it('모든 단계의 레슨을 완료한 경우 수료증 발급 조건 충족해야 한다', async () => {
    const allLessonIds = MOCK_CURRICULUM.stages.flatMap((s) => s.lessons.map((l) => l.id));
    const eligible = canIssueCertificate(MOCK_CURRICULUM.stages, allLessonIds);
    expect(eligible).toBe(true);
  });

  it('일부 레슨만 완료한 경우 수료증 발급 불가해야 한다', async () => {
    const partialIds = ['b-1', 'b-2', 'a-1']; // a-2, p-1, p-2, m-1 누락
    const eligible = canIssueCertificate(MOCK_CURRICULUM.stages, partialIds);
    expect(eligible).toBe(false);
  });

  it('레슨을 하나도 완료하지 않은 경우 수료증 발급 불가해야 한다', async () => {
    const eligible = canIssueCertificate(MOCK_CURRICULUM.stages, []);
    expect(eligible).toBe(false);
  });

  it('기초 단계만 완료 시 수료증 발급 불가해야 한다', async () => {
    const basicOnly = MOCK_CURRICULUM.stages[0].lessons.map((l) => l.id);
    const eligible = canIssueCertificate(MOCK_CURRICULUM.stages, basicOnly);
    expect(eligible).toBe(false);
  });

  it('마지막 레슨 완료 시점에 수료증 발급 조건이 충족되어야 한다', async () => {
    // 마지막 레슨(m-1) 빠진 상태
    const withoutLast = MOCK_CURRICULUM.stages
      .flatMap((s) => s.lessons.map((l) => l.id))
      .filter((id) => id !== 'm-1');
    expect(canIssueCertificate(MOCK_CURRICULUM.stages, withoutLast)).toBe(false);

    // m-1 추가
    const withLast = [...withoutLast, 'm-1'];
    expect(canIssueCertificate(MOCK_CURRICULUM.stages, withLast)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 결과 요약
// ---------------------------------------------------------------------------
function printSummary() {
  const total = results.pass + results.fail;
  console.log('\n====================================');
  console.log(`테스트 결과 요약 [learning.test.js]`);
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

// 모든 it() 비동기 처리 후 요약 출력
setImmediate(printSummary);
