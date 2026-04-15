/**
 * @task SAL-DA S2AP2
 * @description Zod 입력 검증 스키마 — Wiki API 요청 바디
 */

import { z } from 'zod';

/** 안전한 파일명 패턴 — 경로 탐색 문자 차단 */
const SAFE_FILENAME = /^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ_\-. ]+\.md$/;

export const WikiSyncFileSchema = z.object({
  filename: z
    .string()
    .min(1, 'filename은 필수입니다')
    .max(255, 'filename은 255자 이내여야 합니다')
    .regex(SAFE_FILENAME, '허용되지 않는 파일명입니다 (.md 파일만 허용)'),
  content: z
    .string()
    .max(500_000, '파일 내용은 500KB 이내여야 합니다'),
});

export const WikiSyncSchema = z.object({
  bot_id: z.string().uuid('유효한 bot_id가 필요합니다'),
  files: z
    .array(WikiSyncFileSchema)
    .min(1, '최소 1개 이상의 파일이 필요합니다')
    .max(100, '한 번에 최대 100개 파일을 처리할 수 있습니다'),
});

export type WikiSyncInput = z.infer<typeof WikiSyncSchema>;
