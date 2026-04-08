/**
 * Step 8: 배포
 * - 배포 채널 선택 (웹, 카카오톡, 텔레그램)
 * - 챗봇 URL 복사
 * - QR 코드 표시 + 다운로드
 * - 온보딩 카드 3종 (대화하기, FAQ 추가, 스킬 장착)
 */
'use client';

import { useState, useEffect } from 'react';
import type { WizardData } from '../CreateWizard';
import { stepTitle } from '../ui';

interface Props {
  data: WizardData;
  onFinish: (finalData: Partial<WizardData>) => void;
}

const CHANNELS = [
  { value: 'web', icon: '🌐', label: '웹', desc: 'mychatbot.world' },
  { value: 'kakao', icon: '💬', label: '카카오톡', desc: '카카오 채널 연동' },
  { value: 'telegram', icon: '✈️', label: '텔레그램', desc: '텔레그램 봇 연동' },
];

export default function Step8Deploy({ data, onFinish }: Props) {
  const [channels, setChannels] = useState<string[]>(data.deployChannels?.length ? data.deployChannels : ['web']);
  const [copied, setCopied] = useState(false);

  const deployUrl = data.deployUrl
    || `${typeof window !== 'undefined' ? window.location.origin : 'https://mychatbot.world'}/bot/${data.botUsername || data.botId || 'my-bot'}`;

  const toggleChannel = (ch: string) => {
    setChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(deployUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('input');
      el.value = deployUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = async () => {
    if (!data.qrSvg) return;
    // qrSvg가 있으면 SVG 다운로드
    const blob = new Blob([data.qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chatbot-qr.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // QR 이미지 URL (구글 차트 API 또는 qrserver.com 사용)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(deployUrl)}`;

  const botId = data.botId || 'new';
  const botUsername = data.botUsername || botId;

  return (
    <div>
      {/* 완료 축하 */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem', animation: 'bounce 1s ease infinite' }}>🎉</div>
        <h2 style={stepTitle}>축하합니다! 챗봇이 완성되었습니다!</h2>
      </div>

      {/* 배포 채널 선택 */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        textAlign: 'left',
      }}>
        <label style={{ display: 'block', color: 'white', fontWeight: 600, marginBottom: '0.75rem' }}>
          배포 채널 선택
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '0.75rem' }}>
          {CHANNELS.map(ch => (
            <label
              key={ch.value}
              onClick={() => toggleChannel(ch.value)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                padding: '16px 8px',
                background: channels.includes(ch.value) ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                border: `2px solid ${channels.includes(ch.value) ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <input type="checkbox" name="deployChannel" value={ch.value} checked={channels.includes(ch.value)} onChange={() => {}} style={{ display: 'none' }} />
              <span style={{ fontSize: '1.5rem' }}>{ch.icon}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{ch.label}</span>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{ch.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* URL + QR */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
      }}>
        {/* URL 복사 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
            챗봇 URL:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              readOnly
              value={deployUrl}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                padding: '12px',
                color: 'white',
                fontSize: '0.875rem',
              }}
            />
            <button
              onClick={handleCopyUrl}
              style={{
                padding: '12px 16px',
                background: copied ? '#22c55e' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {copied ? '✓ 복사됨' : '복사'}
            </button>
          </div>
        </div>

        {/* QR 코드 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '200px',
            height: '200px',
            background: 'white',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            margin: '0 auto',
          }}>
            {data.qrSvg ? (
              <div dangerouslySetInnerHTML={{ __html: data.qrSvg }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <img
                src={qrImageUrl}
                alt="QR Code"
                style={{ width: '200px', height: '200px', borderRadius: '12px' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
          <p style={{ marginTop: '8px' }}>
            <button
              onClick={handleDownloadQR}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              QR 코드 다운로드
            </button>
          </p>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <a
          href={`/bot/${botUsername}`}
          style={{
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontSize: '0.95rem',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          챗봇과 대화하기
        </a>
        <a
          href="/home"
          style={{
            padding: '12px 28px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '0.95rem',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          마이 페이지로 가기
        </a>
      </div>

      {/* 온보딩 카드 */}
      <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '1rem', textAlign: 'center' }}>
          다음 단계로 이동하세요
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {[
            { icon: '💬', title: '지금 대화해보기', desc: '챗봇과 첫 대화', href: `/bot/${botUsername}`, color: '#7c3aed' },
            { icon: '❓', title: 'FAQ 추가하기', desc: '자주 묻는 질문 관리', href: '/home', color: '#2563eb' },
            { icon: '⚡', title: '스킬 장착하기', desc: '챗봇 능력 강화', href: '/home', color: '#16a34a' },
          ].map((card) => (
            <a
              key={card.title}
              href={card.href}
              style={{
                display: 'block',
                padding: '1.25rem 1rem',
                background: `rgba(${hexToRgb(card.color)}, 0.15)`,
                border: `1px solid rgba(${hexToRgb(card.color)}, 0.4)`,
                borderRadius: '12px',
                textAlign: 'center',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{card.icon}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '0.25rem' }}>{card.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{card.desc}</div>
            </a>
          ))}
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
        마이페이지에서 지식베이스, 스킬, 챗봇 스쿨을 관리할 수 있습니다.
      </p>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

// hex → "r,g,b" 변환 (CSS rgba에서 사용)
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '99,102,241';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}
