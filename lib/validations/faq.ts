/**
 * @task SAL-DA S2AP2
 * @description Zod 입력 검증 스키마 — FAQ API 요청 바디
 */

import { z } from 'zod';

export const FaqCreateSchema = z.object({
  chatbot_id: z.string().min(1, 'chatbot_id는 필수입니다'),
  question: z
    .string()
    .min(1, '질문은 필수입니다')
    .max(500, '질문은 500자 이내여야 합니다'),
  answer: z
    .string()
    .min(1, '답변은 필수입니다')
    .max(5000, '답변은 5,000자 이내여야 합니다'),
  order_index: z.number().int().min(0).optional(),
});

export const FaqUpdateSchema = z.object({
  question: z.string().min(1).max(500).optional(),
  answer: z.string().min(1).max(5000).optional(),
  order_index: z.number().int().min(0).optional(),
}).refine((d) => d.question !== undefined || d.answer !== undefined || d.order_index !== undefined, {
  message: '수정할 필드(question, answer, order_index)가 하나 이상 필요합니다',
});

export type FaqCreateInput = z.infer<typeof FaqCreateSchema>;
export type FaqUpdateInput = z.infer<typeof FaqUpdateSchema>;
