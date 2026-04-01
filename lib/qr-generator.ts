/**
 * @task S2BA1
 * @description QR코드 생성 유틸리티
 * qrcode 라이브러리를 사용하여 URL → SVG 또는 Data URL 형식의 QR코드를 생성한다.
 */

import QRCode from 'qrcode';

/** QR코드 생성 옵션 */
export interface QRGeneratorOptions {
  /** QR 모듈 색상 (기본: #000000) */
  darkColor?: string;
  /** QR 배경 색상 (기본: #ffffff) */
  lightColor?: string;
  /** 오류 정정 레벨: L(7%), M(15%), Q(25%), H(30%) (기본: M) */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  /** QR 이미지 크기 픽셀 (기본: 256) */
  size?: number;
  /** 테두리 여백 (기본: 4 모듈) */
  margin?: number;
}

/** QR코드 생성 결과 */
export interface QRResult {
  /** SVG 문자열 */
  svg: string;
  /** Data URL (PNG base64) */
  dataUrl: string;
}

/**
 * URL → QR코드 생성 (SVG + Data URL)
 * @param url - QR코드로 인코딩할 URL
 * @param options - 선택적 스타일 옵션
 * @returns svg (string), dataUrl (base64 PNG) 포함 객체
 * @throws QR 생성 실패 시 Error
 *
 * @example
 * const { svg, dataUrl } = await generateQR('https://mcw.app/bot/abc123');
 */
export async function generateQR(
  url: string,
  options: QRGeneratorOptions = {}
): Promise<QRResult> {
  const {
    darkColor = '#000000',
    lightColor = '#ffffff',
    errorCorrectionLevel = 'M',
    size = 256,
    margin = 4,
  } = options;

  const qrOptions: QRCode.QRCodeToStringOptions = {
    type: 'svg',
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel,
    width: size,
    margin,
  };

  // SVG 생성
  const svg = await QRCode.toString(url, { ...qrOptions, type: 'svg' });

  // Data URL (PNG) 생성
  const dataUrl = await QRCode.toDataURL(url, {
    type: 'image/png',
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel,
    width: size,
    margin,
  });

  return { svg, dataUrl };
}

/**
 * URL → SVG 문자열만 반환 (경량 버전)
 * @param url - QR코드로 인코딩할 URL
 * @param options - 선택적 스타일 옵션
 * @returns SVG 문자열
 */
export async function generateQRSvg(
  url: string,
  options: QRGeneratorOptions = {}
): Promise<string> {
  const {
    darkColor = '#000000',
    lightColor = '#ffffff',
    errorCorrectionLevel = 'M',
    size = 256,
    margin = 4,
  } = options;

  return QRCode.toString(url, {
    type: 'svg',
    color: { dark: darkColor, light: lightColor },
    errorCorrectionLevel,
    width: size,
    margin,
  });
}
