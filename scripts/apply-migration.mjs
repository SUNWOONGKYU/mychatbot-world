#!/usr/bin/env node
/**
 * Apply a SQL migration file via Supabase Management API (PAT).
 * Usage: node scripts/apply-migration.mjs supabase/migrations/<file>.sql
 */
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const file = process.argv[2];
if (!file) {
  console.error('Usage: apply-migration.mjs <sql-file>');
  process.exit(2);
}
const sql = fs.readFileSync(path.resolve(file), 'utf8');
const PAT = process.env.SUPABASE_PAT;
const SUPABASE_URL = process.env.SUPABASE_URL;
if (!PAT || !SUPABASE_URL) {
  console.error('Missing SUPABASE_PAT or SUPABASE_URL');
  process.exit(2);
}
const ref = new URL(SUPABASE_URL).hostname.split('.')[0];
const endpoint = `https://api.supabase.com/v1/projects/${ref}/database/query`;
const res = await fetch(endpoint, {
  method: 'POST',
  headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
if (!res.ok) {
  console.error('HTTP', res.status, text);
  process.exit(1);
}
console.log('OK', res.status);
console.log(text.slice(0, 800));
