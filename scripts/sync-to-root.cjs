// scripts/sync-to-root.js
// @task S0BI1 (Pre-commit Hook 설정)
// Stage 폴더 → Root 프로덕션 폴더 자동 동기화

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// ── Vanilla: Stage Area → Root 경로 매핑 ──────────────────────────
const VANILLA_MAPPING = [
  {
    from: 'Frontend',
    to: 'pages/',
    desc: 'Frontend → pages/'
  },
  {
    from: 'Backend_APIs',
    to: 'api/Backend_APIs/',
    desc: 'Backend_APIs → api/Backend_APIs/'
  },
  {
    from: 'Security',
    to: 'api/Security/',
    desc: 'Security → api/Security/'
  },
  {
    from: 'Backend_Infra',
    to: 'api/Backend_Infra/',
    desc: 'Backend_Infra → api/Backend_Infra/'
  },
  {
    from: 'External',
    to: 'api/External/',
    desc: 'External → api/External/'
  },
];

// ── Stage 폴더 목록 ──────────────────────────────────────────────
const STAGE_DIRS = [
  'Dev_Package/Process/S1_개발_준비',
  'Dev_Package/Process/S2_개발-1차',
  'Dev_Package/Process/S3_개발-2차',
  'Dev_Package/Process/S4_개발_마무리',
];

// ── 파일 재귀 탐색 ─────────────────────────────────────────────────
function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  });
  return fileList;
}

// ── 파일 복사 실행 ────────────────────────────────────────────────
let totalCopied = 0;
let totalSkipped = 0;

console.log('\n[sync-to-root] Stage → Root 동기화 시작...\n');

VANILLA_MAPPING.forEach(({ from, to, desc }) => {
  const destBase = path.join(ROOT, to);
  let mappingCopied = 0;

  STAGE_DIRS.forEach(stageDir => {
    const sourceDir = path.join(ROOT, stageDir, from);
    if (!fs.existsSync(sourceDir)) return;

    const files = walkDir(sourceDir);
    files.forEach(srcFile => {
      // _instruction/_verification 파일 제외
      const basename = path.basename(srcFile);
      if (
        basename.endsWith('_instruction.md') ||
        basename.endsWith('_verification.md') ||
        basename === 'TASK_PLAN.md' ||
        basename === '.gitkeep'
      ) {
        totalSkipped++;
        return;
      }

      const relativePath = path.relative(sourceDir, srcFile);
      const destFile = path.join(destBase, relativePath);

      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      fs.copyFileSync(srcFile, destFile);
      console.log(`  [COPY] ${path.relative(ROOT, srcFile)}`);
      console.log(`      -> ${path.relative(ROOT, destFile)}`);
      totalCopied++;
      mappingCopied++;
    });
  });

  if (mappingCopied > 0) {
    console.log(`  ${desc} — ${mappingCopied}개 복사\n`);
  }
});

console.log(`\n[sync-to-root] 동기화 완료`);
console.log(`  복사된 파일: ${totalCopied}개`);
console.log(`  스킵된 파일: ${totalSkipped}개\n`);
