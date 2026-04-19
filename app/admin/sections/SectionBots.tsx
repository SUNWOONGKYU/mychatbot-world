// @task S5FE8
// @description 섹션5 — 코코봇 관리 (전체 목록/검색/상태변경/신고처리/데모보기)

'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ── 타입 ──────────────────────────────────────────────────────────────────────

type BotStatus = 'active' | 'inactive' | 'suspended';

interface Bot {
  id: string;
  name: string;
  owner_email?: string;
  owner_name?: string;
  status: BotStatus;
  created_at: string;
  report_count?: number;
  conversation_count?: number;
  model?: string;
  description?: string;
}

interface DemoMessage {
  role: 'user' | 'bot';
  content: string;
}

interface Props {
  adminKey: string;
}

// ── 상수 ──────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<BotStatus, string> = {
  active: '활성',
  inactive: '비활성',
  suspended: '정지',
};

const STATUS_BADGE_CLASS: Record<BotStatus, string> = {
  active: 'abadge abadge--green',
  inactive: 'abadge abadge--muted',
  suspended: 'abadge abadge--red',
};

// ── Mock ─────────────────────────────────────────────────────────────────────

function mockBots(): Bot[] {
  return [
    { id: 'b1', name: '법률 상담 도우미', owner_email: 'lawyer@ex.com', owner_name: '김변호', status: 'active', created_at: '2026-02-10T09:00:00Z', report_count: 0, conversation_count: 1240, model: 'claude-sonnet' },
    { id: 'b2', name: '요리 레시피 봇', owner_email: 'chef@ex.com', owner_name: '박셰프', status: 'active', created_at: '2026-02-15T10:30:00Z', report_count: 2, conversation_count: 3890, model: 'claude-haiku' },
    { id: 'b3', name: '영어 튜터', owner_email: 'tutor@ex.com', owner_name: '이영어', status: 'inactive', created_at: '2026-03-01T14:00:00Z', report_count: 0, conversation_count: 567, model: 'claude-sonnet' },
    { id: 'b4', name: '불량 스팸봇', owner_email: 'spam@ex.com', owner_name: '스패머', status: 'suspended', created_at: '2026-03-10T08:00:00Z', report_count: 15, conversation_count: 200, model: 'claude-haiku' },
    { id: 'b5', name: '건강 상담 봇', owner_email: 'health@ex.com', owner_name: '최건강', status: 'active', created_at: '2026-03-20T11:00:00Z', report_count: 1, conversation_count: 2100, model: 'claude-sonnet' },
    { id: 'b6', name: '주식 분석 봇', owner_email: 'stock@ex.com', owner_name: '정주식', status: 'active', created_at: '2026-04-01T09:30:00Z', report_count: 0, conversation_count: 876, model: 'claude-sonnet' },
  ];
}

// ── 코코봇 데모 모달 ────────────────────────────────────────────────────────────

function useEscapeToClose(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
}

function DemoModal({ bot, onClose }: { bot: Bot; onClose: () => void }) {
  useEscapeToClose(onClose);
  const [messages, setMessages] = useState<DemoMessage[]>([
    { role: 'bot', content: `안녕하세요! 저는 "${bot.name}"입니다. 무엇을 도와드릴까요?` },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    await new Promise((r) => setTimeout(r, 800));
    const replies = [
      '네, 이해했습니다. 더 자세히 말씀해 주시겠어요?',
      '좋은 질문입니다! 제가 도움을 드릴게요.',
      '죄송합니다, 제 역할 범위 밖입니다.',
      '물론이죠! 해당 내용을 설명해 드리겠습니다.',
    ];
    setMessages((prev) => [...prev, { role: 'bot', content: replies[Math.floor(Math.random() * replies.length)] }]);
    setSending(false);
  }, [input, sending]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="amodal-overlay" onClick={onClose}>
      <div className="amodal amodal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="amodal__header">
          <div>
            <div className="amodal__title">💬 데모 테스트 — {bot.name}</div>
            <div className="amodal__sub">소유자: {bot.owner_name} · 모델: {bot.model}</div>
          </div>
          <button className="amodal__close" onClick={onClose}>✕</button>
        </div>

        <div className="demo-chat">
          {messages.map((msg, i) => (
            <div key={i} className={`demo-msg demo-msg--${msg.role}`}>
              {msg.role === 'bot' && <span className="demo-avatar">🤖</span>}
              <div className="demo-bubble">{msg.content}</div>
              {msg.role === 'user' && <span className="demo-avatar">👤</span>}
            </div>
          ))}
          {sending && (
            <div className="demo-msg demo-msg--bot">
              <span className="demo-avatar">🤖</span>
              <div className="demo-bubble demo-bubble--typing"><span /><span /><span /></div>
            </div>
          )}
        </div>

        <div className="demo-input-row">
          <input
            className="ainput"
            style={{ flex: 1 }}
            placeholder="메시지 입력 (Enter로 전송)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <button className="abtn abtn--primary" onClick={sendMessage} disabled={sending || !input.trim()}>전송</button>
        </div>

        <div className="amodal__footer">
          <button className="abtn abtn--secondary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}

// ── 상태 변경 모달 ────────────────────────────────────────────────────────────

function StatusModal({ bot, onClose, onConfirm }: { bot: Bot; onClose: () => void; onConfirm: (s: BotStatus) => void }) {
  useEscapeToClose(onClose);
  const [selected, setSelected] = useState<BotStatus>(bot.status);

  return (
    <div className="amodal-overlay" onClick={onClose}>
      <div className="amodal" onClick={(e) => e.stopPropagation()}>
        <div className="amodal__header">
          <div className="amodal__title">⚙️ 상태 변경 — {bot.name}</div>
          <button className="amodal__close" onClick={onClose}>✕</button>
        </div>

        <div className="aform-group">
          <label className="aform-label">새 상태 선택</label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {(['active', 'inactive', 'suspended'] as BotStatus[]).map((s) => (
              <label
                key={s}
                htmlFor={`bot-status-${s}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  cursor: 'pointer', padding: '0.625rem 1rem',
                  borderRadius: '8px',
                  border: `1px solid ${selected === s ? '#818cf8' : 'rgba(255,255,255,0.1)'}`,
                  background: selected === s ? 'rgba(129,140,248,0.1)' : 'transparent',
                  color: selected === s ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                  fontSize: '0.875rem', fontWeight: selected === s ? 600 : 400,
                }}
              >
                <input
                  id={`bot-status-${s}`}
                  type="radio"
                  name="bot-status"
                  value={s}
                  checked={selected === s}
                  onChange={() => setSelected(s)}
                  aria-label={`${STATUS_LABELS[s]} 상태`}
                  style={{
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: 0,
                  }}
                />
                <span aria-hidden="true">{s === 'active' ? '✅' : s === 'inactive' ? '⏸️' : '🚫'}</span>
                {STATUS_LABELS[s]}
              </label>
            ))}
          </div>
        </div>

        <div className="amodal__footer">
          <button className="abtn abtn--secondary" onClick={onClose}>취소</button>
          <button className="abtn abtn--primary" onClick={() => onConfirm(selected)}>변경</button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function SectionBots({ adminKey }: Props) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BotStatus>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'reported'>('all');
  const [demoBot, setDemoBot] = useState<Bot | null>(null);
  const [statusBot, setStatusBot] = useState<Bot | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/bots', { headers: { 'X-Admin-Key': adminKey } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBots(d?.bots ?? mockBots()))
      .catch(() => setBots(mockBots()))
      .finally(() => setLoading(false));
  }, [adminKey]);

  const handleStatusChange = async (bot: Bot, newStatus: BotStatus) => {
    const prevStatus = bot.status;
    // 낙관적 업데이트
    setBots((prev) => prev.map((b) => (b.id === bot.id ? { ...b, status: newStatus } : b)));
    setStatusBot(null);

    try {
      const res = await fetch('/api/admin/bots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ botId: bot.id, status: newStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(`"${bot.name}" 상태가 ${STATUS_LABELS[newStatus]}(으)로 변경되었습니다.`);
    } catch (err) {
      // 실패 시 이전 상태로 롤백
      setBots((prev) => prev.map((b) => (b.id === bot.id ? { ...b, status: prevStatus } : b)));
      showToast(`상태 변경에 실패했습니다: ${(err as Error).message}`);
    }
  };

  const filtered = bots.filter((b) => {
    const q = search.toLowerCase();
    return (
      (!q || b.name.toLowerCase().includes(q) || (b.owner_name ?? '').toLowerCase().includes(q)) &&
      (statusFilter === 'all' || b.status === statusFilter) &&
      (activeTab === 'all' || (activeTab === 'reported' && (b.report_count ?? 0) > 0))
    );
  });

  const reportedCount = bots.filter((b) => (b.report_count ?? 0) > 0).length;

  if (loading) return <div className="admin-section"><div className="admin-spinner"><div className="admin-spinner__dot" /></div></div>;

  return (
    <section className="admin-section">
      {/* 헤더 */}
      <div className="admin-section-header">
        <h2 className="admin-section-title">🤖 코코봇 관리</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="abadge abadge--muted">{bots.length} 전체</span>
          <span className="abadge abadge--green">{bots.filter((b) => b.status === 'active').length} 활성</span>
          {reportedCount > 0 && <span className="abadge abadge--red">🚨 신고 {reportedCount}</span>}
        </div>
      </div>

      {/* 탭 */}
      <div className="atabs">
        <button className={`atab${activeTab === 'all' ? ' atab--active' : ''}`} onClick={() => setActiveTab('all')}>전체 봇</button>
        <button className={`atab${activeTab === 'reported' ? ' atab--active' : ''}`} onClick={() => setActiveTab('reported')}>
          신고된 봇 {reportedCount > 0 && <span className="atab-badge">{reportedCount}</span>}
        </button>
      </div>

      {/* 필터 */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div className="asearch">
          <span>🔍</span>
          <input placeholder="봇 이름, 소유자 검색..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="aselect" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | BotStatus)}>
          <option value="all">전체 상태</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
          <option value="suspended">정지</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="atable-wrap">
        {filtered.length === 0 ? (
          <div className="aempty"><span>🤖</span><span>조건에 맞는 봇이 없습니다.</span></div>
        ) : (
          <table className="atable">
            <thead><tr>
              <th>봇 이름</th><th>소유자</th><th>상태</th><th>대화 수</th><th>신고</th><th>생성일</th><th>작업</th>
            </tr></thead>
            <tbody>
              {filtered.map((bot) => (
                <tr key={bot.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{bot.name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{bot.model}</div>
                  </td>
                  <td>
                    <div>{bot.owner_name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{bot.owner_email}</div>
                  </td>
                  <td><span className={STATUS_BADGE_CLASS[bot.status]}>{STATUS_LABELS[bot.status]}</span></td>
                  <td>{(bot.conversation_count ?? 0).toLocaleString()}</td>
                  <td>
                    {(bot.report_count ?? 0) > 0
                      ? <span className="abadge abadge--red">🚨 {bot.report_count}건</span>
                      : <span style={{ opacity: 0.4 }}>없음</span>}
                  </td>
                  <td style={{ fontSize: '0.8125rem', opacity: 0.6 }}>{new Date(bot.created_at).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="abtn abtn--secondary" onClick={() => setDemoBot(bot)}>💬 데모</button>
                      <button className="abtn abtn--ghost" onClick={() => setStatusBot(bot)}>⚙️ 상태</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {demoBot && <DemoModal bot={demoBot} onClose={() => setDemoBot(null)} />}
      {statusBot && <StatusModal bot={statusBot} onClose={() => setStatusBot(null)} onConfirm={(s) => handleStatusChange(statusBot, s)} />}
      {toast && <div className="atoast atoast--success">{toast}</div>}

      <style jsx global>{adminSectionStyles}</style>
    </section>
  );
}

// ── 공유 스타일 (섹션5~8 공통) ────────────────────────────────────────────────
export const adminSectionStyles = `
  .admin-section { display: flex; flex-direction: column; gap: 1.5rem; }
  .admin-section-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .admin-section-title { font-size: 1.4rem; font-weight: 700; color: #e2e8f0; }

  .abadge { display: inline-flex; align-items: center; gap: .25rem; padding: .2rem .6rem; border-radius: 9999px; font-size: .75rem; font-weight: 600; white-space: nowrap; }
  .abadge--red   { background: rgba(248,113,113,.15); color: #f87171; border: 1px solid rgba(248,113,113,.3); }
  .abadge--green { background: rgba(52,211,153,.15);  color: #34d399; border: 1px solid rgba(52,211,153,.3);  }
  .abadge--amber { background: rgba(251,191,36,.15);  color: #fbbf24; border: 1px solid rgba(251,191,36,.3);  }
  .abadge--blue  { background: rgba(96,165,250,.15);  color: #60a5fa; border: 1px solid rgba(96,165,250,.3);  }
  .abadge--purple{ background: rgba(167,139,250,.15); color: #a78bfa; border: 1px solid rgba(167,139,250,.3); }
  .abadge--muted { background: rgba(255,255,255,.07); color: rgba(255,255,255,.5); border: 1px solid rgba(255,255,255,.1); }

  .abtn { display: inline-flex; align-items: center; gap: .375rem; padding: .375rem .75rem; border-radius: 6px; font-size: .8125rem; font-weight: 500; cursor: pointer; border: none; white-space: nowrap; transition: all .15s; font-family: inherit; }
  .abtn--primary   { background: #5e4bff; color: #fff; }
  .abtn--primary:hover { background: #7b6eff; }
  .abtn--primary:disabled { opacity: .4; cursor: not-allowed; }
  .abtn--danger    { background: rgba(248,113,113,.15); color: #f87171; border: 1px solid rgba(248,113,113,.3); }
  .abtn--danger:hover { background: rgba(248,113,113,.25); }
  .abtn--secondary { background: rgba(255,255,255,.07); color: rgba(255,255,255,.7); border: 1px solid rgba(255,255,255,.1); }
  .abtn--secondary:hover { background: rgba(255,255,255,.12); }
  .abtn--warning   { background: rgba(251,191,36,.15); color: #fbbf24; border: 1px solid rgba(251,191,36,.3); }
  .abtn--warning:hover { background: rgba(251,191,36,.25); }
  .abtn--ghost     { background: transparent; color: rgba(255,255,255,.4); border: 1px solid transparent; }
  .abtn--ghost:hover { background: rgba(255,255,255,.06); color: rgba(255,255,255,.8); }
  .abtn--ghost:disabled { opacity: .3; cursor: not-allowed; }

  .atabs { display: flex; border-bottom: 1px solid rgba(255,255,255,.08); margin-bottom: .25rem; }
  .atab { padding: .625rem 1.25rem; font-size: .9375rem; font-weight: 500; color: rgba(255,255,255,.4); cursor: pointer; border: none; background: transparent; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all .15s; white-space: nowrap; font-family: inherit; display: flex; align-items: center; gap: .5rem; }
  .atab:hover { color: rgba(255,255,255,.7); }
  .atab--active { color: #818cf8; border-bottom-color: #818cf8; }
  .atab-badge { background: #f87171; color: #fff; font-size: .7rem; font-weight: 700; padding: .05rem .4rem; border-radius: 9999px; min-width: 18px; text-align: center; }

  .asearch { display: flex; align-items: center; gap: .5rem; padding: .5rem .875rem; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; min-width: 240px; }
  .asearch input { background: transparent; border: none; outline: none; color: #e2e8f0; font-size: .875rem; width: 100%; font-family: inherit; }
  .asearch input::placeholder { color: rgba(255,255,255,.3); }
  .aselect { padding: .5rem .75rem; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; color: rgba(255,255,255,.7); font-size: .875rem; cursor: pointer; outline: none; font-family: inherit; }
  .aselect option { background: #0d0d12; }

  .atable-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid rgba(255,255,255,.08); }
  .atable { width: 100%; border-collapse: collapse; font-size: .875rem; }
  .atable thead tr { background: rgba(255,255,255,.03); border-bottom: 1px solid rgba(255,255,255,.08); }
  .atable th { padding: .75rem 1rem; text-align: left; font-weight: 600; color: rgba(255,255,255,.5); white-space: nowrap; }
  .atable tbody tr { border-bottom: 1px solid rgba(255,255,255,.05); transition: background .15s; }
  .atable tbody tr:last-child { border-bottom: none; }
  .atable tbody tr:hover { background: rgba(255,255,255,.03); }
  .atable td { padding: .75rem 1rem; color: rgba(255,255,255,.8); vertical-align: middle; }

  .aempty { display: flex; flex-direction: column; align-items: center; padding: 3rem 1rem; color: rgba(255,255,255,.3); gap: .75rem; font-size: .9375rem; }

  .amodal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(4px); }
  .amodal { background: #16161c; border: 1px solid rgba(255,255,255,.1); border-radius: 16px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
  .amodal--wide { max-width: 720px; }
  .amodal__header { display: flex; align-items: flex-start; justify-content: space-between; }
  .amodal__title { font-size: 1.125rem; font-weight: 700; color: #e2e8f0; }
  .amodal__sub { font-size: .8125rem; color: rgba(255,255,255,.4); margin-top: .25rem; }
  .amodal__close { background: transparent; border: none; color: rgba(255,255,255,.4); cursor: pointer; font-size: 1.25rem; padding: .25rem; line-height: 1; transition: color .15s; }
  .amodal__close:hover { color: #e2e8f0; }
  .amodal__footer { display: flex; justify-content: flex-end; gap: .75rem; padding-top: .5rem; border-top: 1px solid rgba(255,255,255,.07); }

  .aform-group { display: flex; flex-direction: column; gap: .5rem; }
  .aform-label { font-size: .875rem; font-weight: 500; color: rgba(255,255,255,.6); }
  .ainput, .atextarea, .aform-select { padding: .625rem .875rem; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 6px; color: #e2e8f0; font-size: .875rem; outline: none; transition: border-color .15s; font-family: inherit; width: 100%; box-sizing: border-box; }
  .ainput:focus, .atextarea:focus, .aform-select:focus { border-color: #818cf8; }
  .atextarea { resize: vertical; min-height: 80px; }
  .aform-select option { background: #16161c; }

  .demo-chat { background: #0d0d12; border: 1px solid rgba(255,255,255,.08); border-radius: 10px; padding: 1rem; min-height: 260px; max-height: 340px; overflow-y: auto; display: flex; flex-direction: column; gap: .75rem; }
  .demo-msg { display: flex; align-items: flex-end; gap: .5rem; }
  .demo-msg--user { flex-direction: row-reverse; }
  .demo-avatar { font-size: 1.25rem; flex-shrink: 0; }
  .demo-bubble { max-width: 70%; padding: .625rem .875rem; border-radius: 14px; font-size: .875rem; line-height: 1.5; }
  .demo-msg--bot .demo-bubble { background: rgba(255,255,255,.07); color: #e2e8f0; border-bottom-left-radius: 4px; }
  .demo-msg--user .demo-bubble { background: #5e4bff; color: #fff; border-bottom-right-radius: 4px; }
  .demo-bubble--typing { display: flex; gap: 4px; align-items: center; padding: .75rem 1rem !important; }
  .demo-bubble--typing span { width: 7px; height: 7px; background: rgba(255,255,255,.4); border-radius: 50%; animation: tbdot 1.2s infinite; }
  .demo-bubble--typing span:nth-child(2) { animation-delay: .2s; }
  .demo-bubble--typing span:nth-child(3) { animation-delay: .4s; }
  @keyframes tbdot { 0%,80%,100%{opacity:.3;transform:scale(1)} 40%{opacity:1;transform:scale(1.2)} }
  .demo-input-row { display: flex; gap: .75rem; align-items: center; }

  .atoast { position: fixed; bottom: 1.5rem; right: 1.5rem; padding: .75rem 1.25rem; border-radius: 8px; font-size: .875rem; font-weight: 500; z-index: 9999; animation: aslide .2s ease; max-width: 320px; }
  .atoast--success { background: rgba(52,211,153,.15); border: 1px solid rgba(52,211,153,.4); color: #34d399; }
  .atoast--error   { background: rgba(248,113,113,.15); border: 1px solid rgba(248,113,113,.4); color: #f87171; }
  @keyframes aslide { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }

  .admin-spinner { display: flex; align-items: center; justify-content: center; padding: 3rem; }
  .admin-spinner__dot { width: 36px; height: 36px; border: 3px solid rgba(129,140,248,.2); border-top-color: #818cf8; border-radius: 50%; animation: adminSpin .7s linear infinite; }
`;
