#!/usr/bin/env tsx
/**
 * @task S9DB1
 * @description RLS (Row Level Security) 전수 감사 스크립트
 *
 * 실행:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm tsx scripts/rls-audit.ts
 *
 * 출력:
 *   - 콘솔: 요약 테이블
 *   - docs/rls-audit-report.md: 전수 리포트
 *   - 종료 코드 0 (모두 PASS) / 1 (Critical 발견)
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY 필수');
  process.exit(2);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

type TableInfo = {
  schemaname: string;
  tablename: string;
  rowsecurity: boolean;
  policy_count: number;
  has_select: boolean;
  has_insert: boolean;
  has_update: boolean;
  has_delete: boolean;
};

type AuditResult = TableInfo & { status: 'PASS' | 'WARN' | 'FAIL'; issues: string[] };

async function fetchTables(): Promise<TableInfo[]> {
  const { data, error } = await admin.rpc('pg_rls_audit');
  if (!error && data) return data as TableInfo[];

  // RPC 미제공 시 information_schema 쿼리 fallback
  const { data: rows, error: qErr } = await admin
    .from('pg_tables')
    .select('schemaname, tablename, rowsecurity')
    .eq('schemaname', 'public');

  if (qErr) {
    console.error('테이블 조회 실패:', qErr);
    process.exit(2);
  }

  const result: TableInfo[] = [];
  for (const t of rows ?? []) {
    const tableName = t.tablename as string;
    const rls = t.rowsecurity as boolean;

    const { data: policies } = await admin
      .from('pg_policies')
      .select('cmd')
      .eq('schemaname', 'public')
      .eq('tablename', tableName);

    const cmds = new Set((policies ?? []).map((p) => p.cmd as string));
    result.push({
      schemaname: t.schemaname as string,
      tablename: tableName,
      rowsecurity: rls,
      policy_count: policies?.length ?? 0,
      has_select: cmds.has('SELECT') || cmds.has('ALL'),
      has_insert: cmds.has('INSERT') || cmds.has('ALL'),
      has_update: cmds.has('UPDATE') || cmds.has('ALL'),
      has_delete: cmds.has('DELETE') || cmds.has('ALL'),
    });
  }
  return result;
}

function audit(tables: TableInfo[]): AuditResult[] {
  return tables.map((t) => {
    const issues: string[] = [];
    let status: AuditResult['status'] = 'PASS';

    // 감사 대상: mcw_* 스키마 + 공개 민감 테이블
    const sensitive =
      t.tablename.startsWith('mcw_') ||
      ['profiles', 'payments', 'credits'].some((k) => t.tablename.includes(k));

    if (sensitive) {
      if (!t.rowsecurity) {
        issues.push('CRITICAL: RLS 비활성화');
        status = 'FAIL';
      }
      if (t.policy_count === 0) {
        issues.push('CRITICAL: 정책 0건 — 데이터 잠금');
        status = 'FAIL';
      }
      if (!t.has_select) issues.push('WARN: SELECT 정책 없음');
      if (!t.has_update && !t.tablename.endsWith('_logs')) {
        issues.push('INFO: UPDATE 정책 없음 (의도된 경우 무시)');
      }
    }

    if (status === 'PASS' && issues.length > 0) status = 'WARN';
    return { ...t, status, issues };
  });
}

function renderReport(results: AuditResult[]): string {
  const pass = results.filter((r) => r.status === 'PASS').length;
  const warn = results.filter((r) => r.status === 'WARN').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;

  let md = `# RLS 감사 리포트\n\n`;
  md += `> 생성: ${new Date().toISOString()}\n`;
  md += `> 대상: ${SUPABASE_URL}\n\n`;
  md += `## 요약\n\n`;
  md += `| 상태 | 개수 |\n|------|-----:|\n`;
  md += `| PASS | ${pass} |\n`;
  md += `| WARN | ${warn} |\n`;
  md += `| FAIL | ${fail} |\n\n`;
  md += `**총 테이블**: ${results.length}\n\n`;

  if (fail > 0) md += `⚠️ **Critical 이슈 ${fail}건 — 즉시 조치 필요**\n\n`;

  md += `## 상세 (전체)\n\n`;
  md += `| 테이블 | RLS | 정책 수 | S/I/U/D | 상태 | 이슈 |\n`;
  md += `|--------|:---:|:------:|:-------:|:----:|------|\n`;
  for (const r of results) {
    const flags =
      (r.has_select ? 'S' : '-') +
      (r.has_insert ? 'I' : '-') +
      (r.has_update ? 'U' : '-') +
      (r.has_delete ? 'D' : '-');
    md += `| ${r.tablename} | ${r.rowsecurity ? '✅' : '❌'} | ${r.policy_count} | ${flags} | ${r.status} | ${r.issues.join('; ') || '-'} |\n`;
  }
  return md;
}

async function main() {
  console.log('RLS 감사 시작...');
  const tables = await fetchTables();
  console.log(`대상 테이블: ${tables.length}`);

  const results = audit(tables);
  const report = renderReport(results);

  writeFileSync('docs/rls-audit-report.md', report, 'utf-8');
  console.log('\n리포트: docs/rls-audit-report.md');

  const fail = results.filter((r) => r.status === 'FAIL').length;
  const warn = results.filter((r) => r.status === 'WARN').length;
  console.log(`PASS: ${results.length - fail - warn}, WARN: ${warn}, FAIL: ${fail}`);

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
