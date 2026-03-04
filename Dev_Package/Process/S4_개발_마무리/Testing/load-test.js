// @task S4T3
// 간이 부하 테스트 스크립트
// Usage: node load-test.js <base-url> <concurrent-users> <duration-seconds>
// Example: node load-test.js https://mychatbot.vercel.app 10 30
// Requirements: Node.js 18+ (fetch built-in), 외부 의존성 없음

'use strict';

const BASE_URL        = process.argv[2] || 'http://localhost:3000';
const CONCURRENCY     = parseInt(process.argv[3] || '5',  10);
const DURATION_SEC    = parseInt(process.argv[4] || '20', 10);
const TARGET_PATH     = process.argv[5] || '/api/Backend_APIs/bot-profile';

// 히스토그램 버킷 경계 (ms)
const HISTOGRAM_BUCKETS = [50, 100, 200, 300, 500, 750, 1000, 1500, 2000, Infinity];

// 요청 카운터 및 결과 저장소
const stats = {
  total: 0,
  success: 0,
  errors: 0,
  responseTimes: [],
  errorMessages: {},
  startTime: 0,
  endTime: 0,
};

// 히스토그램 집계
function buildHistogram(times) {
  const buckets = HISTOGRAM_BUCKETS.map(limit => ({ limit, count: 0 }));

  for (const t of times) {
    for (const bucket of buckets) {
      if (t <= bucket.limit) {
        bucket.count++;
        break;
      }
    }
  }

  return buckets;
}

// 히스토그램 텍스트 출력
function printHistogram(times) {
  if (!times.length) {
    console.log('  데이터 없음');
    return;
  }

  const buckets = buildHistogram(times);
  const maxCount = Math.max(...buckets.map(b => b.count));
  const BAR_WIDTH = 30;

  console.log('\n  응답 시간 분포 (히스토그램):\n');
  console.log('  범위(ms)       | 건수  | 분포');
  console.log('  ' + '-'.repeat(55));

  let prevLimit = 0;
  for (const bucket of buckets) {
    const label =
      bucket.limit === Infinity
        ? `${prevLimit}+ms     `.padEnd(14)
        : `${prevLimit}~${bucket.limit}ms`.padEnd(14);

    const bar = maxCount > 0
      ? '#'.repeat(Math.round((bucket.count / maxCount) * BAR_WIDTH))
      : '';

    const countStr = String(bucket.count).padStart(4);
    console.log(`  ${label} | ${countStr}  | ${bar}`);
    prevLimit = bucket.limit === Infinity ? prevLimit : bucket.limit;
  }
}

// 통계 계산
function calcStats(times) {
  if (!times.length) return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };

  const sorted = [...times].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);

  const pct = (p) => sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)];

  return {
    avg: Math.round(sum / sorted.length),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: pct(0.50),
    p95: pct(0.95),
    p99: pct(0.99),
  };
}

// 단일 워커 루프 — durationMs 동안 반복 요청
async function workerLoop(url, durationMs, workerId) {
  const deadline = Date.now() + durationMs;

  while (Date.now() < deadline) {
    const t0 = performance.now();
    let status = 0;
    let errorMsg = null;

    try {
      const res = await fetch(url, { method: 'GET' });
      status = res.status;
      // 응답 body 소비 (연결 재사용을 위해)
      await res.text();
    } catch (err) {
      errorMsg = err.message;
    }

    const elapsed = Math.round(performance.now() - t0);
    stats.total++;

    if (errorMsg || status >= 500) {
      stats.errors++;
      const key = errorMsg || `HTTP ${status}`;
      stats.errorMessages[key] = (stats.errorMessages[key] || 0) + 1;
    } else {
      stats.success++;
      stats.responseTimes.push(elapsed);
    }
  }
}

// 진행 상태 표시 타이머
function startProgressTimer(durationMs) {
  const startTime = Date.now();
  const interval = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const rps = elapsed > 0 ? Math.round(stats.total / elapsed) : 0;
    process.stdout.write(
      `\r  경과: ${elapsed}s / ${DURATION_SEC}s | 총 요청: ${stats.total} | RPS: ${rps} | 에러: ${stats.errors}   `
    );
  }, 500);

  return () => clearInterval(interval);
}

// 최종 보고서 출력
function printReport(durationSec) {
  const s = calcStats(stats.responseTimes);
  const actualDuration = (stats.endTime - stats.startTime) / 1000;
  const rps = actualDuration > 0 ? (stats.total / actualDuration).toFixed(2) : 0;
  const errorRate = stats.total > 0
    ? ((stats.errors / stats.total) * 100).toFixed(1)
    : '0.0';

  console.log('\n\n' + '='.repeat(60));
  console.log('  부하 테스트 결과 — S4T3');
  console.log('='.repeat(60));
  console.log(`  URL          : ${BASE_URL}${TARGET_PATH}`);
  console.log(`  동시 사용자  : ${CONCURRENCY}명`);
  console.log(`  테스트 시간  : ${actualDuration.toFixed(1)}초 (설정: ${durationSec}초)`);
  console.log('');
  console.log('  [처리량]');
  console.log(`  총 요청 수   : ${stats.total}`);
  console.log(`  성공 요청    : ${stats.success}`);
  console.log(`  실패 요청    : ${stats.errors}`);
  console.log(`  에러율       : ${errorRate}%`);
  console.log(`  RPS (초당)   : ${rps}`);
  console.log('');
  console.log('  [응답 시간]');
  console.log(`  평균(Avg)    : ${s.avg}ms`);
  console.log(`  최소(Min)    : ${s.min}ms`);
  console.log(`  최대(Max)    : ${s.max}ms`);
  console.log(`  중앙값(P50)  : ${s.p50}ms`);
  console.log(`  P95          : ${s.p95}ms`);
  console.log(`  P99          : ${s.p99}ms`);

  if (Object.keys(stats.errorMessages).length > 0) {
    console.log('');
    console.log('  [에러 상세]');
    for (const [msg, count] of Object.entries(stats.errorMessages)) {
      console.log(`  - ${msg}: ${count}회`);
    }
  }

  printHistogram(stats.responseTimes);

  // SLA 판정
  console.log('\n  [SLA 판정]');
  const p95Pass  = s.p95 <= 2000;
  const errPass  = parseFloat(errorRate) <= 5;
  const rpsValue = parseFloat(rps);

  console.log(`  P95 <= 2000ms : ${p95Pass  ? 'PASS' : 'FAIL'} (${s.p95}ms)`);
  console.log(`  에러율 <= 5%  : ${errPass  ? 'PASS' : 'FAIL'} (${errorRate}%)`);
  console.log(`  전체 판정     : ${p95Pass && errPass ? 'PASS' : 'FAIL'}`);

  console.log('\n' + '='.repeat(60));

  // JSON 저장
  return {
    meta: {
      url: `${BASE_URL}${TARGET_PATH}`,
      concurrency: CONCURRENCY,
      durationSec: actualDuration,
      timestamp: new Date().toISOString(),
      task: 'S4T3',
    },
    throughput: {
      total: stats.total,
      success: stats.success,
      errors: stats.errors,
      errorRate: `${errorRate}%`,
      rps: parseFloat(rps),
    },
    latency: s,
    sla: {
      p95_under_2000ms: p95Pass,
      error_rate_under_5pct: errPass,
      overall: p95Pass && errPass ? 'PASS' : 'FAIL',
    },
    errorMessages: stats.errorMessages,
  };
}

// 메인 실행
async function main() {
  const url = `${BASE_URL}${TARGET_PATH}`;

  console.log('='.repeat(60));
  console.log('  간이 부하 테스트 — S4T3');
  console.log(`  URL          : ${url}`);
  console.log(`  동시 사용자  : ${CONCURRENCY}명`);
  console.log(`  테스트 시간  : ${DURATION_SEC}초`);
  console.log('='.repeat(60));
  console.log('\n  테스트 시작...\n');

  const durationMs = DURATION_SEC * 1000;

  stats.startTime = Date.now();
  const stopProgress = startProgressTimer(durationMs);

  // 워커 병렬 실행
  const workers = Array.from({ length: CONCURRENCY }, (_, i) =>
    workerLoop(url, durationMs, i + 1)
  );

  await Promise.all(workers);

  stats.endTime = Date.now();
  stopProgress();

  const report = printReport(DURATION_SEC);

  // JSON 저장
  const { writeFileSync } = await import('fs');
  const reportPath = `./load-report-c${CONCURRENCY}-${Date.now()}.json`;
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n  JSON 보고서: ${reportPath}`);
}

main().catch(err => {
  console.error('\n부하 테스트 오류:', err.message);
  process.exit(1);
});
