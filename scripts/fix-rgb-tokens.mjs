#!/usr/bin/env node
/**
 * 일괄 fix: rgb(var(--text-secondary)) → rgb(var(--text-secondary-rgb))
 *           rgb(var(--text-primary))   → rgb(var(--text-primary-rgb))
 *
 * 원인: --text-secondary/primary 토큰은 hex값(#575E66)이라 rgb() 래핑 시 무효.
 * --text-secondary-rgb / --text-primary-rgb 는 RGB triplet이라 정상.
 *
 * 제외: SAL_Grid_Dev_Suite/, zz_KingFolder/, *.md, node_modules/, .next/, .git/
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const EXCLUDE_DIRS = new Set([
  'node_modules', '.next', '.git', 'SAL_Grid_Dev_Suite',
  'zz_KingFolder', 'playwright-report', 'test-results',
  'Brainstorming', 'branding'
]);
const EXTS = new Set(['.tsx', '.ts', '.jsx', '.js', '.css']);

const REPLACEMENTS = [
  [/rgb\(var\(--text-secondary\)\)/g, 'rgb(var(--text-secondary-rgb))'],
  [/rgb\(var\(--text-primary\)\)/g,   'rgb(var(--text-primary-rgb))'],
];

let totalFiles = 0;
let totalReplacements = 0;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (EXCLUDE_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full);
    } else if (EXTS.has(path.extname(ent.name))) {
      processFile(full);
    }
  }
}

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = 0;
  let next = content;
  for (const [pattern, replacement] of REPLACEMENTS) {
    const matches = next.match(pattern);
    if (matches) {
      changed += matches.length;
      next = next.replace(pattern, replacement);
    }
  }
  if (changed > 0) {
    fs.writeFileSync(file, next, 'utf8');
    totalFiles += 1;
    totalReplacements += changed;
    console.log(`  [${changed}] ${path.relative(ROOT, file)}`);
  }
}

console.log('Scanning for broken rgb(var(--text-*)) wrapping...\n');
walk(ROOT);
console.log(`\nDone. ${totalReplacements} replacements across ${totalFiles} files.`);
