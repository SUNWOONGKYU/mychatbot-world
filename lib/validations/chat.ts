/**
 * @task S5BA1
 * @description Zod 입력 검증 스키마 — /api/chat 요청 바디
 */

import { z } from 'zod';

export const ChatRequestSchema = z.object({
  botId: z.string().min(1, 'botId는 필수입니다'),
  message: z
    .string()
    .min(1, '메시지를 입력해 주세요')
    .max(4000, '메시지는 4,000자 이내여야 합니다'),
  emotionLevel: z
    .number()
    .int()
    .min(1, 'emotionLevel은 1 이상이어야 합니다')
    .max(100, 'emotionLevel은 100 이하여야 합니다'),
  conversationId: z.string().optional(),
  costTier: z.enum(['economy', 'standard', 'premium']).default('standard'),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
