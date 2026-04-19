// @task S5FE7 - 섹션1: 관리자 대시보드 개요
// KPI 카드 5개 + 매출추이 차트 + 회원가입 추이 + 활동 타임라인 + 긴급 알림
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAdminToast } from '../components/AdminToast';

interface StatsData {
  totalUsers: number;
  totalBots: number;
  totalRevenue: number;
  activeUsersToday: number;
  pendingPayments: number;
  generatedAt?: string;
}

interface RecentPayment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  metadata?: { depositor_name?: string };
}

interface SectionDashboardProps {
  adminKey: string;
  onBadgeChange: (key: string) => void;
}

// ── 간단한 바 차트 (Canvas) ──────────────────────────────────────────────
function BarChart({
  data,
  labels,
  color,
  height = 120,
}: {
  data: number[];
  labels: string[];
  color: string;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const W = canvas.offsetWidth;
    const H = height;
    const maxVal = Math.max(...data, 1);
    const barW = (W / data.length) * 0.55;
    const gap = (W / data.length) * 0.45 / 2;
    const padTop = 12;
    const padBot = 24;
    const chartH = H - padTop - padBot;

    ctx.clearRect(0, 0, W, H);

    data.forEach((val, i) => {
      const x = (W / data.length) * i + gap;
      const barH = (val / maxVal) * chartH;
      const y = padTop + chartH - barH;

      ctx.fillStyle = color + '33';
      ctx.beginPath();
      ctx.roundRect(x, padTop, barW, chartH, 3);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 3);
      ctx.fill();

      // 라벨
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '10px PretendardVariable, Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i] || '', x + barW / 2, H - 6);
    });
  }, [data, labels, color, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: `${height}px`, display: 'block' }}
    />
  );
}

// ── 꺾은선 차트 (Canvas) ──────────────────────────────────────────────────
function LineChart({
  data,
  labels,
  color,
  height = 120,
}: {
  data: number[];
  labels: string[];
  color: string;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const W = canvas.offsetWidth;
    const H = height;
    const maxVal = Math.max(...data, 1);
    const padTop = 12;
    const padBot = 24;
    const padLR = 12;
    const chartH = H - padTop - padBot;
    const stepX = (W - padLR * 2) / (data.length - 1);

    ctx.clearRect(0, 0, W, H);

    const points = data.map((val, i) => ({
      x: padLR + i * stepX,
      y: padTop + chartH - (val / maxVal) * chartH,
    }));

    // 그라디언트 채우기
    const grad = ctx.createLinearGradient(0, padTop, 0, H - padBot);
    grad.addColorStop(0, color + '33');
    grad.addColorStop(1, color + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(points[0].x, H - padBot);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, H - padBot);
    ctx.closePath();
    ctx.fill();

    // 선
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();

    // 점
    points.forEach((p) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 라벨
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px PretendardVariable, Pretendard, sans-serif';
    ctx.textAlign = 'center';
    points.forEach((p, i) => {
      ctx.fillText(labels[i] || '', p.x, H - 6);
    });
  }, [data, labels, color, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: `${height}px`, display: 'block' }}
    />
  );
}

// ── 날짜 유틸 ────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
}
function fmtMoney(n: number) {
  return (n || 0).toLocaleString('ko-KR');
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────
export default function SectionDashboard({ adminKey, onBadgeChange }: SectionDashboardProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const { showToast, ToastEl } = useAdminToast();

  // 가상 차트 데이터 (실제 데이터 없을 때 placeholder)
  const revenueLabels = ['3주전', '2주전', '지난주', '이번주'];
  const revenueData = [820000, 1240000, 980000, 1560000];
  const signupLabels = ['월', '화', '수', '목', '금', '토', '일'];
  const signupData = [12, 8, 15, 22, 18, 31, 27];

  const apiHeaders = useCallback(
    () => ({ 'X-Admin-Key': adminKey, 'Content-Type': 'application/json' }),
    [adminKey],
  );

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats', { headers: apiHeaders() });
      if (res.ok) {
        const d = await res.json();
        setStats(d);
      }
    } finally {
      setStatsLoading(false);
    }
  }, [apiHeaders]);

  const loadRecentPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const res = await fetch('/api/admin/payments?status=pending&limit=5', {
        headers: apiHeaders(),
      });
      if (res.ok) {
        const d = await res.json();
        setRecentPayments(d.payments || []);
      }
    } finally {
      setPaymentsLoading(false);
    }
  }, [apiHeaders]);

  useEffect(() => {
    loadStats();
    loadRecentPayments();
  }, [loadStats, loadRecentPayments]);

  const approvePayment = async (id: string) => {
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: apiHeaders(),
        body: JSON.stringify({ paymentId: id, action: 'approve' }),
      });
      if (res.ok) {
        showToast('입금 승인 완료');
        loadStats();
        loadRecentPayments();
        onBadgeChange(adminKey);
      } else {
        showToast('승인 실패');
      }
    } catch {
      showToast('네트워크 오류');
    }
  };

  const rejectPayment = async (id: string) => {
    const reason = window.prompt('거부 사유를 입력하세요 (필수):');
    if (!reason?.trim()) return;
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: apiHeaders(),
        body: JSON.stringify({ paymentId: id, action: 'reject' }),
      });
      if (res.ok) {
        showToast('입금 거부 처리됨');
        loadRecentPayments();
        onBadgeChange(adminKey);
      }
    } catch {
      showToast('네트워크 오류');
    }
  };

  const kpiCards = stats
    ? [
        { label: '총 회원', value: fmtMoney(stats.totalUsers), sub: '명', color: '#818cf8' },
        { label: '총 코코봇', value: fmtMoney(stats.totalBots), sub: '개', color: '#34d399' },
        {
          label: '총 매출',
          value: `₩${stats.totalRevenue >= 1000000 ? (stats.totalRevenue / 1000000).toFixed(1) + 'M' : fmtMoney(stats.totalRevenue)}`,
          sub: '누적',
          color: '#fbbf24',
        },
        { label: '오늘 활성', value: fmtMoney(stats.activeUsersToday), sub: '명', color: '#60a5fa' },
        { label: '미처리', value: fmtMoney(stats.pendingPayments), sub: '건', color: '#f87171' },
      ]
    : [];

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h1 className="admin-section-title">대시보드</h1>
        <button
          className="admin-btn admin-btn-outline"
          style={{ fontSize: '0.8rem' }}
          onClick={() => { loadStats(); loadRecentPayments(); }}
        >
          새로고침
        </button>
      </div>

      {/* KPI 카드 */}
      <div className="admin-kpi-grid">
        {statsLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="admin-kpi-card">
                <div className="admin-kpi-label">로딩 중...</div>
                <div className="admin-kpi-value" style={{ color: 'var(--admin-border)' }}>—</div>
              </div>
            ))
          : kpiCards.map((card) => (
              <div key={card.label} className="admin-kpi-card">
                <div className="admin-kpi-label">{card.label}</div>
                <div className="admin-kpi-value" style={{ color: card.color }}>
                  {card.value}
                </div>
                <div className="admin-kpi-sub">{card.sub}</div>
              </div>
            ))}
      </div>

      {/* 긴급 처리 알림 */}
      {stats && stats.pendingPayments > 0 && (
        <div className="admin-urgent-bar">
          <span className="admin-urgent-label">긴급 처리 필요</span>
          <span className="admin-badge admin-badge-danger">
            입금 대기 {stats.pendingPayments}건
          </span>
        </div>
      )}

      {/* 차트 */}
      <div className="admin-charts-grid">
        <div className="admin-chart-card">
          <div className="admin-chart-title">매출 추이 (최근 4주)</div>
          <BarChart data={revenueData} labels={revenueLabels} color="#818cf8" height={130} />
        </div>
        <div className="admin-chart-card">
          <div className="admin-chart-title">신규 가입 추이 (최근 7일)</div>
          <LineChart data={signupData} labels={signupLabels} color="#34d399" height={130} />
        </div>
      </div>

      {/* 두 컬럼: 최근 입금 + 활동 타임라인 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
        {/* 최근 입금 신청 */}
        <div>
          <h2
            style={{
              fontSize: '0.88rem',
              fontWeight: 600,
              color: 'var(--admin-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              marginBottom: '0.75rem',
            }}
          >
            최근 입금 신청
          </h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>입금자</th>
                  <th>금액</th>
                  <th>신청일</th>
                  <th>상태</th>
                  <th>처리</th>
                </tr>
              </thead>
              <tbody>
                {paymentsLoading ? (
                  <tr>
                    <td colSpan={5} className="admin-table-empty">로딩 중...</td>
                  </tr>
                ) : recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-table-empty">
                      대기 중인 입금이 없습니다
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.metadata?.depositor_name || '-'}</td>
                      <td>{fmtMoney(p.amount)}원</td>
                      <td>{fmtDate(p.created_at)}</td>
                      <td>
                        <span className="admin-badge admin-badge-pending">대기</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button
                            className="admin-btn admin-btn-success admin-btn-sm"
                            onClick={() => approvePayment(p.id)}
                          >
                            승인
                          </button>
                          <button
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => rejectPayment(p.id)}
                          >
                            거부
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 최근 활동 타임라인 */}
        <div>
          <h2
            style={{
              fontSize: '0.88rem',
              fontWeight: 600,
              color: 'var(--admin-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              marginBottom: '0.75rem',
            }}
          >
            최근 활동
          </h2>
          <div className="admin-card">
            <div className="admin-timeline">
              {[
                { color: 'success', text: '입금 승인 처리 완료 — 홍길동 ₩50,000', time: '방금 전' },
                { color: 'primary', text: '신규 회원 가입 — user@example.com', time: '3분 전' },
                { color: 'warning', text: '코코봇 생성 — "AI 영어 튜터"', time: '12분 전' },
                { color: 'success', text: '무통장 입금 신청 — 이철수 ₩100,000', time: '28분 전' },
                { color: 'danger', text: '신고 접수 — 게시글 #1245', time: '1시간 전' },
              ].map((item, i) => (
                <div key={i} className="admin-timeline-item">
                  <div className={`admin-timeline-dot ${item.color}`} />
                  <div className="admin-timeline-content">
                    <div className="admin-timeline-text">{item.text}</div>
                    <div className="admin-timeline-time">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {ToastEl}
    </div>
  );
}
