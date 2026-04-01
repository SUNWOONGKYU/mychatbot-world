/**
 * @task S2FE3
 * @description KB 관리 컴포넌트
 *
 * - 선택된 챗봇의 KB 문서 목록 조회 (GET /api/kb?chatbot_id={id})
 * - 새 문서 추가 (POST /api/kb → POST /api/kb/embed)
 * - 문서 삭제 (DELETE /api/kb?id={id})
 * - 임베딩 중 로딩 스피너
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import type { Bot } from '@/app/home/page';

// ── 타입 정의 ─────────────────────────────────────────────────

/** Knowledge Base 항목 */
interface KbItem {
  id: string;
  chatbot_id: string;
  title: string;
  content: string;
  source_type: 'text' | 'file' | 'url';
  char_count: number;
  chunk_count: number;
  is_embedded: boolean;
  created_at: string;
  updated_at: string;
}

/** 새 문서 추가 폼 */
interface AddDocForm {
  title: string;
  content: string;
}

const EMPTY_FORM: AddDocForm = { title: '', content: '' };

/** KbManager Props */
interface KbManagerProps {
  botId: string | null;
  bots: Bot[];
  onSelectBot: (id: string) => void;
}

// ── 유틸 ────────────────────────────────────────────────────

/**
 * 글자 수를 사람이 읽기 쉽게 포맷
 * @param count - 글자 수
 * @returns 포맷된 문자열 (예: "1.2K자")
 */
function formatCharCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K자`;
  return `${count}자`;
}

// ── KB 문서 행 컴포넌트 ──────────────────────────────────────

interface KbRowProps {
  item: KbItem;
  onDelete: (id: string) => void;
}

/**
 * KB 문서 목록의 한 행
 */
function KbRow({ item, onDelete }: KbRowProps) {
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`"${item.title}" 문서를 삭제하시겠습니까?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/kb?id=${item.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? '삭제 실패');
      }
      onDelete(item.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : '문서 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-surface">
      {/* 헤더 행 */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-hover transition-colors"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
      >
        {/* 임베딩 상태 아이콘 */}
        <span
          className={clsx(
            'w-2 h-2 rounded-full shrink-0',
            item.is_embedded ? 'bg-success' : 'bg-warning',
          )}
          title={item.is_embedded ? '임베딩 완료' : '임베딩 대기'}
        />

        {/* 제목 */}
        <span className="flex-1 text-sm font-medium text-text-primary truncate">
          {item.title}
        </span>

        {/* 메타 */}
        <div className="flex items-center gap-3 text-xs text-text-muted shrink-0">
          <span>{formatCharCount(item.char_count)}</span>
          <span>{item.chunk_count} 청크</span>
          <span className={clsx(
            'px-1.5 py-0.5 rounded text-[10px] font-medium',
            item.is_embedded ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
          )}>
            {item.is_embedded ? '임베딩됨' : '대기중'}
          </span>
        </div>

        {/* 펼치기 화살표 */}
        <span
          className={clsx(
            'text-text-muted text-xs transition-transform',
            expanded ? 'rotate-180' : '',
          )}
          aria-hidden="true"
        >
          ▾
        </span>
      </div>

      {/* 본문 펼침 */}
      {expanded && (
        <div className="px-4 pb-3 border-t border-border">
          <p className="text-xs text-text-secondary mt-2 whitespace-pre-wrap line-clamp-6">
            {item.content}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-text-muted">
              {new Date(item.created_at).toLocaleString('ko-KR')}
            </span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={clsx(
                'px-3 py-1 rounded-lg text-xs font-medium',
                'bg-error/10 text-error hover:bg-error/20 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {deleting ? '삭제 중…' : '삭제'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 메인 KbManager 컴포넌트 ──────────────────────────────────

/**
 * KbManager — KB 문서 관리 UI
 * - 봇 선택 셀렉트
 * - 문서 목록 (임베딩 상태 표시)
 * - 새 문서 추가 폼 (제목 + 내용 → embed API 호출)
 */
export function KbManager({ botId, bots, onSelectBot }: KbManagerProps) {
  const [items, setItems] = useState<KbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<AddDocForm>(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ── KB 목록 로딩 ──────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    if (!botId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/kb?chatbot_id=${botId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      const list: KbItem[] = data?.data?.items ?? data?.items ?? data ?? [];
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'KB 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [botId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ── 문서 추가 ─────────────────────────────────────────────

  /**
   * 새 문서 저장 + 임베딩 트리거
   * 1. POST /api/kb → kb 항목 생성
   * 2. POST /api/kb/embed → 임베딩 트리거 (비동기)
   */
  const handleAdd = async () => {
    if (!botId) return;
    if (!form.title.trim()) {
      setAddError('제목을 입력하세요.');
      return;
    }
    if (!form.content.trim()) {
      setAddError('내용을 입력하세요.');
      return;
    }

    setAddError(null);
    setAdding(true);

    try {
      // 1단계: KB 항목 생성
      const createRes = await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbot_id: botId,
          title: form.title.trim(),
          content: form.content.trim(),
          source_type: 'text',
        }),
      });

      if (!createRes.ok) {
        const body = await createRes.json().catch(() => ({}));
        throw new Error(body?.error ?? '문서 저장 실패');
      }

      const createData = await createRes.json();
      const newItem: KbItem = createData?.data ?? createData;

      // 목록에 추가
      setItems((prev) => [newItem, ...prev]);
      setForm(EMPTY_FORM);

      // 2단계: 임베딩 트리거 (비동기, 실패해도 UI 차단 안 함)
      setEmbedding(true);
      try {
        await fetch('/api/kb/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kb_id: newItem.id }),
        });
        // 임베딩 완료 후 목록 갱신
        await fetchItems();
      } catch {
        // 임베딩 실패는 조용히 처리 (비동기)
      } finally {
        setEmbedding(false);
      }
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '문서 추가에 실패했습니다.');
    } finally {
      setAdding(false);
    }
  };

  // ── 문서 삭제 처리 ────────────────────────────────────────

  const handleDeleted = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // ── 렌더 ──────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* 봇 선택 */}
      <div className="flex items-center gap-3">
        <label htmlFor="kb-bot-select" className="text-sm font-medium text-text-secondary shrink-0">
          챗봇 선택:
        </label>
        <select
          id="kb-bot-select"
          value={botId ?? ''}
          onChange={(e) => onSelectBot(e.target.value)}
          className={clsx(
            'px-3 py-2 rounded-lg text-sm bg-surface border border-border',
            'text-text-primary focus:outline-none focus:ring-2 focus:ring-primary',
          )}
        >
          {bots.length === 0 && (
            <option value="" disabled>
              챗봇 없음
            </option>
          )}
          {bots.map((bot) => (
            <option key={bot.id} value={bot.id}>
              {bot.name}
            </option>
          ))}
        </select>

        {/* 임베딩 진행 중 스피너 */}
        {embedding && (
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>임베딩 처리 중…</span>
          </div>
        )}
      </div>

      {/* 새 문서 추가 폼 */}
      <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">새 문서 추가</h3>

        {addError && (
          <p className="text-xs text-error">{addError}</p>
        )}

        <input
          type="text"
          placeholder="제목 (예: 자주 묻는 질문)"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className={clsx(
            'w-full px-3 py-2 rounded-lg text-sm',
            'bg-bg-subtle border border-border',
            'text-text-primary placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          )}
          maxLength={200}
          disabled={adding || !botId}
        />

        <textarea
          placeholder="문서 내용을 입력하세요. 이 내용이 챗봇의 지식베이스로 사용됩니다."
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          rows={5}
          className={clsx(
            'w-full px-3 py-2 rounded-lg text-sm resize-none',
            'bg-bg-subtle border border-border',
            'text-text-primary placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          )}
          disabled={adding || !botId}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">
            {form.content.length.toLocaleString()}자
          </span>
          <button
            onClick={handleAdd}
            disabled={adding || !botId || !form.title.trim() || !form.content.trim()}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'bg-primary text-white',
              'hover:bg-primary-hover transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            )}
          >
            {adding ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                저장 중…
              </span>
            ) : (
              '문서 추가'
            )}
          </button>
        </div>
      </div>

      {/* KB 문서 목록 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            문서 목록
            {items.length > 0 && (
              <span className="ml-1.5 text-xs font-normal text-text-muted">
                ({items.length}개)
              </span>
            )}
          </h3>
          <button
            onClick={fetchItems}
            className="text-xs text-primary hover:underline focus-visible:outline-none"
            disabled={loading || !botId}
          >
            새로고침
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-bg-subtle animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-10 gap-2 text-center">
            <span className="text-2xl">⚠️</span>
            <p className="text-sm text-error">{error}</p>
            <button
              onClick={fetchItems}
              className="text-sm text-primary hover:underline focus-visible:outline-none"
            >
              다시 시도
            </button>
          </div>
        ) : !botId ? (
          <div className="flex items-center justify-center h-24 text-text-muted text-sm">
            챗봇을 먼저 선택하세요.
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <span className="text-4xl">📄</span>
            <p className="text-sm text-text-secondary">
              아직 KB 문서가 없습니다.<br />
              위 폼으로 첫 문서를 추가해보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <KbRow key={item.id} item={item} onDelete={handleDeleted} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
