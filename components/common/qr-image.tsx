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
    QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: 'M' })
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
  return <img src={dataUrl} alt={alt} className={className} width={size} height={size} />;
}
