/**
 * @task S5FE6
 * @description 마이페이지 탭3 — 챗봇 학습 (구 Learning 통합)
 * KB 주입, Wiki-e-RAG, FAQ, 전체 학습 현황
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

type KbTab = 'file' | 'text' | 'obsidian';
type WikiSection = 'ingest' | 'pages' | 'graph' | 'lint' | 'growth';

const KB_TABS: { id: KbTab; label: string; icon: string }[] = [
  { id: 'file',     label: '파일 업로드',  icon: '📁' },
  { id: 'text',     label: '텍스트 입력',  icon: '✏️' },
  { id: 'obsidian', label: 'Obsidian .md', icon: '🌿' },
];

const WIKI_SECTIONS: { id: WikiSection; label: string; icon: string; desc: string }[] = [
  { id: 'ingest',  label: 'Wiki 자동 생성', icon: '⚡', desc: '콘텐츠를 분석해 Wiki 페이지를 자동 생성합니다.' },
  { id: 'pages',   label: 'Wiki 페이지 목록/편집', icon: '📄', desc: 'Wiki 페이지를 목록으로 보고 편집합니다.' },
  { id: 'graph',   label: 'Wiki 그래프 뷰', icon: '🕸️', desc: 'Wiki 페이지 간 연결 관계를 시각화합니다.' },
  { id: 'lint',    label: 'Wiki Lint',     icon: '✅', desc: 'Wiki 품질 점검 및 개선 제안을 제공합니다.' },
  { id: 'growth',  label: '축적 현황',     icon: '📈', desc: '복리 성장 지표 — 누적 KB/Wiki/FAQ를 확인합니다.' },
];

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('mcw_access_token') || sessionStorage.getItem('mcw_access_token') || '';
}
function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

// ── KB 주입 패널 ──────────────────────────────────────────────────────────

function KbInjectPanel() {
  const [activeTab, setActiveTab] = useState<KbTab>('file');
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const obsidianRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'obsidian') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadResult('');
    try {
      const token = getToken();
      let successCount = 0;
      for (const f of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', f);
        formData.append('type', type);
        const res = await fetch('/api/kb/upload', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (res.ok) successCount++;
      }
      setUploadResult(`${successCount}개 파일 업로드 완료! KB에 반영되었습니다.`);
    } catch {
      setUploadResult('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!text.trim()) return;
    setUploading(true);
    setUploadResult('');
    try {
      const token = getToken();
      const res = await fetch('/api/kb/text', {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (!res.ok) throw new Error('전송 실패');
      setUploadResult('텍스트가 KB에 추가되었습니다.');
      setText('');
    } catch {
      setUploadResult('전송 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-5"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <h3 className="text-base font-semibold text-[rgb(var(--text-primary))] mb-4">KB 주입</h3>

      {/* 탭 */}
      <div className="flex gap-1 mb-4 bg-[rgb(var(--bg-subtle))] p-1 rounded-[var(--radius-md)]">
        {KB_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] shadow-sm'
                : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]',
            )}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'file' && (
        <div
          onClick={() => fileRef.current?.click()}
          className={clsx(
            'flex flex-col items-center justify-center gap-3 py-10 rounded-[var(--radius-lg)]',
            'border-2 border-dashed border-[rgb(var(--border))] cursor-pointer',
            'hover:border-[rgb(var(--color-primary)/0.5)] hover:bg-[rgb(var(--color-primary-muted)/0.3)] transition-colors',
          )}
        >
          <span className="text-4xl">📁</span>
          <div className="text-center">
            <p className="text-sm font-medium text-[rgb(var(--text-primary))]">파일을 클릭하거나 드래그하여 업로드</p>
            <p className="text-xs text-[rgb(var(--text-muted))] mt-1">PDF, TXT, DOCX 지원</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.txt,.doc,.docx"
            className="hidden"
            onChange={e => handleFileUpload(e, 'file')}
          />
        </div>
      )}

      {activeTab === 'text' && (
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="KB에 추가할 텍스트를 입력하세요..."
            rows={6}
            className={clsx(
              'w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-[rgb(var(--border))]',
              'bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary))]',
              'placeholder:text-[rgb(var(--text-muted))]',
              'focus:outline-none focus:border-[rgb(var(--color-primary))] resize-none',
            )}
          />
          <button
            type="button"
            onClick={handleTextSubmit}
            disabled={uploading || !text.trim()}
            className={clsx(
              'px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold transition-colors',
              'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]',
              'hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50',
            )}
          >
            {uploading ? '추가 중...' : 'KB에 추가'}
          </button>
        </div>
      )}

      {activeTab === 'obsidian' && (
        <div
          onClick={() => obsidianRef.current?.click()}
          className={clsx(
            'flex flex-col items-center justify-center gap-3 py-10 rounded-[var(--radius-lg)]',
            'border-2 border-dashed border-[rgb(var(--border))] cursor-pointer',
            'hover:border-[rgb(var(--color-primary)/0.5)] hover:bg-[rgb(var(--color-primary-muted)/0.3)] transition-colors',
          )}
        >
          <span className="text-4xl">🌿</span>
          <div className="text-center">
            <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Obsidian .md 파일 업로드</p>
            <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Wikilinks([[...]]) 형식 지원</p>
          </div>
          <input
            ref={obsidianRef}
            type="file"
            multiple
            accept=".md"
            className="hidden"
            onChange={e => handleFileUpload(e, 'obsidian')}
          />
        </div>
      )}

      {/* 결과 메시지 */}
      {uploadResult && (
        <p className={clsx(
          'mt-3 text-sm',
          uploadResult.includes('오류') ? 'text-[rgb(var(--color-error))]' : 'text-[rgb(var(--color-success))]',
        )}>
          {uploadResult}
        </p>
      )}
    </div>
  );
}

// ── Wiki 섹션 컴포넌트들 ──────────────────────────────────────────────────

function WikiPagesSection() {
  const [pages, setPages] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/wiki/pages', { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPages(d?.pages ?? d?.data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <p className="text-sm text-[rgb(var(--text-muted))] text-center py-3">로딩 중...</p>;
  if (pages.length === 0) return <p className="text-sm text-[rgb(var(--text-muted))] text-center py-3">Wiki 페이지가 없습니다. Wiki 자동 생성을 먼저 실행하세요.</p>;
  return (
    <div className="space-y-2">
      {pages.slice(0, 10).map(p => (
        <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))]">
          <span className="text-sm text-[rgb(var(--text-primary))]">{p.title}</span>
          <span className="text-xs text-[rgb(var(--text-muted))]">{p.updated_at ? new Date(p.updated_at).toLocaleDateString('ko-KR') : ''}</span>
        </div>
      ))}
      {pages.length > 10 && <p className="text-xs text-[rgb(var(--text-muted))] text-center">외 {pages.length - 10}개</p>}
    </div>
  );
}

function WikiGraphSection() {
  return (
    <div className="py-4 text-center">
      <p className="text-3xl mb-2">🕸️</p>
      <p className="text-sm text-[rgb(var(--text-secondary))]">Wiki 그래프 시각화</p>
      <a href="/wiki/graph" className="mt-2 inline-block text-xs text-[rgb(var(--color-primary))] hover:underline">그래프 뷰 열기 →</a>
    </div>
  );
}

function WikiLintSection() {
  const [result, setResult] = useState<{ score: number; issues: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wiki/lint', { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        setResult({ score: d?.score ?? 100, issues: d?.issues ?? [] });
      }
    } catch {} finally { setLoading(false); }
  };
  return (
    <div className="space-y-3">
      <button onClick={run} disabled={loading}
        className="px-4 py-2 text-sm rounded-[var(--radius-md)] bg-[rgb(var(--color-primary))] text-white font-semibold hover:opacity-90 disabled:opacity-50">
        {loading ? '검사 중...' : '품질 점검 실행'}
      </button>
      {result && (
        <div>
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">품질 점수: <span className="text-[rgb(var(--color-success))]">{result.score}점</span></p>
          {result.issues.length === 0
            ? <p className="text-xs text-[rgb(var(--color-success))] mt-1">문제가 없습니다.</p>
            : <ul className="mt-2 space-y-1">{result.issues.map((issue, i) => (
                <li key={i} className="text-xs text-[rgb(var(--color-warning))]">• {issue}</li>
              ))}</ul>}
        </div>
      )}
    </div>
  );
}

function WikiGrowthSection() {
  const [stats, setStats] = useState<{ kb_count: number; wiki_count: number; faq_count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/wiki/accumulate', { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats({ kb_count: d?.kb_count ?? 0, wiki_count: d?.wiki_count ?? 0, faq_count: d?.faq_count ?? 0 }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <p className="text-sm text-[rgb(var(--text-muted))] text-center py-3">로딩 중...</p>;
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'KB 문서', value: stats?.kb_count ?? 0, icon: '📚' },
        { label: 'Wiki 페이지', value: stats?.wiki_count ?? 0, icon: '📄' },
        { label: 'FAQ', value: stats?.faq_count ?? 0, icon: '❓' },
      ].map(item => (
        <div key={item.label} className="bg-[rgb(var(--bg-surface))] rounded-[var(--radius-md)] border border-[rgb(var(--border))] p-3 text-center">
          <p className="text-2xl mb-1">{item.icon}</p>
          <p className="text-xl font-bold text-[rgb(var(--text-primary))]">{item.value}</p>
          <p className="text-xs text-[rgb(var(--text-muted))]">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Wiki-e-RAG 패널 ──────────────────────────────────────────────────────

function WikiRAGPanel() {
  const [activeSection, setActiveSection] = useState<WikiSection | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState('');

  const handleIngest = async () => {
    setIngesting(true);
    setIngestResult('');
    try {
      const token = getToken();
      const res = await fetch('/api/wiki/ingest', {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Ingest 실패');
      setIngestResult('Wiki 자동 생성이 완료되었습니다.');
    } catch {
      setIngestResult('Ingest 중 오류가 발생했습니다.');
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div
      className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-5"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <h3 className="text-base font-semibold text-[rgb(var(--text-primary))] mb-4">Wiki-e-RAG 연동</h3>

      <div className="grid gap-3">
        {WIKI_SECTIONS.map(section => (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] border text-left transition-colors',
                activeSection === section.id
                  ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary-muted))]'
                  : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-subtle))] hover:border-[rgb(var(--border-strong))]',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{section.icon}</span>
                <div>
                  <p className={clsx(
                    'text-sm font-semibold',
                    activeSection === section.id ? 'text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--text-primary))]',
                  )}>
                    {section.label}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">{section.desc}</p>
                </div>
              </div>
              <span className={clsx('text-[rgb(var(--text-muted))] transition-transform flex-shrink-0 ml-2', activeSection === section.id && 'rotate-180')}>
                ▾
              </span>
            </button>

            {activeSection === section.id && (
              <div className="mt-2 px-4 py-4 rounded-[var(--radius-md)] bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border))]">
                {section.id === 'ingest' && (
                  <div className="space-y-3">
                    <p className="text-sm text-[rgb(var(--text-secondary))]">
                      현재 KB에 있는 문서를 분석해 Wiki 페이지를 자동으로 생성합니다.
                    </p>
                    <button
                      type="button"
                      onClick={handleIngest}
                      disabled={ingesting}
                      className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold',
                        'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]',
                        'hover:bg-[rgb(var(--color-primary-hover))] transition-colors disabled:opacity-50',
                      )}
                    >
                      {ingesting ? '생성 중...' : '▶ Wiki 자동 생성 실행'}
                    </button>
                    {ingestResult && (
                      <p className={clsx(
                        'text-sm',
                        ingestResult.includes('오류') ? 'text-[rgb(var(--color-error))]' : 'text-[rgb(var(--color-success))]',
                      )}>
                        {ingestResult}
                      </p>
                    )}
                  </div>
                )}
                {section.id === 'pages' && <WikiPagesSection />}
                {section.id === 'graph' && <WikiGraphSection />}
                {section.id === 'lint' && <WikiLintSection />}
                {section.id === 'growth' && <WikiGrowthSection />}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FAQ 패널 ─────────────────────────────────────────────────────────────

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

function FaqPanel() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/faq', { headers: authHeaders() });
        if (res.ok) {
          const d = await res.json();
          const items: any[] = d?.faqs ?? d?.items ?? d ?? [];
          setFaqs(items.map((f: any) => ({ id: f.id, question: f.question, answer: f.answer })));
        }
      } catch { /* silent */ } finally { setLoading(false); }
    }
    load();
  }, []);

  const handleAdd = async () => {
    if (!q.trim() || !a.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/faq', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ question: q.trim(), answer: a.trim() }),
      });
      const d = await res.json();
      const newFaq: FaqItem = res.ok && d.data
        ? { id: d.data.id, question: d.data.question, answer: d.data.answer }
        : { id: `faq-${Date.now()}`, question: q.trim(), answer: a.trim() };
      setFaqs(prev => [...prev, newFaq]);
      setQ(''); setA(''); setAdding(false);
    } catch {
      setFaqs(prev => [...prev, { id: `faq-${Date.now()}`, question: q.trim(), answer: a.trim() }]);
      setQ(''); setA(''); setAdding(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setFaqs(prev => prev.filter(f => f.id !== id));
    if (id.startsWith('faq-')) return;
    try {
      await fetch(`/api/faq/${id}`, { method: 'DELETE', headers: authHeaders() });
    } catch { /* silent */ }
  };

  return (
    <div
      className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-5"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">FAQ 추가/편집</h3>
        <button
          type="button"
          onClick={() => setAdding(v => !v)}
          className="text-sm text-[rgb(var(--color-primary))] hover:underline"
        >
          + FAQ 추가
        </button>
      </div>

      {adding && (
        <div className="mb-4 p-4 rounded-[var(--radius-md)] bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--border))] space-y-3">
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="질문을 입력하세요"
            className={clsx(
              'w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[rgb(var(--border))]',
              'bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))]',
              'focus:outline-none focus:border-[rgb(var(--color-primary))]',
            )}
          />
          <textarea
            value={a}
            onChange={e => setA(e.target.value)}
            placeholder="답변을 입력하세요"
            rows={3}
            className={clsx(
              'w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[rgb(var(--border))]',
              'bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))]',
              'focus:outline-none focus:border-[rgb(var(--color-primary))] resize-none',
            )}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className={clsx(
                'px-4 py-1.5 text-sm font-semibold rounded-[var(--radius-md)]',
                'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]',
                'hover:bg-[rgb(var(--color-primary-hover))] transition-colors',
              )}
            >
              추가
            </button>
            <button type="button" onClick={() => setAdding(false)} className="text-sm text-[rgb(var(--text-muted))]">취소</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[rgb(var(--text-muted))] text-center py-6">로딩 중...</p>
      ) : faqs.length === 0 ? (
        <p className="text-sm text-[rgb(var(--text-muted))] text-center py-6">아직 FAQ가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {faqs.map(faq => (
            <div key={faq.id} className="p-3 rounded-[var(--radius-md)] bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--border))]">
              <div className="flex justify-between gap-2">
                <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Q. {faq.question}</p>
                <button type="button" onClick={() => handleDelete(faq.id)} className="text-xs text-[rgb(var(--color-error))] flex-shrink-0 hover:underline">
                  삭제
                </button>
              </div>
              <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">A. {faq.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 전체 학습 현황 ───────────────────────────────────────────────────────

function LearningOverview() {
  // 실제 API에서 데이터를 받아와야 하나, 현재는 UI 뼈대만 표시
  return (
    <div
      className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-5"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <h3 className="text-base font-semibold text-[rgb(var(--text-primary))] mb-4">전체 챗봇 학습 현황</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '총 KB 문서', value: '—', icon: '📚' },
          { label: '총 Wiki 페이지', value: '—', icon: '📄' },
          { label: '총 FAQ', value: '—', icon: '❓' },
          { label: '학습 품질', value: '—', icon: '✅' },
        ].map(item => (
          <div
            key={item.label}
            className="p-3 rounded-[var(--radius-lg)] bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--border))] text-center"
          >
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-xl font-bold text-[rgb(var(--color-primary))]">{item.value}</div>
            <div className="text-xs text-[rgb(var(--text-muted))] mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────

export default function Tab3Learning() {
  return (
    <div className="space-y-6">
      <KbInjectPanel />
      <WikiRAGPanel />
      <FaqPanel />
      <LearningOverview />
    </div>
  );
}
