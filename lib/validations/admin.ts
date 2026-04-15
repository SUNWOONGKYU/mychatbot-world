/**
 * @task S5BA1
 * @description Zod 입력 검증 스키마 — Admin API 쿼리/바디
 */

import { z } from 'zod';

/** GET /api/admin/users 쿼리 파라미터 */
export const AdminUsersQuerySchema = z.object({
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AdminUsersQuery = z.infer<typeof AdminUsersQuerySchema>;

/** PATCH /api/admin/users — 사용자 역할·상태 변경 */
export const AdminUserUpdateSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['user', 'moderator', 'admin']).optional(),
  banned: z.boolean().optional(),
});

export type AdminUserUpdate = z.infer<typeof AdminUserUpdateSchema>;

/** POST /api/admin/payments — 크레딧 지급 */
export const AdminCreditGrantSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().min(1).max(1_000_000),
  reason: z.string().max(200).optional(),
});

export type AdminCreditGrant = z.infer<typeof AdminCreditGrantSchema>;
