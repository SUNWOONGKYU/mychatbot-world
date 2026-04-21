#!/usr/bin/env node
// S7FE9 HOTFIX3: Bulk light-mode token replacement
// Replaces rgba(255,255,255,X), color:'white', hardcoded dark hex surfaces
// with S7 semantic tokens so .light cascade works.

import fs from 'node:fs';
import path from 'node:path';

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('Usage: node transform-light-mode-tokens.mjs <file1> [file2] ...');
  process.exit(1);
}

// Ordered replacements. Apply in sequence; earlier matches consumed first.
// KEEP untouched: QR `<img>` `background: 'white'` (hand-filtered), brand button `color: 'white'` on #6366f1/#ef4444, ToggleSwitch thumb.
const replacements = [
  // Dark surface hex → surface-1 token
  [/background:\s*'#1c1c24'/g, "background: 'rgb(var(--surface-1))'"],
  [/background:\s*'#1a1a24'/g, "background: 'rgb(var(--surface-1))'"],
  [/background:\s*'#16161c'/g, "background: 'rgb(var(--surface-1))'"],
  [/background:\s*'#1a1a2e'/g, "background: 'rgb(var(--surface-1))'"],
  [/background:\s*'#1e1e2e'/g, "background: 'rgb(var(--surface-2))'"],
  [/background:\s*'#0d0d12'/g, "background: 'rgb(var(--bg-base))'"],
  [/background:\s*'#0f0c29'/g, "background: 'rgb(var(--bg-base))'"],

  // rgba(255,255,255,X) as border — keep alpha via / X syntax
  [/border:\s*'1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0?\.0[0-9]\)'/g, "border: '1px solid rgb(var(--border-subtle-rgb))'"],
  [/border:\s*'1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0?\.1[0-9]?\)'/g, "border: '1px solid rgb(var(--border))'"],
  [/border:\s*'1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0?\.2[0-9]?\)'/g, "border: '1px solid rgb(var(--border-strong-rgb))'"],
  [/borderBottom:\s*'1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0?\.0[0-9]\)'/g, "borderBottom: '1px solid rgb(var(--border-subtle-rgb))'"],
  [/borderBottom:\s*'1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0?\.1[0-9]?\)'/g, "borderBottom: '1px solid rgb(var(--border))'"],
  [/borderTop:\s*'1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0?\.0[0-9]\)'/g, "borderTop: '1px solid rgb(var(--border-subtle-rgb))'"],

  // rgba(255,255,255,X) as background (standalone)
  [/background:\s*'rgba\(255,\s*255,\s*255,\s*0?\.0[1-3]\)'/g, "background: 'rgb(var(--bg-subtle))'"],
  [/background:\s*'rgba\(255,\s*255,\s*255,\s*0?\.0[4-9]\)'/g, "background: 'rgb(var(--bg-muted))'"],
  [/background:\s*'rgba\(255,\s*255,\s*255,\s*0?\.1[0-9]?\)'/g, "background: 'rgb(var(--bg-muted))'"],
  [/backgroundColor:\s*'rgba\(255,\s*255,\s*255,\s*0?\.0[1-3]\)'/g, "backgroundColor: 'rgb(var(--bg-subtle))'"],
  [/backgroundColor:\s*'rgba\(255,\s*255,\s*255,\s*0?\.0[4-9]\)'/g, "backgroundColor: 'rgb(var(--bg-muted))'"],

  // rgba(0,0,0,0.2)-style dark input bgs → bg-muted
  [/background:\s*'rgba\(0,\s*0,\s*0,\s*0?\.[12][0-9]?\)'/g, "background: 'rgb(var(--bg-muted))'"],

  // rgba(255,255,255,X) as text color
  [/color:\s*'rgba\(255,\s*255,\s*255,\s*0?\.[2-4][0-9]?\)'/g, "color: 'rgb(var(--text-muted))'"],
  [/color:\s*'rgba\(255,\s*255,\s*255,\s*0?\.[5-7][0-9]?\)'/g, "color: 'rgb(var(--text-secondary-rgb))'"],
  [/color:\s*'rgba\(255,\s*255,\s*255,\s*0?\.[89][0-9]?\)'/g, "color: 'rgb(var(--text-primary-rgb))'"],

  // color: 'white' / '#fff' / '#ffffff' — standalone (non-brand contexts)
  // NOTE: intentionally NOT replacing inside brand-colored button contexts; we rely on multiline context being handled manually later.
  [/color:\s*'white'(?!\s*,\s*\/\/\s*keep)/g, "color: 'rgb(var(--text-primary-rgb))'"],
  [/color:\s*'#fff'(?!\s*,\s*\/\/\s*keep)/g, "color: 'rgb(var(--text-primary-rgb))'"],
  [/color:\s*'#ffffff'(?!\s*,\s*\/\/\s*keep)/g, "color: 'rgb(var(--text-primary-rgb))'"],

  // Common brand hex → primary token
  [/background:\s*'#6366f1'/g, "background: 'rgb(var(--color-primary))'"],
  [/backgroundColor:\s*'#6366f1'/g, "backgroundColor: 'rgb(var(--color-primary))'"],

  // ── CSS-in-JS template literal patterns (unquoted values) ──
  // Border with rgba(255,255,255,X) in CSS strings
  [/1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0?\.0[0-9]\)/g, '1px solid rgb(var(--border-subtle-rgb))'],
  [/1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*\.0[0-9]\)/g, '1px solid rgb(var(--border-subtle-rgb))'],
  [/1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0?\.1[0-9]?\)/g, '1px solid rgb(var(--border))'],
  [/1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*\.1[0-9]?\)/g, '1px solid rgb(var(--border))'],
  [/1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0?\.2[0-9]?\)/g, '1px solid rgb(var(--border-strong-rgb))'],
  [/1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*\.2[0-9]?\)/g, '1px solid rgb(var(--border-strong-rgb))'],

  // background: rgba(255,255,255,X) unquoted in CSS
  [/background:\s*rgba\(255,\s*255,\s*255,\s*0?\.0[1-3]\);/g, 'background: rgb(var(--bg-subtle));'],
  [/background:\s*rgba\(255,\s*255,\s*255,\s*\.0[1-3]\);/g, 'background: rgb(var(--bg-subtle));'],
  [/background:\s*rgba\(255,\s*255,\s*255,\s*0?\.0[4-9]\);/g, 'background: rgb(var(--bg-muted));'],
  [/background:\s*rgba\(255,\s*255,\s*255,\s*\.0[4-9]\);/g, 'background: rgb(var(--bg-muted));'],
  [/background:\s*rgba\(255,\s*255,\s*255,\s*0?\.1[0-9]?\);/g, 'background: rgb(var(--bg-muted));'],
  [/background:\s*rgba\(255,\s*255,\s*255,\s*\.1[0-9]?\);/g, 'background: rgb(var(--bg-muted));'],

  // color: rgba(255,255,255,X) unquoted in CSS
  [/color:\s*rgba\(255,\s*255,\s*255,\s*0?\.[2-4][0-9]?\);/g, 'color: rgb(var(--text-muted));'],
  [/color:\s*rgba\(255,\s*255,\s*255,\s*\.[2-4][0-9]?\);/g, 'color: rgb(var(--text-muted));'],
  [/color:\s*rgba\(255,\s*255,\s*255,\s*0?\.[5-7][0-9]?\);/g, 'color: rgb(var(--text-secondary-rgb));'],
  [/color:\s*rgba\(255,\s*255,\s*255,\s*\.[5-7][0-9]?\);/g, 'color: rgb(var(--text-secondary-rgb));'],
  [/color:\s*rgba\(255,\s*255,\s*255,\s*0?\.[89][0-9]?\);/g, 'color: rgb(var(--text-primary-rgb));'],
  [/color:\s*rgba\(255,\s*255,\s*255,\s*\.[89][0-9]?\);/g, 'color: rgb(var(--text-primary-rgb));'],

  // border-color / background-color unquoted
  [/border-color:\s*rgba\(255,\s*255,\s*255,\s*0?\.1[0-9]?\);/g, 'border-color: rgb(var(--border));'],
  [/border-color:\s*rgba\(255,\s*255,\s*255,\s*\.1[0-9]?\);/g, 'border-color: rgb(var(--border));'],
  [/border-color:\s*rgba\(255,\s*255,\s*255,\s*0?\.2[0-9]?\);/g, 'border-color: rgb(var(--border-strong-rgb));'],
  [/border-color:\s*rgba\(255,\s*255,\s*255,\s*\.2[0-9]?\);/g, 'border-color: rgb(var(--border-strong-rgb));'],

  // color: #fff / #ffffff / white unquoted in CSS
  [/color:\s*#fff;/g, 'color: rgb(var(--text-primary-rgb));'],
  [/color:\s*#ffffff;/g, 'color: rgb(var(--text-primary-rgb));'],
  [/color:\s*#e2e8f0;/g, 'color: rgb(var(--text-primary-rgb));'],

  // Dark surface hex unquoted
  [/background:\s*#1a1a24;/g, 'background: rgb(var(--surface-1));'],
  [/background:\s*#1c1c24;/g, 'background: rgb(var(--surface-1));'],
  [/background:\s*#16161c;/g, 'background: rgb(var(--surface-1));'],
  [/background:\s*#1e1e2e;/g, 'background: rgb(var(--surface-2));'],
  [/background:\s*#0d0d12;/g, 'background: rgb(var(--bg-base));'],
  [/background-color:\s*#1a1a24;/g, 'background-color: rgb(var(--surface-1));'],
  [/background-color:\s*#16161c;/g, 'background-color: rgb(var(--surface-1));'],

  // ── Ternary / inline expression rgba values (unmatched by previous patterns) ──
  // Standalone quoted literal in ternary fallback
  [/'rgba\(255,\s*255,\s*255,\s*0?\.0[1-3]\)'/g, "'rgb(var(--bg-subtle))'"],
  [/'rgba\(255,\s*255,\s*255,\s*0?\.0[4-9]\)'/g, "'rgb(var(--bg-muted))'"],
  [/'rgba\(255,\s*255,\s*255,\s*0?\.1[0-9]?\)'/g, "'rgb(var(--border))'"],
  [/'rgba\(255,\s*255,\s*255,\s*0?\.[2-4][0-9]?\)'/g, "'rgb(var(--text-muted))'"],
  [/'rgba\(255,\s*255,\s*255,\s*0?\.[5-7][0-9]?\)'/g, "'rgb(var(--text-secondary-rgb))'"],
  [/'rgba\(255,\s*255,\s*255,\s*0?\.[89][0-9]?\)'/g, "'rgb(var(--text-primary-rgb))'"],

  // "1px solid rgba(255,255,255,X)" quoted in ternary fallback
  [/"1px solid rgba\(255,\s*255,\s*255,\s*0?\.0[0-9]\)"/g, '"1px solid rgb(var(--border-subtle-rgb))"'],
  [/'1px solid rgba\(255,\s*255,\s*255,\s*0?\.0[0-9]\)'/g, "'1px solid rgb(var(--border-subtle-rgb))'"],
  [/'1px solid rgba\(255,\s*255,\s*255,\s*0?\.1[0-9]?\)'/g, "'1px solid rgb(var(--border))'"],
  [/'2px dashed rgba\(255,\s*255,\s*255,\s*0?\.1[0-9]?\)'/g, "'2px dashed rgb(var(--border))'"],

  // CSS canvas fillStyle (e.g., chart gridlines)
  [/fillStyle\s*=\s*'rgba\(255,\s*255,\s*255,\s*0?\.[23][0-9]?\)'/g, "fillStyle = 'rgb(var(--text-muted))'"],

  // Edge cases
  [/background:\s*rgba\(255,\s*255,\s*255,\s*0?\.01[0-9]?\);/g, 'background: rgb(var(--bg-subtle));'],
  [/background:\s*rgba\(255,\s*255,\s*255,\s*\.4\);/g, 'background: rgb(var(--text-muted));'],
];

// After global color replacements, restore white on known brand-primary buttons.
// Pattern: background: 'rgb(var(--color-primary))', color: 'rgb(var(--text-primary-rgb))'
// → color should be white (on brand bg)
const brandRestores = [
  // Primary button pair
  [/background:\s*'rgb\(var\(--color-primary\)\)',\s*color:\s*'rgb\(var\(--text-primary-rgb\)\)'/g,
   "background: 'rgb(var(--color-primary))', color: 'white'"],
  // Destructive button (red bg + text)
  [/background:\s*'#ef4444',\s*color:\s*'rgb\(var\(--text-primary-rgb\)\)'/g,
   "background: '#ef4444', color: 'white'"],
  [/background:\s*'#dc2626',\s*color:\s*'rgb\(var\(--text-primary-rgb\)\)'/g,
   "background: '#dc2626', color: 'white'"],
  // Amber/Orange badge
  [/background:\s*'#f59e0b',\s*color:\s*'rgb\(var\(--text-primary-rgb\)\)'/g,
   "background: '#f59e0b', color: 'white'"],
];

let totalChanges = 0;
const perFile = [];

for (const file of targets) {
  if (!fs.existsSync(file)) {
    console.warn(`SKIP (not found): ${file}`);
    continue;
  }
  const original = fs.readFileSync(file, 'utf8');
  let out = original;
  let fileChanges = 0;

  for (const [pat, repl] of replacements) {
    const before = out;
    out = out.replace(pat, repl);
    const matches = before === out ? 0 : (before.match(pat) || []).length;
    fileChanges += matches;
  }
  for (const [pat, repl] of brandRestores) {
    out = out.replace(pat, repl);
  }

  if (out !== original) {
    fs.writeFileSync(file, out, 'utf8');
    perFile.push({ file: path.relative(process.cwd(), file), changes: fileChanges });
    totalChanges += fileChanges;
  }
}

console.log(JSON.stringify({ totalChanges, perFile }, null, 2));
