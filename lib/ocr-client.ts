/**
 * @task S5BA6
 * @description OCR 클라이언트 — 어댑터 패턴 (업스테이지 Document Parse / VARCO Vision)
 *
 * 지원 엔진:
 * - upstage-parse: 업스테이지 Document Parse Standard ($0.01/page, HWP 지원)
 * - upstage-ocr: 업스테이지 Document OCR ($0.0015/page, 대량 저가)
 * - varco-vision: NC VARCO Vision 1.7B-OCR (자체 호스팅, 무료)
 * - auto: 파일 타입에 따라 자동 선택
 */

// ============================
// 타입 정의
// ============================

export type OcrEngine = 'upstage-parse' | 'upstage-ocr' | 'varco-vision' | 'auto';

export interface OcrResult {
  extracted_text: string;
  page_count: number;
  char_count: number;
  confidence_avg?: number;
  layout_preserved: boolean;
  engine_used: OcrEngine;
}

export interface OcrOptions {
  engine?: OcrEngine;
  file_type?: string;
}

// ============================
// 엔진 자동 선택
// ============================

function selectEngine(fileType: string): OcrEngine {
  const varcoEndpoint = process.env.VARCO_VISION_ENDPOINT;

  // HWP/HWPX → 업스테이지 필수
  if (fileType.includes('hwp') || fileType.includes('hwpx')) {
    return 'upstage-parse';
  }

  // VARCO 자체 호스팅 설정 시 우선 적용
  if (varcoEndpoint) {
    return 'varco-vision';
  }

  // 이미지 단일 페이지 → 저가 OCR
  if (['image/jpeg', 'image/png', 'image/tiff', 'image/webp'].includes(fileType)) {
    return 'upstage-ocr';
  }

  // 기본: Document Parse (구조 보존)
  return 'upstage-parse';
}

// ============================
// 업스테이지 Document Parse
// ============================

async function runUpstageDocumentParse(file: Buffer, fileName: string): Promise<OcrResult> {
  const apiKey = process.env.UPSTAGE_API_KEY;
  if (!apiKey) throw new Error('UPSTAGE_API_KEY 환경변수가 설정되지 않았습니다.');

  const formData = new FormData();
  const blob = new Blob([file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer], { type: 'application/octet-stream' });
  formData.append('document', blob, fileName);
  formData.append('output_formats', '["markdown"]');

  const res = await fetch('https://api.upstage.ai/v1/document-digitization', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`업스테이지 Document Parse 실패: ${res.status} — ${errText}`);
  }

  const json = await res.json();

  // 마크다운 텍스트 추출
  const markdown = (json.content?.markdown ?? json.text ?? '') as string;
  const pageCount = (json.usage?.pages ?? 1) as number;

  return {
    extracted_text: markdown,
    page_count: pageCount,
    char_count: markdown.length,
    layout_preserved: true,
    engine_used: 'upstage-parse',
  };
}

// ============================
// 업스테이지 Document OCR
// ============================

async function runUpstageDocumentOcr(file: Buffer, fileName: string): Promise<OcrResult> {
  const apiKey = process.env.UPSTAGE_API_KEY;
  if (!apiKey) throw new Error('UPSTAGE_API_KEY 환경변수가 설정되지 않았습니다.');

  const formData = new FormData();
  const blob = new Blob([file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer], { type: 'application/octet-stream' });
  formData.append('document', blob, fileName);

  const res = await fetch('https://api.upstage.ai/v1/document-ocr', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`업스테이지 OCR 실패: ${res.status} — ${errText}`);
  }

  const json = await res.json();

  // 텍스트 + 신뢰도 추출
  const words = (json.pages ?? []).flatMap((p: { words?: Array<{ text: string; confidence: number }> }) => p.words ?? []);
  const text = words.map((w: { text: string }) => w.text).join(' ');
  const confidences = words.map((w: { confidence: number }) => w.confidence).filter((c: number) => typeof c === 'number');
  const confidenceAvg = confidences.length > 0 ? confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length : undefined;
  const pageCount = (json.pages?.length ?? 1) as number;

  return {
    extracted_text: text,
    page_count: pageCount,
    char_count: text.length,
    confidence_avg: confidenceAvg,
    layout_preserved: false,
    engine_used: 'upstage-ocr',
  };
}

// ============================
// VARCO Vision (자체 호스팅)
// ============================

async function runVarcoVision(file: Buffer, fileName: string): Promise<OcrResult> {
  const endpoint = process.env.VARCO_VISION_ENDPOINT;
  if (!endpoint) throw new Error('VARCO_VISION_ENDPOINT 환경변수가 설정되지 않았습니다.');

  const formData = new FormData();
  const blob = new Blob([file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer], { type: 'application/octet-stream' });
  formData.append('file', blob, fileName);

  const res = await fetch(`${endpoint}/ocr`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`VARCO Vision OCR 실패: ${res.status} — ${errText}`);
  }

  const json = await res.json();
  const text = (json.text ?? json.result ?? '') as string;

  return {
    extracted_text: text,
    page_count: (json.page_count ?? 1) as number,
    char_count: text.length,
    confidence_avg: json.confidence as number | undefined,
    layout_preserved: false,
    engine_used: 'varco-vision',
  };
}

// ============================
// 메인 OCR 실행 (어댑터)
// ============================

export async function runOcr(
  file: Buffer,
  fileName: string,
  options: OcrOptions = {}
): Promise<OcrResult> {
  const fileType = options.file_type ?? '';
  const engine =
    options.engine === 'auto' || !options.engine
      ? selectEngine(fileType)
      : options.engine;

  switch (engine) {
    case 'upstage-parse':
      return runUpstageDocumentParse(file, fileName);
    case 'upstage-ocr':
      return runUpstageDocumentOcr(file, fileName);
    case 'varco-vision':
      return runVarcoVision(file, fileName);
    default:
      throw new Error(`지원하지 않는 OCR 엔진: ${engine}`);
  }
}
