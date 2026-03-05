// scripts/build-web-assets.js
// @task S0BI1 (Pre-commit Hook 설정)
// SAL Grid 진행률 계산 + progress.json 생성

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'Dev_Package/Process/S0_Project-SAL-Grid_생성/method/json/data');
const PUBLIC_DIR = path.join(ROOT, 'public');

// ── 1. index.json + grid_records/*.json 읽어 진행률 계산 ──────────
function calculateProgress() {
  const indexPath = path.join(DATA_DIR, 'index.json');
  if (!fs.existsSync(indexPath)) {
    console.warn('[build-web-assets] index.json 없음, 스킵');
    return null;
  }

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const gridDir = path.join(DATA_DIR, 'grid_records');

  const byStatus = {
    'Pending': 0,
    'In Progress': 0,
    'Executed': 0,
    'Completed': 0
  };
  const byStage = {};

  index.task_ids.forEach(taskId => {
    const taskFile = path.join(gridDir, `${taskId}.json`);
    if (!fs.existsSync(taskFile)) return;

    const task = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
    const stage = `S${task.stage}`;

    // Stage별 집계
    if (!byStage[stage]) {
      byStage[stage] = { total: 0, completed: 0, verified: 0 };
    }
    byStage[stage].total++;

    // 상태별 집계
    const status = task.task_status || 'Pending';
    if (byStatus[status] !== undefined) {
      byStatus[status]++;
    }

    if (status === 'Completed') {
      byStage[stage].completed++;
    }
    if (task.verification_status === 'Verified') {
      byStage[stage].verified++;
    }
  });

  const completedCount = byStatus['Completed'];

  return {
    project_id: index.project_id,
    project_name: index.project_name,
    total_tasks: index.total_tasks,
    completed_tasks: completedCount,
    overall_progress: Math.round((completedCount / index.total_tasks) * 100),
    by_status: byStatus,
    by_stage: byStage,
    generated_at: new Date().toISOString()
  };
}

// ── 2. public/progress.json 생성 ──────────────────────────────────
function writeProgressJson(progress) {
  if (!progress) return;
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const outPath = path.join(PUBLIC_DIR, 'progress.json');
  fs.writeFileSync(outPath, JSON.stringify(progress, null, 2), 'utf8');
  console.log(`[build-web-assets] progress.json 생성: 전체 ${progress.overall_progress}% 완료`);
  console.log(`  총 ${progress.total_tasks}개 Task 중 ${progress.completed_tasks}개 Completed`);
}

// ── 실행 ──────────────────────────────────────────────────────────
console.log('\n[build-web-assets] 빌드 시작...\n');
const progress = calculateProgress();
writeProgressJson(progress);
console.log('\n[build-web-assets] 빌드 완료\n');
