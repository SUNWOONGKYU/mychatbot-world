/**
 * @task S5F1
 * @description Wiki 관리 페이지 — 봇별 위키 목록/검색/삭제
 *
 * 경로: /bot/[botId]/wiki
 * 기능:
 *  - wiki_pages 목록 조회 (page_type 필터: all/manual/auto_generated/faq)
 *  - 제목 검색
 *  - 위키 상세 내용 모달 보기
 *  - 위키 삭제
 *  - Wiki Lint 대시보드로 이동
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// ============================
// 타입 정의
// ============================

interface WikiPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  page_type: 'manual' | 'auto_generated' | 'faq';
  auto_generated: boolean;
  quality_score: number;
  view_count: number;
  is_stale: boolean;
  created_at: string;
  updated_at: string;
}

type FilterType = 'all' | 'manual' | 'auto_generated' | 'faq';

// ============================
// 컴포넌트
// ============================

export default function WikiManagePage() {
  const params = useParams<{ botId: string }>();
  const botId = params?.botId ?? '';

  const [pages, setPages] = useState<WikiPage[]>([]);
  const [filtered, setFiltered] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selected, setSelected] = useState<WikiPage | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // 목록 로드
  const loadPages = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/wiki/pages?bot_id=${botId}`);
      const json = await resp.json();
      if (!json.success) throw new Error(json.error ?? '위키 목록 로드 실패');
      setPages(json.data ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (botId) loadPages();
  }, [botId]);

  // 필터링
  useEffect(() => {
    let list = pages;
    if (filterType !== 'all') {
      list = list.filter((p) => p.page_type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [pages, filterType, search]);

  // 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('이 위키 페이지를 삭제하시겠습니까?')) return;
    setDeleting(id);
    try {
      const resp = await fetch('/api/wiki/pages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await resp.json();
      if (!json.success) throw new Error(json.error ?? '삭제 실패');
      setPages((prev) => prev.filter((p) => p.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  const PAGE_TYPE_LABELS: Record<FilterType, string> = {
    all: '전체',
    manual: '수동',
    auto_generated: '자동 생성',
    faq: 'FAQ',
  };

  const TYPE_BADGE: Record<string, string> = {
    manual: 'bg-blue-100 text-blue-800',
    auto_generated: 'bg-green-100 text-green-800',
    faq: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-base))]">
      {/* 헤더 */}
      <div className="bg-[rgb(var(--bg-surface))] border-b border-[rgb(var(--border))] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(var(--text-primary-rgb))]">Wiki 관리</h1>
          <p className="text-sm text-[rgb(var(--text-secondary-rgb))] mt-0.5">
            총 {pages.length}개 위키 페이지
          </p>
        </div>
        <a
          href={`/bot/${botId}/wiki/lint`}
          className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Lint 대시보드
        </a>
      </div>

      <div className="px-6 py-4">
        {/* 검색 + 필터 */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="제목 또는 내용 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary-rgb))] placeholder:text-[rgb(var(--text-muted))] rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary-rgb))] rounded-lg px-3 py-2 text-sm outline-none"
          >
            {(Object.keys(PAGE_TYPE_LABELS) as FilterType[]).map((k) => (
              <option key={k} value={k}>
                {PAGE_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
          <button
            onClick={loadPages}
            className="px-4 py-2 text-sm border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary-rgb))] rounded-lg hover:bg-[rgb(var(--bg-subtle))]"
          >
            새로고침
          </button>
        </div>

        {/* 에러 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="text-center py-16 text-[rgb(var(--text-secondary-rgb))]">로딩 중...</div>
        )}

        {/* 목록 */}
        {!loading && (
          <div className="grid gap-3">
            {filtered.length === 0 && (
              <div className="text-center py-16 text-[rgb(var(--text-secondary-rgb))]">
                위키 페이지가 없습니다.
              </div>
            )}
            {filtered.map((page) => (
              <div
                key={page.id}
                className={`bg-[rgb(var(--bg-surface))] rounded-lg border border-[rgb(var(--border))] p-4 cursor-pointer hover:border-blue-400 transition ${
                  page.is_stale ? 'border-orange-300' : ''
                }`}
                onClick={() => setSelected(page)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          TYPE_BADGE[page.page_type] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {PAGE_TYPE_LABELS[page.page_type as FilterType] ?? page.page_type}
                      </span>
                      {page.is_stale && (
                        <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800">
                          오래된 콘텐츠
                        </span>
                      )}
                      <span className="text-xs text-[rgb(var(--text-muted))]">
                        조회 {page.view_count}회
                      </span>
                      {page.quality_score > 0 && (
                        <span className="text-xs text-[rgb(var(--text-muted))]">
                          품질 {Math.round(page.quality_score * 100)}%
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-[rgb(var(--text-primary-rgb))] truncate">
                      {page.title}
                    </h3>
                    <p className="text-sm text-[rgb(var(--text-secondary-rgb))] mt-1 line-clamp-2">
                      {page.content.slice(0, 120)}...
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(page.id);
                    }}
                    disabled={deleting === page.id}
                    className="ml-3 px-3 py-1.5 text-xs text-red-700 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting === page.id ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[rgb(var(--bg-surface))] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6 border border-[rgb(var(--border))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary-rgb))]">
                {selected.title}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-[rgb(var(--text-secondary-rgb))] hover:text-[rgb(var(--text-primary-rgb))] text-xl"
              >
                ×
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  TYPE_BADGE[selected.page_type] ?? 'bg-gray-100 text-gray-700'
                }`}
              >
                {PAGE_TYPE_LABELS[selected.page_type as FilterType]}
              </span>
              <span className="text-xs text-[rgb(var(--text-muted))] self-center">
                슬러그: {selected.slug}
              </span>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-[rgb(var(--text-primary-rgb))] bg-[rgb(var(--bg-subtle))] rounded-lg p-4 overflow-auto">
              {selected.content}
            </pre>
            <div className="mt-4 flex justify-between items-center text-xs text-[rgb(var(--text-muted))]">
              <span>
                생성: {new Date(selected.created_at).toLocaleDateString()}
              </span>
              <button
                onClick={() => handleDelete(selected.id)}
                className="px-3 py-1.5 text-red-700 border border-red-300 rounded hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
