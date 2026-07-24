import { z } from 'zod';

/**
 * Request validation for the announcements module (Feature 2.5, Loop step 3).
 *
 * Contracted routes (mounted under `/api/v1/announcements`):
 *   GET  /   — listAnnouncementsQuerySchema
 *   POST /   — createAnnouncementSchema
 *
 * Create-only for v1 (build-plan.md §2.5 scopes no edit/delete) — see
 * announcements.service.ts.
 */
export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.'),
  content: z.string().trim().min(1, 'Content is required.'),
  expiresAt: z.string().trim().optional(),
});

export const listAnnouncementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type ListAnnouncementsQuery = z.infer<typeof listAnnouncementsQuerySchema>;
