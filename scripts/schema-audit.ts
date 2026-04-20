#!/usr/bin/env tsx
/**
 * @task S9DB2
 * @description DB 제약·인덱스 감사 (FK/UNIQUE/NOT NULL/누락 인덱스)
 *
 * 실행:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm tsx scripts/schema-audit.ts
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY 필수');
  process.exit(2);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

interface Finding {
  category: 'FK' | 'UNIQUE' | 'NOT_NULL' | 'INDEX' | 'UNUSED_INDEX';
  severity: 'critical' | 'warning' | 'info';
  table: string;
  column?: string;
  detail: string;
}

async function runQuery<T>(sql: string): Promise<T[]> {
  const { data, error } = await admin.rpc('exec_sql', { sql });
  if (error) {
    console.warn(`쿼리 실패: ${sql.slice(0, 60)}... — ${error.message}`);
    return [];
  }
  return (data ?? []) as T[];
}

async function main() {
  console.log('스키마 감사 시작...');
  const findings: Finding[] = [];

  // 1. user_id 컬럼이 있는데 FK가 없는 테이블
  const noFk = await runQuery<{ table_name: string; column_name: string }>(
    `SELECT c.table_name, c.column_name
     FROM information_schema.columns c
     WHERE c.table_schema='public'
       AND c.column_name LIKE '%_id'
       AND NOT EXISTS (
         SELECT 1 FROM information_schema.key_column_usage k
         JOIN information_schema.table_constraints t
           ON k.constraint_name=t.constraint_name
         WHERE t.constraint_type='FOREIGN KEY'
           AND k.table_name=c.table_name
           AND k.column_name=c.column_name
       )`,
  );
  for (const row of noFk) {
    findings.push({
      category: 'FK',
      severity: 'warning',
      table: row.table_name,
      column: row.column_name,
      detail: '_id 컬럼이나 FK 제약 없음 — 의도된 경우 무시',
    });
  }

  // 2. user_id / email 등 전형 UNIQUE 기대 컬럼 검증 — 수동 목록
  const uniqueCandidates = [
    { table: 'mcw_profiles', column: 'user_id' },
    { table: 'mcw_profiles', column: 'email' },
    { table: 'mcw_bots', column: 'url_slug' },
  ];
  for (const { table, column } of uniqueCandidates) {
    const rows = await runQuery<{ table_name: string }>(
      `SELECT k.table_name FROM information_schema.table_constraints t
       JOIN information_schema.key_column_usage k ON t.constraint_name=k.constraint_name
       WHERE t.constraint_type='UNIQUE' AND k.table_name='${table}' AND k.column_name='${column}'`,
    );
    if (rows.length === 0) {
      findings.push({
        category: 'UNIQUE',
        severity: 'warning',
        table,
        column,
        detail: 'UNIQUE 제약 누락 (의도된 경우 무시)',
      });
    }
  }

  // 3. NOT NULL 누락 — created_at / user_id 등 전형 필수 컬럼
  const notNullChecks = [
    { table: 'mcw_bots', column: 'owner_id' },
    { table: 'mcw_payments', column: 'user_id' },
    { table: 'mcw_payments', column: 'amount' },
    { table: 'mcw_credits', column: 'user_id' },
    { table: 'mcw_credits', column: 'balance' },
  ];
  for (const { table, column } of notNullChecks) {
    const rows = await runQuery<{ is_nullable: string }>(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_schema='public' AND table_name='${table}' AND column_name='${column}'`,
    );
    if (rows[0]?.is_nullable === 'YES') {
      findings.push({
        category: 'NOT_NULL',
        severity: 'critical',
        table,
        column,
        detail: 'NOT NULL 제약 누락 — 데이터 무결성 위협',
      });
    }
  }

  // 4. 인덱스 누락 — user_id, status 등 자주 필터되는 컬럼
  const indexChecks = [
    { table: 'mcw_payments', column: 'user_id' },
    { table: 'mcw_payments', column: 'status' },
    { table: 'mcw_credits', column: 'user_id' },
    { table: 'mcw_bots', column: 'owner_id' },
  ];
  for (const { table, column } of indexChecks) {
    const rows = await runQuery<{ indexname: string }>(
      `SELECT indexname FROM pg_indexes
       WHERE schemaname='public' AND tablename='${table}' AND indexdef ILIKE '%${column}%'`,
    );
    if (rows.length === 0) {
      findings.push({
        category: 'INDEX',
        severity: 'warning',
        table,
        column,
        detail: '자주 조회되는 컬럼에 인덱스 없음',
      });
    }
  }

  // 리포트
  const critical = findings.filter((f) => f.severity === 'critical').length;
  const warning = findings.filter((f) => f.severity === 'warning').length;

  let md = `# DB 스키마 감사 리포트\n\n`;
  md += `> 생성: ${new Date().toISOString()}\n`;
  md += `> 대상: ${SUPABASE_URL}\n\n`;
  md += `## 요약\n\n`;
  md += `| Severity | 건수 |\n|----------|-----:|\n`;
  md += `| Critical | ${critical} |\n`;
  md += `| Warning | ${warning} |\n`;
  md += `| Info | ${findings.filter((f) => f.severity === 'info').length} |\n\n`;

  md += `## 상세\n\n`;
  md += `| # | Severity | Category | Table.Column | Detail |\n`;
  md += `|---|----------|----------|-------------|--------|\n`;
  findings.forEach((f, i) => {
    md += `| ${i + 1} | ${f.severity} | ${f.category} | ${f.table}${f.column ? '.' + f.column : ''} | ${f.detail} |\n`;
  });

  writeFileSync('docs/schema-audit-report.md', md, 'utf-8');
  console.log(`\n리포트: docs/schema-audit-report.md`);
  console.log(`Critical: ${critical}, Warning: ${warning}`);
  process.exit(critical > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
