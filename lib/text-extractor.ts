/**
 * @task S2BA3 - Home API (KB 임베딩, 설정 저장, 클라우드 동기화)
 * @description PDF/TXT 텍스트 추출 유틸리티
 *
 * 지원 파일 형식:
 * - TXT: 직접 읽기
 * - PDF: 텍스트 레이어 추출 (바이너리 파싱)
 * - MD:  마크다운 → 텍스트 변환
 */

/** 지원 파일 형식 */
export type SupportedFileType = 'txt' | 'pdf' | 'md';

/** 텍스트 추출 결과 */
export interface TextExtractionResult {
  text: string;
  pageCount?: number;
  wordCount: number;
  charCount: number;
  fileType: SupportedFileType;
}

/** 청크 분할 옵션 */
export interface ChunkOptions {
  /** 청크 최대 토큰 수 (기본: 1000) */
  maxTokens?: number;
  /** 오버랩 토큰 수 (기본: 200) */
  overlapTokens?: number;
}

/** 텍스트 청크 */
export interface TextChunk {
  index: number;
  text: string;
  tokenCount: number;
  charStart: number;
  charEnd: number;
}

/**
 * 파일 확장자에서 지원 파일 타입 판별
 * @param filename - 파일명 (예: "document.pdf")
 * @returns 지원 파일 타입 또는 null
 */
export function detectFileType(filename: string): SupportedFileType | null {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'txt') return 'txt';
  if (ext === 'md') return 'md';
  return null;
}

/**
 * TXT/MD 파일에서 텍스트 추출
 * @param buffer - 파일 버퍼
 * @param fileType - 파일 타입
 * @returns 추출된 텍스트
 */
function extractFromText(buffer: Buffer, fileType: 'txt' | 'md'): string {
  const rawText = buffer.toString('utf-8');

  if (fileType === 'md') {
    // 마크다운 헤더, 강조, 코드블록 → 일반 텍스트
    return rawText
      .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
      .replace(/`[^`]*`/g, '')         // 인라인 코드 제거
      .replace(/#{1,6}\s+/g, '')        // 헤더 마크 제거
      .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1') // 볼드/이탤릭 제거
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')       // 링크 → 텍스트만
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')           // 이미지 제거
      .replace(/^\s*[-*+]\s+/gm, '')    // 리스트 마크 제거
      .replace(/^\s*\d+\.\s+/gm, '')    // 번호 리스트 마크 제거
      .replace(/\n{3,}/g, '\n\n')       // 연속 빈줄 정리
      .trim();
  }

  return rawText.trim();
}

/**
 * PDF 파일에서 텍스트 추출 (순수 바이너리 파싱)
 * node-pdfparse 등 외부 라이브러리 없이 텍스트 레이어를 직접 추출
 * @param buffer - PDF 파일 버퍼
 * @returns 추출된 텍스트와 페이지 수
 */
function extractFromPdf(buffer: Buffer): { text: string; pageCount: number } {
  const pdfString = buffer.toString('binary');

  // PDF 스트림에서 텍스트 추출 (BT...ET 블록 내 Tj, TJ 연산자)
  const textParts: string[] = [];
  let pageCount = 0;

  // 페이지 수 카운트
  const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g);
  if (pageMatches) pageCount = pageMatches.length;

  // BT (Begin Text) ~ ET (End Text) 블록 파싱
  const btEtRegex = /BT([\s\S]*?)ET/g;
  let btMatch: RegExpExecArray | null;

  while ((btMatch = btEtRegex.exec(pdfString)) !== null) {
    const block = btMatch[1];

    // Tj 연산자: (텍스트) Tj
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      const decoded = decodePdfString(tjMatch[1]);
      if (decoded.trim()) textParts.push(decoded);
    }

    // TJ 연산자: [(텍스트) 숫자 (텍스트)] TJ
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let tjArrayMatch: RegExpExecArray | null;
    while ((tjArrayMatch = tjArrayRegex.exec(block)) !== null) {
      const arrayContent = tjArrayMatch[1];
      const innerStrings = arrayContent.match(/\(([^)]*)\)/g);
      if (innerStrings) {
        const combined = innerStrings
          .map((s) => decodePdfString(s.slice(1, -1)))
          .join('');
        if (combined.trim()) textParts.push(combined);
      }
    }
  }

  const text = textParts
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { text: text || '(PDF에서 텍스트를 추출할 수 없습니다.)', pageCount };
}

/**
 * PDF 문자열 이스케이프 디코딩
 * @param str - PDF 내부 문자열
 * @returns 디코딩된 문자열
 */
function decodePdfString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{1,3})/g, (_, oct) =>
      String.fromCharCode(parseInt(oct, 8))
    );
}

/**
 * 파일 버퍼에서 텍스트 추출 (메인 함수)
 * @param buffer - 파일 버퍼
 * @param filename - 파일명 (확장자 판별용)
 * @returns TextExtractionResult
 * @throws Error - 지원하지 않는 파일 형식
 */
export async function extractText(
  buffer: Buffer,
  filename: string
): Promise<TextExtractionResult> {
  const fileType = detectFileType(filename);

  if (!fileType) {
    throw new Error(
      `지원하지 않는 파일 형식입니다. 지원 형식: PDF, TXT, MD (파일명: ${filename})`
    );
  }

  let text: string;
  let pageCount: number | undefined;

  if (fileType === 'pdf') {
    const result = extractFromPdf(buffer);
    text = result.text;
    pageCount = result.pageCount;
  } else {
    text = extractFromText(buffer, fileType);
  }

  // 텍스트 정제: 비정상 문자 제거
  text = text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // 제어문자
    .replace(/\uFFFD/g, '') // 대체 문자
    .trim();

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  return { text, pageCount, wordCount, charCount, fileType };
}

/**
 * 텍스트를 임베딩용 청크로 분할
 *
 * 토큰 수 추정: 영어 1단어 ≈ 1.3토큰, 한국어 1글자 ≈ 1토큰
 * 실제 토크나이저 없이 문자 수 기반 추정 사용
 *
 * @param text - 분할할 텍스트
 * @param options - 청크 옵션 (maxTokens=1000, overlapTokens=200)
 * @returns TextChunk 배열
 */
export function splitIntoChunks(
  text: string,
  options: ChunkOptions = {}
): TextChunk[] {
  const { maxTokens = 1000, overlapTokens = 200 } = options;

  if (!text.trim()) return [];

  // 문자 수 기준 (한국어 포함): 1토큰 ≈ 2.5자 (영+한 평균)
  const CHARS_PER_TOKEN = 2.5;
  const maxChars = Math.floor(maxTokens * CHARS_PER_TOKEN);
  const overlapChars = Math.floor(overlapTokens * CHARS_PER_TOKEN);
  const stepChars = maxChars - overlapChars;

  const chunks: TextChunk[] = [];
  let charStart = 0;
  let index = 0;

  while (charStart < text.length) {
    const charEnd = Math.min(charStart + maxChars, text.length);
    let chunkText = text.slice(charStart, charEnd);

    // 단어/문장 경계에서 자르기 (중간 단어 잘림 방지)
    if (charEnd < text.length) {
      const lastBreak = Math.max(
        chunkText.lastIndexOf('\n'),
        chunkText.lastIndexOf('. '),
        chunkText.lastIndexOf('。'),
        chunkText.lastIndexOf(' ')
      );
      if (lastBreak > maxChars * 0.5) {
        chunkText = chunkText.slice(0, lastBreak + 1);
      }
    }

    const trimmed = chunkText.trim();
    if (trimmed) {
      const tokenCount = Math.ceil(trimmed.length / CHARS_PER_TOKEN);
      chunks.push({
        index,
        text: trimmed,
        tokenCount,
        charStart,
        charEnd: charStart + chunkText.length,
      });
      index++;
    }

    charStart += stepChars;
    if (charStart >= text.length) break;
  }

  return chunks;
}

/**
 * 파일 크기 검증
 * @param sizeBytes - 파일 크기 (바이트)
 * @param maxMB - 최대 크기 (MB, 기본: 10)
 * @throws Error - 파일 크기 초과
 */
export function validateFileSize(sizeBytes: number, maxMB = 10): void {
  const maxBytes = maxMB * 1024 * 1024;
  if (sizeBytes > maxBytes) {
    throw new Error(
      `파일 크기가 너무 큽니다. 최대 ${maxMB}MB까지 허용됩니다. (현재: ${(sizeBytes / 1024 / 1024).toFixed(2)}MB)`
    );
  }
}
