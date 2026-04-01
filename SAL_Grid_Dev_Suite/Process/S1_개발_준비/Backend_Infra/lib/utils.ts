// @task S1BI1 - Next.js 프로젝트 초기화 + Tailwind CSS 설정
// 공통 유틸리티 함수

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind 클래스 병합 유틸리티
 * clsx + tailwind-merge 조합
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 날짜 포맷 (한국어)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 에러 메시지 추출
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '알 수 없는 오류가 발생했습니다.';
}

/**
 * 환경 변수 검증
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`환경 변수 ${key}가 설정되지 않았습니다.`);
  }
  return value;
}
