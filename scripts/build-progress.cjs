/**
 * build-progress.js
 *
 * SAL Grid 진행률 재계산 스크립트
 * grid_records/*.json 파일을 읽어 Stage별/Area별 완료율을 계산하고 출력한다.
 *
 * 사용법: node scripts/build-progress.js
 */

const fs = require('fs');
const path = require('path');

const GRID_DIR = path.resolve(__dirname, '..', 'grid_records');
const TASK_PLAN = path.resolve(__dirname, '..', 'TASK_PLAN.md');

function loadRecords() {
  const files = fs.readdirSync(GRID_DIR).filter(f => f.endsWith('.json') && f !== '_TEMPLATE.json');
  return files.map(f => {
    const raw = fs.readFileSync(path.join(GRID_DIR, f), 'utf8');
    return JSON.parse(raw);
  });
}

function calcProgress(records) {
  const byStage = {};
  const byArea = {};
  let totalCompleted = 0;
  let totalTasks = records.length;

  for (const r of records) {
    const stage = `S${r.stage}`;
    const area = r.area;
    const done = r.task_status === 'Completed' || r.task_status === 'Verified';

    // Stage 집계
    if (!byStage[stage]) byStage[stage] = { total: 0, completed: 0 };
    byStage[stage].total++;
    if (done) { byStage[stage].completed++; totalCompleted++; }

    // Area 집계
    if (!byArea[area]) byArea[area] = { total: 0, completed: 0 };
    byArea[area].total++;
    if (done) byArea[area].completed++;
  }

  return { byStage, byArea, totalCompleted, totalTasks };
}

function printBar(label, completed, total, width = 20) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const filled = Math.round((pct / 100) * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  console.log(`  ${label.padEnd(8)} ${bar} ${pct}% (${completed}/${total})`);
}

function main() {
  if (!fs.existsSync(GRID_DIR)) {
    console.error('❌ grid_records/ 디렉토리가 없습니다.');
    process.exit(1);
  }

  const records = loadRecords();
  if (records.length === 0) {
    console.log('⚠️  grid_records에 JSON 파일이 없습니다.');
    process.exit(0);
  }

  const { byStage, byArea, totalCompleted, totalTasks } = calcProgress(records);
  const overallPct = Math.round((totalCompleted / totalTasks) * 100);

  console.log('\n' + '═'.repeat(50));
  console.log('📊 SAL Grid 진행률 리포트');
  console.log('═'.repeat(50));
  console.log(`\n  전체: ${totalCompleted}/${totalTasks} (${overallPct}%)\n`);

  console.log('── Stage별 ──');
  for (const [stage, data] of Object.entries(byStage).sort()) {
    printBar(stage, data.completed, data.total);
  }

  console.log('\n── Area별 ──');
  for (const [area, data] of Object.entries(byArea).sort()) {
    printBar(area, data.completed, data.total);
  }

  console.log('\n' + '═'.repeat(50));

  // TASK_PLAN.md 존재 확인
  if (fs.existsSync(TASK_PLAN)) {
    console.log('✅ TASK_PLAN.md 확인됨');
  } else {
    console.log('⚠️  TASK_PLAN.md 없음 — 생성 필요');
  }

  console.log('═'.repeat(50) + '\n');
}

main();
