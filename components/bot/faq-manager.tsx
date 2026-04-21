/**
 * @task S2FE7
 * @description FAQ 관리 컴포넌트
 *
 * 기능:
 * - FAQ 목록 표시 (번호, 질문, 답변, 수정/삭제 버튼)
 * - 인라인 편집 (클릭 → textarea 전환, 저장/취소)
 * - 새 FAQ 추가 (+추가 버튼 → 빈 인라인 row)
 * - 삭제 확인 다이얼로그
 * - "AI 자동 생성" 버튼 → /api/create-bot/faq 호출
 * - 드래그앤드롭 순서 변경 (마우스 이벤트 기반, 의존성 없음)
 * - 낙관적 업데이트 (삭제 시 UI 먼저 반영)
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import type { FaqRecord } from '@/app/api/faq/route';

// ────────────────────────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────────────────────────

/** 편집 중인 항목 상태 */
interface EditingState {
  id: string | null; // null = 신규 추가
  question: string;
  answer: string;
}

/** 드래그 상태 */
interface DragState {
  draggingId: string | null;
  overIndex: number | null;
}

interface FaqManagerProps {
  /** 코코봇 ID */
  botId: string;
  /** 초기 FAQ 목록 */
  initialFaqs: FaqRecord[];
  /** 코코봇 이름 (AI 자동 생성 시 사용) */
  botName?: string;
  /** 코코봇 설명 (AI 자동 생성 시 사용) */
  botDescription?: string;
}

// ────────────────────────────────────────────────────────────────
// 유틸리티
// ────────────────────────────────────────────────────────────────

/** FAQ ID가 임시인지 확인 (신규 추가 중인 항목) */
const isTempId = (id: string) => id.startsWith('__new__');

// ────────────────────────────────────────────────────────────────
// 컴포넌트
// ────────────────────────────────────────────────────────────────

/**
 * FAQ 관리 컴포넌트
 * 코코봇 FAQ의 추가, 편집, 삭제, 순서 변경을 제공한다.
 */
export function FaqManager({
  botId,
  initialFaqs,
  botName = '',
  botDescription = '',
}: FaqManagerProps) {
  // ── 상태 ──────────────────────────────────────────────────────
  const [faqs, setFaqs] = useState<FaqRecord[]>(initialFaqs);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null); // 확인 다이얼로그 대상 ID
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState>({ draggingId: null, overIndex: null });
  const dragSrcIndex = useRef<number | null>(null);

  // ── FAQ 불러오기 (새로고침) ────────────────────────────────────
  const reload = useCallback(async () => {
    try {
      const res = await fetch(`/api/faq?botId=${botId}`);
      const json = await res.json();
      if (json.success) setFaqs(json.data ?? []);
    } catch {
      // 조용히 실패 — 낙관적 업데이트로 UI는 이미 최신 상태
    }
  }, [botId]);

  // ── 편집 시작 ─────────────────────────────────────────────────
  const startEdit = (faq: FaqRecord) => {
    setEditing({ id: faq.id, question: faq.question, answer: faq.answer });
    setError(null);
  };

  /** 신규 FAQ 행 추가 */
  const startNew = () => {
    const tempId = `__new__${Date.now()}`;
    const newFaq: FaqRecord = {
      id: tempId,
      chatbot_id: botId,
      question: '',
      answer: '',
      order_index: faqs.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setFaqs((prev) => [...prev, newFaq]);
    setEditing({ id: tempId, question: '', answer: '' });
    setError(null);
  };

  /** 편집 취소 */
  const cancelEdit = () => {
    if (editing && isTempId(editing.id ?? '')) {
      // 임시 행 제거
      setFaqs((prev) => prev.filter((f) => f.id !== editing.id));
    }
    setEditing(null);
    setError(null);
  };

  // ── 저장 (추가 / 수정) ────────────────────────────────────────
  const saveEdit = async () => {
    if (!editing) return;

    const { id, question, answer } = editing;
    if (!question.trim() || !answer.trim()) {
      setError('질문과 답변을 모두 입력해 주세요.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isTempId(id ?? '')) {
        // ── 신규 추가 ────────────────────────────────────────────
        const res = await fetch('/api/faq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatbot_id: botId,
            question: question.trim(),
            answer: answer.trim(),
            order_index: faqs.length - 1,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? '추가 실패');

        // 임시 ID → 실제 ID로 교체
        setFaqs((prev) =>
          prev.map((f) => (f.id === id ? (json.data as FaqRecord) : f))
        );
      } else {
        // ── 수정 ─────────────────────────────────────────────────
        const res = await fetch(`/api/faq/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: question.trim(), answer: answer.trim() }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? '수정 실패');

        setFaqs((prev) =>
          prev.map((f) => (f.id === id ? (json.data as FaqRecord) : f))
        );
      }

      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // ── 삭제 ──────────────────────────────────────────────────────
  const confirmDelete = (id: string) => setDeleting(id);
  const cancelDelete = () => setDeleting(null);

  const executeDelete = async () => {
    if (!deleting) return;

    // 낙관적 업데이트 — UI 먼저 제거
    setFaqs((prev) => prev.filter((f) => f.id !== deleting));
    setDeleting(null);

    try {
      const res = await fetch(`/api/faq/${deleting}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        // 실패 시 서버에서 다시 로드
        await reload();
      }
    } catch {
      await reload();
    }
  };

  // ── AI 자동 생성 ──────────────────────────────────────────────
  const generateWithAI = async () => {
    if (!botName && !botDescription) {
      setError('AI 자동 생성을 위해 코코봇 이름 또는 설명이 필요합니다.');
      return;
    }

    setAiLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/create-bot/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: botName || '코코봇',
          description: botDescription || botName || '코코봇 서비스',
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'AI 생성 실패');

      const generated: Array<{ question: string; answer: string }> = json.data?.faqs ?? [];

      // 기존 FAQ와 병합 (중복 질문 제외)
      const existingQuestions = new Set(faqs.map((f) => f.question.trim().toLowerCase()));
      const toAdd = generated.filter(
        (g) => !existingQuestions.has(g.question.trim().toLowerCase())
      );

      if (toAdd.length === 0) {
        setError('생성된 FAQ가 기존 항목과 중복됩니다.');
        return;
      }

      // 각 항목을 순차적으로 추가
      let currentFaqs = [...faqs];
      for (const item of toAdd) {
        const res2 = await fetch('/api/faq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatbot_id: botId,
            question: item.question,
            answer: item.answer,
            order_index: currentFaqs.length,
          }),
        });
        const json2 = await res2.json();
        if (json2.success && json2.data) {
          currentFaqs = [...currentFaqs, json2.data as FaqRecord];
        }
      }
      setFaqs(currentFaqs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 생성 중 오류가 발생했습니다.');
    } finally {
      setAiLoading(false);
    }
  };

  // ── 드래그앤드롭 (네이티브 HTML5) ────────────────────────────
  const handleDragStart = (index: number, id: string) => {
    dragSrcIndex.current = index;
    setDrag({ draggingId: id, overIndex: null });
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDrag((prev) => ({ ...prev, overIndex: index }));
  };

  const handleDrop = async (targetIndex: number) => {
    const srcIndex = dragSrcIndex.current;
    if (srcIndex === null || srcIndex === targetIndex) {
      setDrag({ draggingId: null, overIndex: null });
      dragSrcIndex.current = null;
      return;
    }

    // UI 즉시 재정렬
    const reordered = [...faqs];
    const [moved] = reordered.splice(srcIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    const updated = reordered.map((f, i) => ({ ...f, order_index: i }));
    setFaqs(updated);
    setDrag({ draggingId: null, overIndex: null });
    dragSrcIndex.current = null;

    // 서버에 순서 업데이트 (fire-and-forget)
    try {
      await Promise.all(
        updated.map((f) =>
          fetch(`/api/faq/${f.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: f.order_index }),
          })
        )
      );
    } catch {
      // 조용히 실패
    }
  };

  const handleDragEnd = () => {
    setDrag({ draggingId: null, overIndex: null });
    dragSrcIndex.current = null;
  };

  // ── 렌더링 ────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* 상단 액션 바 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-text-secondary">
          총 <span className="font-semibold text-text-primary">{faqs.length}</span>개의 FAQ
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={generateWithAI}
            disabled={aiLoading || saving}
            className="
              inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-md text-sm font-medium
              bg-bg-subtle border border-border text-text-secondary
              hover:bg-bg-muted hover:text-text-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-150
            "
          >
            {aiLoading ? (
              <SpinIcon />
            ) : (
              <SparkleIcon />
            )}
            {aiLoading ? 'AI 생성 중...' : 'AI 자동 생성'}
          </button>

          <button
            type="button"
            onClick={startNew}
            disabled={editing !== null || aiLoading}
            className="
              inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-md text-sm font-medium
              bg-primary text-white
              hover:bg-primary-hover
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-150
            "
          >
            <PlusIcon />
            추가
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2.5">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* FAQ 목록 */}
      {faqs.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-subtle text-center py-12">
          <p className="text-text-secondary text-sm">등록된 FAQ가 없습니다.</p>
          <p className="text-text-muted text-xs mt-1">
            '+추가' 버튼으로 직접 입력하거나 'AI 자동 생성'을 사용하세요.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {faqs.map((faq, index) => {
            const isEditing = editing?.id === faq.id;
            const isDragging = drag.draggingId === faq.id;
            const isDragOver = drag.overIndex === index;

            return (
              <div
                key={faq.id}
                draggable={!isEditing}
                onDragStart={() => handleDragStart(index, faq.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                className={`
                  group bg-surface transition-colors duration-100
                  ${isDragging ? 'opacity-40' : ''}
                  ${isDragOver && !isDragging ? 'bg-primary/5 border-t-2 border-primary' : ''}
                `}
              >
                {isEditing ? (
                  // ── 편집 모드 ───────────────────────────────────
                  <div className="p-4 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">질문</label>
                      <textarea
                        value={editing.question}
                        onChange={(e) =>
                          setEditing((prev) => prev ? { ...prev, question: e.target.value } : prev)
                        }
                        placeholder="고객이 자주 묻는 질문을 입력하세요"
                        rows={2}
                        className="
                          w-full resize-none rounded-md border border-border bg-bg-base
                          px-3 py-2 text-sm text-text-primary placeholder:text-text-muted
                          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                          transition-colors
                        "
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">답변</label>
                      <textarea
                        value={editing.answer}
                        onChange={(e) =>
                          setEditing((prev) => prev ? { ...prev, answer: e.target.value } : prev)
                        }
                        placeholder="질문에 대한 답변을 입력하세요"
                        rows={4}
                        className="
                          w-full resize-none rounded-md border border-border bg-bg-base
                          px-3 py-2 text-sm text-text-primary placeholder:text-text-muted
                          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                          transition-colors
                        "
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={saving}
                        className="
                          inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-md text-sm font-medium
                          border border-border text-text-secondary
                          hover:bg-bg-subtle disabled:opacity-50
                          transition-colors
                        "
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={saving}
                        className="
                          inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-md text-sm font-medium
                          bg-primary text-white hover:bg-primary-hover
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-colors
                        "
                      >
                        {saving ? <SpinIcon /> : null}
                        {saving ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // ── 읽기 모드 ───────────────────────────────────
                  <div className="flex items-start gap-3 p-4">
                    {/* 드래그 핸들 */}
                    <span
                      className="mt-0.5 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary shrink-0"
                      title="드래그하여 순서 변경"
                    >
                      <DragIcon />
                    </span>

                    {/* 번호 */}
                    <span className="mt-0.5 text-sm font-medium text-text-muted w-6 shrink-0 text-right">
                      {index + 1}
                    </span>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium text-text-primary leading-snug">
                        {faq.question}
                      </p>
                      <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                        {faq.answer}
                      </p>
                    </div>

                    {/* 버튼 */}
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => startEdit(faq)}
                        disabled={editing !== null}
                        className="
                          p-1.5 rounded-md text-text-secondary
                          hover:bg-bg-subtle hover:text-text-primary
                          disabled:opacity-40
                          transition-colors
                        "
                        title="수정"
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(faq.id)}
                        disabled={editing !== null}
                        className="
                          p-1.5 rounded-md text-text-secondary
                          hover:bg-red-50 hover:text-red-600
                          disabled:opacity-40
                          transition-colors
                        "
                        title="삭제"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-surface border border-border shadow-xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary">FAQ 삭제</h3>
              <p className="mt-1 text-sm text-text-secondary">
                이 FAQ를 삭제하시겠습니까? 삭제된 항목은 복구할 수 없습니다.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelDelete}
                className="
                  inline-flex items-center min-h-[44px] px-4 py-2 rounded-md text-sm font-medium
                  border border-border text-text-secondary
                  hover:bg-bg-subtle transition-colors
                "
              >
                취소
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="
                  inline-flex items-center min-h-[44px] px-4 py-2 rounded-md text-sm font-medium
                  bg-red-600 text-white hover:bg-red-700
                  transition-colors
                "
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

// ────────────────────────────────────────────────────────────────
// 아이콘 컴포넌트
// ────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function DragIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function SpinIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
