/**
 * @task S5F3
 * @description Wiki Lint 대시보드 — 고아/오래된/중복 위키 감지 및 수동 실행
 *
 * 경로: /bot/[botId]/wiki/lint
 * 기능:
 *  - Lint 결과 최근 기록 조회 (wiki_lint_logs)
 *  - 수동 Lint 실행 버튼
 *  - 고아 페이지 / 오래된 콘텐츠 / 중복 제목 통계 표시
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// ============================
// 타입 정의
// ============================

interface LintLog {
  id: string;
  bot_id: string;
  orphan_count: number;
  stale_count: number;
  conflict_count: number;
  quality_avg: number;
  fixed_count: number;
  created_at: string;
}

interface LintResult {
  orphan_pages: { id: string; title: string }[];
  stale_pages: { id: string; title: string }[];
  conflict_groups: { title: string; count: number }[];
  quality_avg: number;
  fixed_count: number;
  log_id: string;
}

// ============================
// 컴포넌트
// ============================

export default function WikiLintPage() {
  const params = useParams<{ botId: string }>();
  const botId = params?.botId ?? '';

  const [logs, setLogs] = useState<LintLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<LintResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 최근 Lint 로그 조회
  const loadLogs = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/wiki/lint?bot_id=${botId}&limit=10`);
      const json = await resp.json();
      if (!json.success) throw new Error(json.error ?? 'Lint 로그 조회 실패');
      setLogs(json.data ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (botId) loadLogs();
  }, [botId]);

  // Lint 실행
  const runLint = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch('/api/wiki/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_id: botId }),
      });
      const json = await resp.json();
      if (!json.success) throw new Error(json.error ?? 'Lint 실행 실패');
      setResult(json.data);
      await loadLogs();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const STAT_CARD = (label: string, value: number | string, color: string) => (
    <div className={`bg-white rounded-lg border p-4 ${color}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Wiki Lint 대시보드</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            고아 페이지 / 오래된 콘텐츠 / 중복 제목 감지
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/bot/${botId}/wiki`}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Wiki 목록
          </a>
          <button
            onClick={runLint}
            disabled={running || !botId}
            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {running ? 'Lint 실행 중...' : 'Lint 실행'}
          </button>
        </div>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* 에러 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Lint 결과 (방금 실행한 경우) */}
        {result && (
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Lint 결과</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {STAT_CARD('고아 페이지', result.orphan_pages.length, 'border-red-200')}
              {STAT_CARD('오래된 페이지', result.stale_pages.length, 'border-orange-200')}
              {STAT_CARD('중복 제목 그룹', result.conflict_groups.length, 'border-yellow-200')}
              {STAT_CARD('자동 수정', result.fixed_count, 'border-green-200')}
            </div>

            {result.orphan_pages.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-red-700 mb-2">고아 페이지 (KB 없이 존재)</h3>
                <div className="space-y-1">
                  {result.orphan_pages.map((p) => (
                    <div key={p.id} className="text-sm text-gray-700 bg-red-50 px-3 py-1.5 rounded">
                      {p.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.stale_pages.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-orange-700 mb-2">오래된 페이지 (30일 이상 미조회)</h3>
                <div className="space-y-1">
                  {result.stale_pages.map((p) => (
                    <div key={p.id} className="text-sm text-gray-700 bg-orange-50 px-3 py-1.5 rounded">
                      {p.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.conflict_groups.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-yellow-700 mb-2">중복 의심 제목</h3>
                <div className="space-y-1">
                  {result.conflict_groups.map((g) => (
                    <div key={g.title} className="text-sm text-gray-700 bg-yellow-50 px-3 py-1.5 rounded flex justify-between">
                      <span>{g.title}</span>
                      <span className="text-yellow-600">{g.count}개</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.orphan_pages.length === 0 &&
              result.stale_pages.length === 0 &&
              result.conflict_groups.length === 0 && (
                <div className="text-center py-6 text-green-600 font-medium">
                  문제 없음 — 위키 상태 양호
                </div>
              )}
          </div>
        )}

        {/* Lint 이력 */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Lint 실행 이력</h2>
          {loading && (
            <div className="text-center py-8 text-gray-400">로딩 중...</div>
          )}
          {!loading && logs.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              아직 Lint 기록이 없습니다. Lint 실행 버튼을 눌러보세요.
            </div>
          )}
          {!loading && logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 pr-4">실행 일시</th>
                    <th className="pb-2 pr-4">고아</th>
                    <th className="pb-2 pr-4">오래됨</th>
                    <th className="pb-2 pr-4">중복</th>
                    <th className="pb-2 pr-4">평균 품질</th>
                    <th className="pb-2">수정</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-gray-600">
                        {new Date(log.created_at).toLocaleString('ko-KR')}
                      </td>
                      <td className="py-2 pr-4">
                        <span className={log.orphan_count > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                          {log.orphan_count}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={log.stale_count > 0 ? 'text-orange-600 font-medium' : 'text-gray-400'}>
                          {log.stale_count}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={log.conflict_count > 0 ? 'text-yellow-600 font-medium' : 'text-gray-400'}>
                          {log.conflict_count}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {log.quality_avg > 0 ? `${Math.round(log.quality_avg * 100)}%` : '-'}
                      </td>
                      <td className="py-2 text-green-600">
                        {log.fixed_count > 0 ? log.fixed_count : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
