// @task S4T3
// API 성능 테스트 스크립트
// Usage: node api-performance-test.js <base-url>
// Example: node api-performance-test.js https://mychatbot.vercel.app
// Requirements: Node.js 18+ (fetch built-in)

'use strict';

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const ITERATIONS = parseInt(process.argv[3] || '10', 10);

// 주요 API 엔드포인트 목록
const ENDPOINTS = [
  {
    name: 'chat-send',
    method: 'POST',
    path: '/api/Backend_APIs/chat-send',
    body: JSON.stringify({ message: 'test', sessionId: 'perf-test-session' }),
    headers: { 'Content-Type': 'application/json' },
  },
  {
    name: 'bot-profile',
    method: 'GET',
    path: '/api/Backend_APIs/bot-profile',
  },
  {
    name: 'faq',
    method: 'GET',
    path: '/api/Backend_APIs/faq',
  },
  {
    name: 'growth',
    method: 'GET',
    path: '/api/Backend_APIs/growth',
  },
  {
    name: 'school-session',
    method: 'GET',
    path: '/api/Backend_APIs/school-session',
  },
  {
    name: 'health-check',
    method: 'GET',
    path: '/api/Backend_APIs/health',
  },
];

// 통계 계산 유틸리티
function calcStats(times) {
  if (!times.length) return { avg: 0, min: 0, max: 0, p95: 0, count: 0 };
  const sorted = [...times].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const p95Index = Math.ceil(sorted.length * 0.95) - 1;
  return {
    avg: Math.round(sum / sorted.length),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p95: sorted[p95Index],
    count: sorted.length,
  };
}

// 단일 요청 실행
async function makeRequest(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  const options = {
    method: endpoint.method || 'GET',
    headers: endpoint.headers || {},
  };
  if (endpoint.body) {
    options.body = endpoint.body;
  }

  const start = performance.now();
  let status = 0;
  let error = null;

  try {
    const res = await fetch(url, options);
    status = res.status;
  } catch (err) {
    error = err.message;
  }

  const elapsed = Math.round(performance.now() - start);
  return { elapsed, status, error };
}

// 순차 반복 테스트
async function runSequentialTest(endpoint, iterations) {
  const times = [];
  const errors = [];

  process.stdout.write(`  [${endpoint.name}] 순차 ${iterations}회 측정 중...`);

  for (let i = 0; i < iterations; i++) {
    const result = await makeRequest(endpoint);
    if (result.error || result.status >= 500) {
      errors.push(result.error || `HTTP ${result.status}`);
    } else {
      times.push(result.elapsed);
    }
    process.stdout.write('.');
  }

  process.stdout.write('\n');
  return { stats: calcStats(times), errors };
}

// 동시 요청 테스트
async function runConcurrentTest(endpoint, concurrency) {
  const promises = Array.from({ length: concurrency }, () => makeRequest(endpoint));
  const start = performance.now();
  const results = await Promise.all(promises);
  const totalElapsed = Math.round(performance.now() - start);

  const times = results.filter(r => !r.error && r.status < 500).map(r => r.elapsed);
  const errorCount = results.length - times.length;

  return {
    concurrency,
    totalElapsed,
    stats: calcStats(times),
    errorCount,
    errorRate: `${Math.round((errorCount / concurrency) * 100)}%`,
  };
}

// 콘솔 테이블 출력
function printTable(rows, columns) {
  const widths = columns.map(col =>
    Math.max(col.label.length, ...rows.map(r => String(r[col.key] ?? '').length))
  );

  const separator = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';
  const header =
    '|' + columns.map((col, i) => ` ${col.label.padEnd(widths[i])} `).join('|') + '|';

  console.log(separator);
  console.log(header);
  console.log(separator);

  for (const row of rows) {
    const line =
      '|' +
      columns
        .map((col, i) => ` ${String(row[col.key] ?? '-').padEnd(widths[i])} `)
        .join('|') +
      '|';
    console.log(line);
  }

  console.log(separator);
}

// 메인 실행
async function main() {
  console.log('='.repeat(60));
  console.log('  API 성능 테스트 — S4T3');
  console.log(`  Base URL : ${BASE_URL}`);
  console.log(`  반복 횟수: ${ITERATIONS}회`);
  console.log(`  시작 시각: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const sequentialResults = [];

  // 1. 순차 반복 테스트
  console.log('\n[1] 순차 응답 시간 테스트\n');
  for (const endpoint of ENDPOINTS) {
    const { stats, errors } = await runSequentialTest(endpoint, ITERATIONS);
    sequentialResults.push({
      endpoint: endpoint.name,
      method: endpoint.method || 'GET',
      avg_ms: stats.avg,
      min_ms: stats.min,
      max_ms: stats.max,
      p95_ms: stats.p95,
      success: stats.count,
      errors: errors.length,
    });
  }

  console.log('\n[순차 테스트 결과]');
  printTable(sequentialResults, [
    { key: 'endpoint', label: 'Endpoint' },
    { key: 'method',   label: 'Method' },
    { key: 'avg_ms',   label: 'Avg(ms)' },
    { key: 'min_ms',   label: 'Min(ms)' },
    { key: 'max_ms',   label: 'Max(ms)' },
    { key: 'p95_ms',   label: 'P95(ms)' },
    { key: 'success',  label: 'OK' },
    { key: 'errors',   label: 'Err' },
  ]);

  // 2. 동시 요청 테스트 (chat-send 엔드포인트 기준)
  const concurrencyLevels = [3, 5, 10];
  const targetEndpoint = ENDPOINTS.find(e => e.name === 'chat-send') || ENDPOINTS[0];
  const concurrentResults = [];

  console.log(`\n[2] 동시 요청 테스트 — 대상: ${targetEndpoint.name}\n`);

  for (const level of concurrencyLevels) {
    process.stdout.write(`  동시 ${level}명 요청 중...`);
    const result = await runConcurrentTest(targetEndpoint, level);
    process.stdout.write(' 완료\n');
    concurrentResults.push({
      concurrency: result.concurrency,
      total_ms: result.totalElapsed,
      avg_ms: result.stats.avg,
      p95_ms: result.stats.p95,
      errors: result.errorCount,
      error_rate: result.errorRate,
    });
  }

  console.log('\n[동시 요청 테스트 결과]');
  printTable(concurrentResults, [
    { key: 'concurrency', label: '동시 요청' },
    { key: 'total_ms',    label: '총 시간(ms)' },
    { key: 'avg_ms',      label: 'Avg(ms)' },
    { key: 'p95_ms',      label: 'P95(ms)' },
    { key: 'errors',      label: '에러 수' },
    { key: 'error_rate',  label: '에러율' },
  ]);

  // 3. JSON 결과 저장
  const reportPath = `./perf-report-${Date.now()}.json`;
  const report = {
    meta: {
      baseUrl: BASE_URL,
      iterations: ITERATIONS,
      timestamp: new Date().toISOString(),
      task: 'S4T3',
    },
    sequential: sequentialResults,
    concurrent: concurrentResults,
  };

  const { writeFileSync } = await import('fs');
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`\n결과 저장: ${reportPath}`);
  console.log('='.repeat(60));
  console.log('  테스트 완료');
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('테스트 실행 오류:', err.message);
  process.exit(1);
});
