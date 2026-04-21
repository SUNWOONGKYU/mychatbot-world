'use client';

/**
 * QRImage — 클라이언트 사이드 QR 코드 렌더링
 * qrcode 패키지를 사용하여 data URL (PNG) 생성 후 <img>로 표시
 * 외부 API 의존 없음
 */

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
  /** PNG data URL이 필요한 부모에게 전달 (다운로드 등) */
  onReady?: (dataUrl: string) => void;
}

export default function QRImage({ value, size = 200, className, alt = 'QR 코드', onReady }: Props) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    if (!value) { setDataUrl(''); return; }
    // margin: 4 = ISO/IEC 18004 quiet zone 필수 최소값 (기존 1은 스캔 실패 원인)
    // errorCorrectionLevel: 'H' = 30% 복원력 — 소형 출력 + 브라우저 리샘플링 대비
    QRCode.toDataURL(value, { width: size, margin: 4, errorCorrectionLevel: 'H' })
      .then((url) => {
        if (cancelled) return;
        setDataUrl(url);
        onReady?.(url);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'QR 생성 실패');
      });
    return () => { cancelled = true; };
  }, [value, size, onReady]);

  if (error) {
    return (
      <div className={className} role="img" aria-label={`${alt} 생성 실패`}>
        <span style={{ fontSize: 10, color: '#c00' }}>QR 실패</span>
      </div>
    );
  }
  if (!dataUrl) {
    return (
      <div className={className} role="img" aria-label={`${alt} 로딩 중`} />
    );
  }
  // imageRendering: pixelated — 브라우저 bilinear 보간 억제, QR 모듈 경계 샤프하게 유지
  return (
    <img
      src={dataUrl}
      alt={alt}
      className={className}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
