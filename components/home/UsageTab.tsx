'use client';

import { useState, useEffect } from 'react';
import { S } from './ProfileTab';
import supabase from '@/lib/supabase';

interface ModelStat {
  model: string;
  credits: number;
  tokens: number;
  requests: number;
}

interface UsageData {
  period: { from: string; to: string };
  total_credits: number;
  total_tokens: number;
  total_requests: number;
  by_model: ModelStat[];
}

function fmt(n: number) { return n.toLocaleString(); }

export function UsageTab() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? '';
      if (!token) { setLoading(false); setError('로그인 정보가 없습니다.'); return; }

      fetch('/api/usage', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          if (d.error) throw new Error(d.error);
          setData(d);
        })
        .catch(e => setError(e.message || '사용량 조회에 실패했습니다.'))
        .finally(() => setLoading(false));
    })();
  }, []);

  const periodLabel = data
    ? `${new Date(data.period.from).toLocaleDateString('ko-KR', { month: 'long' })} 사용량`
    : '이번 달 사용량';

  return (
    <div>
      <h1 style={S.h1}>📊 AI 사용량</h1>

      {loading && (
        <p style={{ color: 'rgba(255,255,255,0.4)', padding: '2rem 0' }}>불러오는 중...</p>
      )}

      {!loading && error && (
        <div style={{
          padding: '1.5rem', background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12,
          color: 'rgba(255,100,100,0.9)',
        }}>
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* 요약 카드 */}
          <div style={{ ...S.card, marginBottom: '1.5rem' }}>
            <div style={S.sectionHeader}>
              <h2 style={S.h2}>{periodLabel}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {[
                { label: '총 요청 수',    value: `${fmt(data.total_requests)}건` },
                { label: '소모 크레딧',   value: `${fmt(data.total_credits)}C` },
                { label: '처리 토큰',     value: `${fmt(data.total_tokens)}T` },
              ].map((item) => (
                <div key={item.label} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '1.25rem', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 모델별 사용량 */}
          <div style={S.card}>
            <div style={S.sectionHeader}>
              <h2 style={S.h2}>모델별 사용 내역</h2>
            </div>

            {data.by_model.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                이번 달 사용 내역이 없습니다.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['모델', '요청 수', '크레딧', '토큰'].map(h => (
                        <th key={h} style={{
                          padding: '10px 12px', textAlign: h === '모델' ? 'left' : 'right',
                          color: 'rgba(255,255,255,0.4)', fontWeight: 500,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_model.map((m) => {
                      const pct = data.total_credits > 0
                        ? Math.round((m.credits / data.total_credits) * 100)
                        : 0;
                      return (
                        <tr key={m.model} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px 12px', color: 'white' }}>
                            <div>{m.model}</div>
                            <div style={{ marginTop: 4, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, width: 140 }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: '#6366f1', borderRadius: 2 }} />
                            </div>
                          </td>
                          <td style={{ padding: '12px 12px', textAlign: 'right', color: 'rgba(255,255,255,0.6)' }}>
                            {fmt(m.requests)}
                          </td>
                          <td style={{ padding: '12px 12px', textAlign: 'right', color: 'rgba(255,255,255,0.6)' }}>
                            {fmt(m.credits)} C
                          </td>
                          <td style={{ padding: '12px 12px', textAlign: 'right', color: 'rgba(255,255,255,0.6)' }}>
                            {fmt(m.tokens)} T
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', marginTop: '1rem' }}>
              * 집계 기준: 매월 1일 00:00 ~ 말일 23:59 (KST 기준 UTC)
            </p>
          </div>
        </>
      )}
    </div>
  );
}
