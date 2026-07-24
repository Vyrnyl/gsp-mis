import { z } from 'zod';

/**
 * Request validation for the notifications module (Feature 2.5, Loop step 3).
 *
 * Contracted routes (mounted under `/api/v1/notifications`):
 *   GET   /            — listNotificationsQuerySchema
 *   PATCH /read-all    — no body
 *   PATCH /:id/read    — no body
 */
export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
