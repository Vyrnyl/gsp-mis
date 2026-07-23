import { z } from 'zod';

/**
 * Request validation for the activity-reports module (Feature 2.3, Loop step 3).
 *
 * Contracted routes (mounted under `/api/v1/activity-reports`):
 *   GET  /      — listActivityReportsQuerySchema
 *   POST /      — createActivityReportSchema
 *   GET  /:id   — no body
 *
 * build-plan.md scopes exactly these three — there is no PATCH/review endpoint.
 * `ActivityReportStatus` also has a `reviewed` value and the schema carries
 * `reviewedAt`, but nothing in this feature transitions a report to it; Executive
 * Council/Admin are read-only here (build-plan.md §2.3 Access). Left unused, same
 * precedent as 2.2's unused `excused`/`late`/`waitlisted` enum values.
 */

export const createActivityReportSchema = z.object({
  eventId: z.string().uuid('Select the event this report is for.'),
  summary: z.string().trim().min(1, 'Summary is required.'),
  participationNotes: z.string().trim().optional(),
  outcomes: z.string().trim().optional(),
});

export const listActivityReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateActivityReportInput = z.infer<typeof createActivityReportSchema>;
export type ListActivityReportsQuery = z.infer<typeof listActivityReportsQuerySchema>;
