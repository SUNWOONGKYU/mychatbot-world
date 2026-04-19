'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { S } from './ProfileTab';

// ── 타입 ─────────────────────────────────────────────────────
interface Persona {
  id: string;
  name: string;
  category: 'avatar' | 'helper';
  role?: string;
  userTitle?: string;
  iqEq?: number;
  greeting?: string;
  isPublic?: boolean;
}

interface Bot {
  id: string;
  botName: string;
  botDesc?: string;
  created_at?: string;
  ownerId?: string;
  personas?: Persona[];
  dmPolicy?: 'public' | 'allowlist' | 'pairing';
  allowedUsers?: string[];
  pairingCode?: string;
}

type ToolId = 'logs' | 'data' | 'skills' | 'school' | 'community' | 'psettings';

// ── 공통 인라인 스타일 ──────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: '#1c1c24', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16, overflow: 'hidden', marginBottom: 0,
};

const darkInput: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: 'white', fontSize: '1rem', outline: 'none',
  boxSizing: 'border-box',
};

const btnSmDark: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
  cursor: 'pointer', background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)',
};

const btnSmPrimary: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
  cursor: 'pointer', background: '#6366f1', color: 'white', border: 'none',
};

// ── LocalStorage 헬퍼 ────────────────────────────────────────
function getBots(): Bot[] {
  try { return JSON.parse(localStorage.getItem('mcw_bots') || '[]'); } catch { return []; }
}
function saveBot(bot: Bot) {
  const bots = getBots();
  const idx = bots.findIndex(b => b.id === bot.id);
  if (idx >= 0) bots[idx] = bot; else bots.push(bot);
  localStorage.setItem('mcw_bots', JSON.stringify(bots));
}
function deleteBot(botId: string) {
  const bots = getBots().filter(b => b.id !== botId);
  localStorage.setItem('mcw_bots', JSON.stringify(bots));
}
function getKB(personaId: string) {
  try { return JSON.parse(localStorage.getItem(`mcw_kb_${personaId}`) || '{"qaPairs":[],"freeText":"","files":[]}'); } catch { return { qaPairs: [], freeText: '', files: [] }; }
}
function saveKBStorage(personaId: string, kb: any) {
  localStorage.setItem(`mcw_kb_${personaId}`, JSON.stringify(kb));
}
function getConversations(botId: string, personaId: string) {
  try { return JSON.parse(localStorage.getItem(`mcw_conv_${botId}_${personaId}`) || '[]'); } catch { return []; }
}
function getStats(botId: string, personaId: string) {
  try { return JSON.parse(localStorage.getItem(`mcw_stats_${botId}_${personaId}`) || '{"totalConversations":0,"totalMessages":0}'); } catch { return { totalConversations: 0, totalMessages: 0 }; }
}
function getSkills(botId: string, personaId: string) {
  try { return JSON.parse(localStorage.getItem(`mcw_skills_${botId}_${personaId}`) || '[]'); } catch { return []; }
}
function getCommunity(botId: string, personaId: string) {
  try { return JSON.parse(localStorage.getItem(`mcw_community_${botId}_${personaId}`) || '[]'); } catch { return []; }
}
function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

// ── BotsTab 메인 ─────────────────────────────────────────────
export function BotsTab({ user }: { user: any }) {
  const router = useRouter();
  const [bots, setBots] = useState<Bot[]>([]);
  const [draft, setDraft] = useState<any>(null);

  const loadBots = useCallback(() => {
    const all = getBots();
    const mine = user ? all.filter(b => !b.ownerId || b.ownerId === user.id) : all;
    setBots(mine);
    try {
      const raw = sessionStorage.getItem('mcw_create_draft');
      if (raw) {
        const d = JSON.parse(raw);
        if (Date.now() - d.savedAt < 24 * 60 * 60 * 1000) setDraft(d);
        else setDraft(null);
      } else { setDraft(null); }
    } catch { setDraft(null); }
  }, [user]);

  useEffect(() => { loadBots(); }, [loadBots]);

  const clearDraft = () => {
    if (!confirm('작성 중인 초안을 삭제하시겠습니까?')) return;
    sessionStorage.removeItem('mcw_create_draft');
    setDraft(null);
  };

  const hasBots = bots.length > 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ ...S.h1, marginBottom: 0 }}>코코봇 및 운영 관리</h1>
        {!hasBots && !draft && (
          <button style={S.btnPrimary} onClick={() => router.push('/create')}>+ 새 코코봇 생성</button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* 초안 카드 */}
        {draft && (
          <DraftCard draft={draft} onClear={clearDraft} onResume={() => router.push('/create')} />
        )}

        {/* 봇이 없을 때 */}
        {!hasBots && !draft && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', opacity: 0.5 }}>🤖</div>
            <h3 style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.75rem' }}>
              아직 생성된 코코봇이 없습니다
            </h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>나만의 코코봇을 생성하고 관리해 보세요.</p>
            <button style={S.btnPrimary} onClick={() => router.push('/create')}>+ 새 코코봇 생성</button>
          </div>
        )}

        {/* 봇 카드 목록 */}
        {bots.map(bot => (
          <BotCard key={bot.id} bot={bot} onRefresh={loadBots} />
        ))}
      </div>
    </div>
  );
}

// ── 초안 카드 ────────────────────────────────────────────────
function DraftCard({ draft, onClear, onResume }: { draft: any; onClear: () => void; onResume: () => void }) {
  const stepLabels = ['', '기본정보', '페르소나', '인터뷰', '분석', '완성'];
  const stepLabel = stepLabels[draft.step] || `Step ${draft.step}`;
  const savedTime = new Date(draft.savedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ ...cardStyle, border: '1px dashed rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.5rem 2rem' }}>
        <div>
          <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 4 }}>
            {draft.botName || '이름 미정'}
            <span style={{
              fontSize: '0.7rem', fontWeight: 600, color: '#fbbf24',
              background: 'rgba(251,191,36,0.15)', padding: '2px 8px',
              borderRadius: 20, marginLeft: 8,
            }}>작성 중</span>
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            Step {draft.step}: {stepLabel} 단계에서 중단됨
          </p>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{savedTime} 저장</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={btnSmPrimary} onClick={onResume}>이어서 작성</button>
          <button style={btnSmDark} onClick={onClear}>삭제</button>
        </div>
      </div>
    </div>
  );
}

// ── 봇 카드 ──────────────────────────────────────────────────
function BotCard({ bot, onRefresh }: { bot: Bot; onRefresh: () => void }) {
  const [urlOpen, setUrlOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const botUrl = `/bot?id=${bot.id}`;
  const personas = bot.personas || [];

  return (
    <div style={cardStyle}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: 50, height: 50, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
          }}>🤖</div>
          <div>
            <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.15rem', marginBottom: 4 }}>{bot.botName}</h3>
            {bot.botDesc && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{bot.botDesc}</p>}
            {bot.created_at && (
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                {new Date(bot.created_at).toLocaleDateString('ko-KR')} 생성
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={btnSmDark} onClick={() => setUrlOpen(v => !v)}>🔗 URL</button>
          <button style={btnSmDark} onClick={() => setSettingsOpen(v => !v)}>⚙️ 봇 수정</button>
        </div>
      </div>

      {/* URL 패널 */}
      {urlOpen && (
        <UrlPanel bot={bot} botUrl={botUrl} personas={personas} />
      )}

      {/* 봇 설정 패널 */}
      {settingsOpen && (
        <BotSettingsPanel bot={bot} onSaved={onRefresh} onClose={() => setSettingsOpen(false)} />
      )}

      {/* 페르소나 목록 */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {personas.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', padding: '1rem 2rem' }}>
            등록된 페르소나가 없습니다.
          </div>
        ) : (
          personas.map((p, i) => (
            <PersonaCard key={p.id} bot={bot} persona={p} idx={i} onRefresh={onRefresh} />
          ))
        )}
        <div style={{ padding: '1rem 2rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          <AddPersonaButton bot={bot} onAdded={onRefresh} />
        </div>
      </div>
    </div>
  );
}

// ── URL 패널 ─────────────────────────────────────────────────
function UrlPanel({ bot, botUrl, personas }: { bot: Bot; botUrl: string; personas: Persona[] }) {
  const [qrVisible, setQrVisible] = useState(false);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url).catch(() => {});
  };

  return (
    <div style={{
      padding: '12px 2rem', background: 'rgba(0,0,0,0.15)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <UrlRow label="전체 (봇)" url={botUrl} onCopy={() => copyUrl(botUrl)} />
      {personas.map(p => (
        <UrlRow key={p.id} label={p.name} url={`/bot?id=${bot.id}&persona=${p.id}`}
          onCopy={() => copyUrl(`/bot?id=${bot.id}&persona=${p.id}`)} />
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 8 }}>
        <button style={btnSmDark} onClick={() => setQrVisible(v => !v)}>📱 QR 코드 보기</button>
        {qrVisible && (
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(window.location.origin + botUrl)}&size=200x200`}
            alt="QR" style={{ width: 80, height: 80, background: 'white', padding: 4, borderRadius: 8 }}
          />
        )}
      </div>
    </div>
  );
}

function UrlRow({ label, url, onCopy }: { label: string; url: string; onCopy: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', minWidth: 100, flexShrink: 0 }}>{label}</span>
      <input readOnly value={url} onClick={(e) => (e.target as HTMLInputElement).select()} style={{
        flex: 1, padding: '6px 10px', background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
        color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontFamily: 'monospace', outline: 'none',
      }} />
      <button style={btnSmPrimary} onClick={onCopy}>복사</button>
    </div>
  );
}

// ── 봇 설정 패널 ─────────────────────────────────────────────
function BotSettingsPanel({ bot, onSaved, onClose }: { bot: Bot; onSaved: () => void; onClose: () => void }) {
  const [botName, setBotName] = useState(bot.botName || '');
  const [botDesc, setBotDesc] = useState(bot.botDesc || '');
  const [dmPolicy, setDmPolicy] = useState<string>(bot.dmPolicy || 'public');
  const [allowedUsers, setAllowedUsers] = useState((bot.allowedUsers || []).join('\n'));
  const [pairingCode, setPairingCode] = useState(bot.pairingCode || '');

  const saveBotInfo = () => {
    const updated = { ...bot, botName: botName.trim(), botDesc: botDesc.trim() };
    saveBot(updated);
    onSaved();
  };

  const saveDmPolicy = () => {
    const updated = {
      ...bot,
      dmPolicy: dmPolicy as Bot['dmPolicy'],
      allowedUsers: allowedUsers.split('\n').map(s => s.trim()).filter(Boolean),
      pairingCode,
    };
    saveBot(updated);
    onSaved();
  };

  const genPairingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setPairingCode(code);
  };

  const handleDelete = () => {
    if (!confirm(`정말 "${bot.botName}" 코코봇을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    deleteBot(bot.id);
    onSaved();
    onClose();
  };

  return (
    <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      {/* 기본 정보 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem' }}>봇 기본 정보 수정</h4>
        <div style={{ marginBottom: '1rem' }}>
          <label style={S.label}>봇 이름</label>
          <input style={darkInput} value={botName} onChange={e => setBotName(e.target.value)} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={S.label}>봇 설명</label>
          <textarea style={{ ...darkInput, resize: 'vertical', minHeight: 64 }} value={botDesc} onChange={e => setBotDesc(e.target.value)} />
        </div>
        <button style={btnSmPrimary} onClick={saveBotInfo}>정보 저장</button>
      </div>

      {/* DM 보안 정책 */}
      <div style={{ marginBottom: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem' }}>DM 보안 정책</h4>
        <div style={{ marginBottom: '1rem' }}>
          <label style={S.label}>접근 정책</label>
          <select style={darkInput} value={dmPolicy} onChange={e => setDmPolicy(e.target.value)}>
            <option value="public">공개 (누구나 대화 가능)</option>
            <option value="allowlist">허용 목록 (지정된 사용자만)</option>
            <option value="pairing">페어링 코드 (코드 입력 필요)</option>
          </select>
        </div>
        {dmPolicy === 'allowlist' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>허용된 이메일 (줄바꿈 구분)</label>
            <textarea style={{ ...darkInput, resize: 'vertical', minHeight: 64 }} value={allowedUsers}
              onChange={e => setAllowedUsers(e.target.value)} placeholder="user@example.com" />
          </div>
        )}
        {dmPolicy === 'pairing' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>페어링 코드</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input style={{ ...darkInput, flex: 1 }} value={pairingCode} readOnly />
              <button style={btnSmDark} onClick={genPairingCode}>생성</button>
              <button style={btnSmDark} onClick={() => navigator.clipboard.writeText(pairingCode)}>복사</button>
            </div>
          </div>
        )}
        <button style={{ ...btnSmPrimary, marginTop: '0.75rem' }} onClick={saveDmPolicy}>보안 정책 저장</button>
      </div>

      {/* 봇 삭제 */}
      <div style={{
        padding: '1.5rem', border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 10, background: 'rgba(239,68,68,0.05)',
      }}>
        <h4 style={{ color: '#ef4444', marginBottom: '0.5rem', fontWeight: 700 }}>봇 삭제</h4>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
          이 작업은 되돌릴 수 없습니다. 봇과 관련된 모든 데이터가 삭제됩니다.
        </p>
        <button style={{ padding: '8px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}
          onClick={handleDelete}>이 코코봇 삭제하기</button>
      </div>
    </div>
  );
}

// ── 페르소나 카드 ─────────────────────────────────────────────
function PersonaCard({ bot, persona, idx, onRefresh }: { bot: Bot; persona: Persona; idx: number; onRefresh: () => void }) {
  const [openTool, setOpenTool] = useState<ToolId | null>(null);

  const categoryLabel = persona.category === 'helper' ? 'AI 도우미' : '분신 아바타';

  const toggleTool = (tool: ToolId) => {
    setOpenTool(prev => prev === tool ? null : tool);
  };

  const tools: { id: ToolId; icon: string; label: string }[] = [
    { id: 'logs',      icon: '📑', label: '대화 로그' },
    { id: 'data',      icon: '💾', label: '지식베이스' },
    { id: 'skills',    icon: '🧩', label: '스킬 관리' },
    { id: 'school',    icon: '🎓', label: '코코봇 스쿨' },
    { id: 'community', icon: '💬', label: '커뮤니티' },
    { id: 'psettings', icon: '🔧', label: '설정' },
  ];

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 2rem', background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>
            {persona.name || `페르소나 ${idx + 1}`}
          </span>
          <span style={{
            fontSize: '0.7rem', fontWeight: 600, color: '#818cf8',
            background: 'rgba(99,102,241,0.12)', padding: '3px 10px', borderRadius: 20,
          }}>{categoryLabel}</span>
          {persona.role && (
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{persona.role}</span>
          )}
        </div>
        <a href={`/bot?id=${bot.id}&persona=${persona.id}`}
          style={{ ...btnSmDark, textDecoration: 'none', display: 'inline-block' }}>
          대화하기
        </a>
      </div>

      {/* 툴바 */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {tools.map((t, i) => (
          <button
            key={t.id}
            onClick={() => toggleTool(t.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, padding: '10px 6px', fontSize: '0.75rem', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.2s',
              background: openTool === t.id ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: openTool === t.id ? '#818cf8' : 'rgba(255,255,255,0.5)',
              border: 'none',
              borderRight: i < tools.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* 툴 패널 */}
      {openTool && (
        <ToolPanel tool={openTool} bot={bot} persona={persona} onRefresh={onRefresh} />
      )}
    </div>
  );
}

// ── 툴 패널 ──────────────────────────────────────────────────
function ToolPanel({ tool, bot, persona, onRefresh }: { tool: ToolId; bot: Bot; persona: Persona; onRefresh: () => void }) {
  const panelStyle: React.CSSProperties = {
    padding: '2rem', background: 'rgba(0,0,0,0.15)',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    animation: 'slideDown 0.25s ease-out',
  };

  if (tool === 'logs')      return <div style={panelStyle}><LogPanel bot={bot} persona={persona} /></div>;
  if (tool === 'data')      return <div style={panelStyle}><KBPanel bot={bot} persona={persona} /></div>;
  if (tool === 'skills')    return <div style={panelStyle}><SkillPanel bot={bot} persona={persona} /></div>;
  if (tool === 'school')    return <div style={panelStyle}><SchoolPanel bot={bot} persona={persona} /></div>;
  if (tool === 'community') return <div style={panelStyle}><CommunityPanel bot={bot} persona={persona} /></div>;
  if (tool === 'psettings') return <div style={panelStyle}><PersonaSettingsPanel bot={bot} persona={persona} onSaved={onRefresh} /></div>;
  return null;
}

// ── 1. 대화 로그 패널 ────────────────────────────────────────
function LogPanel({ bot, persona }: { bot: Bot; persona: Persona }) {
  const conversations = getConversations(bot.id, persona.id);
  const stats = getStats(bot.id, persona.id);

  return (
    <div>
      <div style={{ fontWeight: 700, color: 'white', fontSize: '1.05rem', marginBottom: '1.25rem' }}>
        📑 {persona.name}의 대화 로그
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <StatCard value={stats.totalConversations} label="총 대화 수" />
        <StatCard value={stats.totalMessages} label="총 메시지 수" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 400, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '2rem' }}>아직 대화 기록이 없습니다.</div>
        ) : (
          conversations.slice(-50).map((msg: any, i: number) => (
            <div key={i} style={{
              padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem', lineHeight: 1.5,
              maxWidth: '85%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
              color: msg.role === 'user' ? '#a5b4fc' : 'rgba(255,255,255,0.8)',
            }}>
              <div>{msg.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div style={{
      flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#818cf8' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── 2. 지식베이스 패널 ───────────────────────────────────────
function KBPanel({ bot, persona }: { bot: Bot; persona: Persona }) {
  const [kb, setKb] = useState(() => getKB(persona.id));
  const [saved, setSaved] = useState(false);

  const addQA = () => setKb((prev: any) => ({ ...prev, qaPairs: [...(prev.qaPairs || []), { q: '', a: '' }] }));
  const removeQA = (i: number) => setKb((prev: any) => ({ ...prev, qaPairs: prev.qaPairs.filter((_: any, idx: number) => idx !== i) }));
  const updateQA = (i: number, field: 'q' | 'a', val: string) => {
    setKb((prev: any) => {
      const pairs = [...(prev.qaPairs || [])];
      pairs[i] = { ...pairs[i], [field]: val };
      return { ...prev, qaPairs: pairs };
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    const newFiles = [...(kb.files || [])];
    for (const file of Array.from(files)) {
      const text = await new Promise<string>(resolve => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => resolve('');
        r.readAsText(file);
      });
      newFiles.push({ name: file.name, content: text });
    }
    setKb((prev: any) => ({ ...prev, files: newFiles }));
  };

  const handleObsidianUpload = async (files: FileList | null) => {
    if (!files) return;
    const key = `${bot.id}_${persona.id}`;
    const stored = JSON.parse(localStorage.getItem(`mcw_obsidian_${key}`) || '[]');
    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) continue;
      const content = await new Promise<string>(resolve => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => resolve('');
        r.readAsText(file);
      });
      const plain = content.replace(/^---[\s\S]*?---\n/m, '').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, l, a) => a || l).replace(/^#{1,6}\s+/gm, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/`{3}[\s\S]*?`{3}/g, '').trim();
      const wordCount = plain.split(/\s+/).filter((w: string) => w.length > 0).length;
      stored.push({ fileName: file.name, content: plain, wordCount, addedAt: new Date().toISOString() });
    }
    localStorage.setItem(`mcw_obsidian_${key}`, JSON.stringify(stored));
  };

  const saveKB = async () => {
    try {
      saveKBStorage(persona.id, kb);
      await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId: persona.id, botId: bot.id, kb }),
      }).catch(() => {});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ }
  };

  const obsidianKey = `${bot.id}_${persona.id}`;
  const obsidianDocs: any[] = (() => { try { return JSON.parse(localStorage.getItem(`mcw_obsidian_${obsidianKey}`) || '[]'); } catch { return []; } })();

  return (
    <div>
      <div style={{ fontWeight: 700, color: 'white', fontSize: '1.05rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        💾 {persona.name}의 지식베이스
        {saved && <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>✓ 저장됨</span>}
      </div>

      {/* Q&A */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Q&A 관리</span>
          <button style={btnSmDark} onClick={addQA}>+ 추가</button>
        </div>
        {(kb.qaPairs || []).length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', padding: '8px 0' }}>등록된 Q&A가 없습니다.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(kb.qaPairs || []).map((qa: any, i: number) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'start' }}>
                <input style={darkInput} placeholder="질문" value={qa.q || ''} onChange={e => updateQA(i, 'q', e.target.value)} />
                <input style={darkInput} placeholder="답변" value={qa.a || ''} onChange={e => updateQA(i, 'a', e.target.value)} />
                <button onClick={() => removeQA(i)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', borderRadius: 8, background: 'transparent', border: 'none', fontSize: '1rem' }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 텍스트 지식 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.75rem' }}>텍스트 지식</div>
        <textarea style={{ ...darkInput, resize: 'vertical', minHeight: 80 }}
          placeholder="코코봇이 알아야 할 정보를 자유롭게 입력하세요..."
          value={kb.freeText || ''}
          onChange={e => setKb((prev: any) => ({ ...prev, freeText: e.target.value }))}
        />
      </div>

      {/* 파일 업로드 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.75rem' }}>파일 업로드</div>
        <label style={{
          border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 10, padding: '2rem',
          textAlign: 'center', cursor: 'pointer', display: 'block',
          color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem',
        }}>
          📂 PDF, TXT, CSV 파일을 클릭하여 업로드
          <input type="file" accept=".pdf,.txt,.csv" multiple style={{ display: 'none' }}
            onChange={e => handleFileUpload(e.target.files)} />
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
          {(kb.files || []).map((f: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
              <span>📄 {f.name}</span>
              <button onClick={() => setKb((prev: any) => ({ ...prev, files: prev.files.filter((_: any, idx: number) => idx !== i) }))}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Obsidian */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>🗂️ Obsidian 지식베이스</span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>마크다운 파일 → RAG 검색</span>
        </div>
        <label style={{
          border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 10, padding: '1.5rem',
          textAlign: 'center', cursor: 'pointer', display: 'block',
          color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '0.75rem',
        }}>
          📁 Obsidian .md 파일을 클릭하여 업로드
          <input type="file" accept=".md,.txt" multiple style={{ display: 'none' }}
            onChange={e => handleObsidianUpload(e.target.files)} />
        </label>
        {obsidianDocs.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>업로드된 Obsidian 파일이 없습니다.</div>
        ) : (
          obsidianDocs.map((doc: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
              <span>📝 {doc.fileName} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>({doc.wordCount || 0}단어)</span></span>
            </div>
          ))
        )}
      </div>

      <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
        <button style={btnSmPrimary} onClick={saveKB}>지식베이스 저장</button>
      </div>
    </div>
  );
}

// ── 3. 스킬 패널 ─────────────────────────────────────────────
function SkillPanel({ bot, persona }: { bot: Bot; persona: Persona }) {
  const [filter, setFilter] = useState('all');
  const installed = getSkills(bot.id, persona.id);
  const marketSkills: any[] = []; // CoCoBot.skills — 서버에서 로드 필요

  const uninstall = (skillId: string) => {
    const updated = installed.filter((s: any) => s.id !== skillId);
    localStorage.setItem(`mcw_skills_${bot.id}_${persona.id}`, JSON.stringify(updated));
  };

  return (
    <div>
      <div style={{ fontWeight: 700, color: 'white', fontSize: '1.05rem', marginBottom: '1.25rem' }}>
        🧩 {persona.name}의 스킬 관리
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            ✅ 설치된 스킬 ({installed.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 400, overflowY: 'auto' }}>
            {installed.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', padding: '1rem 0' }}>설치된 스킬이 없습니다.</div>
            ) : (
              installed.map((s: any) => (
                <SkillCard key={s.id} skill={s} action="remove" onAction={() => uninstall(s.id)} />
              ))
            )}
          </div>
        </div>
        <div>
          <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem' }}>🛒 스킬 마켓</h4>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', padding: '1rem 0' }}>스킬 목록을 불러오는 중입니다.</div>
        </div>
      </div>
    </div>
  );
}

function SkillCard({ skill, action, onAction }: { skill: any; action: 'install' | 'remove'; onAction: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 12,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 10,
    }}>
      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{skill.icon || '🧩'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', marginBottom: 2 }}>{skill.name}</div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{skill.description || ''}</div>
      </div>
      <button onClick={onAction} style={action === 'remove' ? {
        padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
        background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)',
      } : btnSmPrimary}>
        {action === 'remove' ? '제거' : '설치'}
      </button>
    </div>
  );
}

// ── 4. 코코봇 스쿨 패널 ───────────────────────────────────────
function SchoolPanel({ bot, persona }: { bot: Bot; persona: Persona }) {
  const stats = getStats(bot.id, persona.id);
  const installed = getSkills(bot.id, persona.id);
  const conversations = getConversations(bot.id, persona.id);
  const kb = getKB(persona.id);

  const hasRole = !!persona.role;
  const hasKB = kb.qaPairs?.length > 0 || kb.freeText || kb.files?.length > 0;
  const hasSkills = installed.length > 0;
  const hasConversations = conversations.length > 0;

  const completedSteps = [hasRole, hasKB, hasSkills, hasConversations].filter(Boolean).length;
  const progressPercent = Math.round((completedSteps / 4) * 100);

  return (
    <div>
      <div style={{ fontWeight: 700, color: 'white', fontSize: '1.05rem', marginBottom: '1.25rem' }}>
        🎓 {persona.name}의 학습 현황
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <StatCard value={progressPercent} label="학습 진도 %" />
        <StatCard value={installed.length} label="습득한 스킬" />
        <StatCard value={stats.totalMessages || 0} label="대화 경험" />
      </div>
      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.75rem' }}>학습 단계별 현황</h4>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: 0 }}>
        {[
          { done: hasRole, text: `역할 설정 — ${hasRole ? persona.role : '아직 역할이 지정되지 않았습니다'}` },
          { done: hasKB, text: `지식베이스 학습 — ${hasKB ? '지식 데이터 입력 완료' : '아직 지식이 입력되지 않았습니다'}` },
          { done: hasSkills, text: `스킬 습득 — ${hasSkills ? `${installed.length}개 스킬 장착 완료` : '아직 스킬이 설치되지 않았습니다'}` },
          { done: hasConversations, text: `실전 대화 — ${hasConversations ? `${conversations.length}개 메시지 경험` : '아직 대화 경험이 없습니다'}` },
        ].map((item, i) => (
          <li key={i} style={{
            fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)',
            padding: '8px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8,
          }}>
            {item.done ? '✅' : '⬜'} {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── 5. 커뮤니티 패널 ─────────────────────────────────────────
function CommunityPanel({ bot, persona }: { bot: Bot; persona: Persona }) {
  const activities = getCommunity(bot.id, persona.id);

  const posts = activities.filter((a: any) => a.type === 'post').length;
  const replies = activities.filter((a: any) => a.type === 'reply').length;
  const likes = activities.filter((a: any) => a.type === 'like').length;

  return (
    <div>
      <div style={{ fontWeight: 700, color: 'white', fontSize: '1.05rem', marginBottom: '1.25rem' }}>
        💬 {persona.name}의 커뮤니티 활동
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <StatCard value={posts} label="작성한 글" />
        <StatCard value={replies} label="답변 수" />
        <StatCard value={likes} label="받은 좋아요" />
      </div>
      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.75rem' }}>최근 활동 내역</h4>
      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '2rem' }}>아직 커뮤니티 활동 내역이 없습니다.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 350, overflowY: 'auto' }}>
          {[...activities].reverse().slice(0, 30).map((a: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 2 }}>{a.icon || '💬'}</span>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{a.text || ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <a href="/community" style={btnSmDark}>커뮤니티 바로가기</a>
      </div>
    </div>
  );
}

// ── 6. 페르소나 설정 패널 ────────────────────────────────────
function PersonaSettingsPanel({ bot, persona, onSaved }: { bot: Bot; persona: Persona; onSaved: () => void }) {
  const [name, setName] = useState(persona.name || '');
  const [role, setRole] = useState(persona.role || '');
  const [userTitle, setUserTitle] = useState(persona.userTitle || (persona.category === 'avatar' ? '고객님' : '님'));
  const [category, setCategory] = useState<string>(persona.category || 'avatar');
  const [iqEq, setIqEq] = useState(persona.iqEq ?? 50);
  const [greeting, setGreeting] = useState(persona.greeting || '');

  const save = () => {
    const updatedBot = { ...bot };
    const personas = [...(updatedBot.personas || [])];
    const idx = personas.findIndex(p => p.id === persona.id);
    if (idx < 0) return;
    personas[idx] = { ...personas[idx], name: name.trim(), role: role.trim(), userTitle: userTitle.trim(), category: category as Persona['category'], iqEq, greeting: greeting.trim() };
    updatedBot.personas = personas;
    saveBot(updatedBot);
    onSaved();
  };

  const removePersona = () => {
    if (!confirm(`"${persona.name}" 페르소나를 삭제하시겠습니까?`)) return;
    const updatedBot = { ...bot, personas: (bot.personas || []).filter(p => p.id !== persona.id) };
    saveBot(updatedBot);
    onSaved();
  };

  return (
    <div>
      <div style={{ fontWeight: 700, color: 'white', fontSize: '1.05rem', marginBottom: '1.25rem' }}>
        🔧 {persona.name} 설정
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={S.label}>이름</label>
        <input style={darkInput} value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={S.label}>역할</label>
        <input style={darkInput} value={role} onChange={e => setRole(e.target.value)} placeholder="예: 친근한 상담사, 전문 코딩 도우미" />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={S.label}>사용자 호칭</label>
        <input style={darkInput} value={userTitle} onChange={e => setUserTitle(e.target.value)} placeholder="예: 고객님, 대표님, 선생님" />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={S.label}>카테고리</label>
        <select style={darkInput} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="avatar">분신 아바타</option>
          <option value="helper">AI 도우미</option>
        </select>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={S.label}>IQ ↔ EQ 밸런스: {iqEq}</label>
        <input type="range" min={0} max={100} value={iqEq}
          onChange={e => setIqEq(parseInt(e.target.value))}
          style={{ width: '100%', margin: '0.5rem 0', accentColor: '#6366f1' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
          <span>IQ (논리적)</span><span>EQ (감성적)</span>
        </div>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={S.label}>인사말</label>
        <input style={darkInput} value={greeting} onChange={e => setGreeting(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
        <button style={btnSmPrimary} onClick={save}>설정 저장</button>
        <button onClick={removePersona} style={{ padding: '6px 14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>이 페르소나 삭제</button>
      </div>
    </div>
  );
}

// ── 페르소나 추가 버튼 ───────────────────────────────────────
function AddPersonaButton({ bot, onAdded }: { bot: Bot; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('avatar');
  const [role, setRole] = useState('');
  const [userTitle, setUserTitle] = useState('고객님');
  const [iqEq, setIqEq] = useState(50);
  const [model, setModel] = useState('logic');

  const submit = () => {
    if (!name.trim()) { alert('이름을 입력해주세요.'); return; }
    const personas = [...(bot.personas || [])];
    if (personas.length >= 10) { alert('페르소나는 최대 10개까지 설정 가능합니다.'); return; }

    const id = category + '_' + name.replace(/\s/g, '_').toLowerCase() + '_' + generateId();
    const iqVal = parseInt(String(iqEq));
    let grt = '';
    if (iqVal >= 75) grt = `안녕하세요. ${bot.botName}의 ${name}입니다. 정확하고 전문적인 답변으로 도와드리겠습니다.`;
    else if (iqVal >= 50) grt = `안녕하세요! ${bot.botName}의 ${name}입니다. 무엇이든 편하게 물어보세요.`;
    else if (iqVal >= 25) grt = `안녕하세요! ${bot.botName}의 ${name}이에요. 함께 이야기해볼까요?`;
    else grt = `반가워요! ${bot.botName}의 ${name}이에요. 편하게 말씀해 주세요.`;

    const newPersona: Persona = {
      id, name: name.trim(), category: category as Persona['category'],
      role: role.trim(), userTitle: userTitle.trim() || (category === 'avatar' ? '고객님' : '님'),
      iqEq, greeting: grt, isPublic: category === 'avatar',
    };

    const updatedBot = { ...bot, personas: [...personas, newPersona] };
    saveBot(updatedBot);
    setOpen(false);
    setName(''); setRole(''); setUserTitle('고객님'); setIqEq(50); setModel('logic');
    onAdded();
  };

  return (
    <>
      <button style={{
        padding: '10px 20px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600,
        cursor: 'pointer', background: 'rgba(99,102,241,0.08)', color: '#818cf8',
        border: '1px dashed rgba(99,102,241,0.3)', width: '100%', textAlign: 'center',
      }} onClick={() => setOpen(true)}>+ 페르소나 추가</button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div style={{
            background: '#1c1c24', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '2rem', width: '90%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.15rem', marginBottom: '1.5rem' }}>페르소나 추가</h3>
            <div style={{ marginBottom: '1rem' }}><label style={S.label}>이름 *</label><input style={darkInput} value={name} onChange={e => setName(e.target.value)} placeholder="예: 고객 상담, 업무 비서" /></div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>카테고리</label>
              <select style={darkInput} value={category} onChange={e => { setCategory(e.target.value); setUserTitle(e.target.value === 'avatar' ? '고객님' : '님'); }}>
                <option value="avatar">분신 아바타 (공개)</option>
                <option value="helper">AI 도우미 (비공개)</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}><label style={S.label}>역할</label><input style={darkInput} value={role} onChange={e => setRole(e.target.value)} placeholder="이 페르소나의 역할을 설명해주세요" /></div>
            <div style={{ marginBottom: '1rem' }}><label style={S.label}>사용자 호칭</label><input style={darkInput} value={userTitle} onChange={e => setUserTitle(e.target.value)} placeholder="예: 고객님, 대표님, 선생님" /></div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>IQ ↔ EQ 밸런스: {iqEq}</label>
              <input type="range" min={0} max={100} value={iqEq} onChange={e => setIqEq(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#6366f1' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}><span>IQ (논리적)</span><span>EQ (감성적)</span></div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>AI 모델</label>
              <select style={darkInput} value={model} onChange={e => setModel(e.target.value)}>
                <option value="logic">논리파</option><option value="emotion">감성파</option>
                <option value="fast">속도파</option><option value="creative">창작파</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
              <button style={btnSmPrimary} onClick={submit}>추가</button>
              <button style={btnSmDark} onClick={() => setOpen(false)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
