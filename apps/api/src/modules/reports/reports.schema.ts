import { z } from 'zod';

/**
 * Request validation for the reports module (Feature 3.2, Loop step 3 — Contract).
 *
 * Mirrored by hand in `apps/web/src/features/reports/types.ts` — same cross-workspace
 * convention as `finance.schema.ts` / `members.schema.ts`.
 *
 * Contracted routes (mounted under `/api/v1/reports`):
 *   GET  /preview   — previewQuerySchema
 *   GET  /           — listHistoryQuerySchema
 *   POST /export     — exportSchema
 *   GET  /:id/download — no body
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.');

export const reportTypeSchema = z.enum(['membership', 'attendance', 'badge', 'financial', 'activity', 'executive']);
export const reportFormatSchema = z.enum(['pdf', 'excel']);

export const previewQuerySchema = z
  .object({
    reportType: reportTypeSchema,
    dateFrom: isoDate,
    dateTo: isoDate,
    troopId: z.string().uuid().optional(),
  })
  .refine((value) => value.dateFrom <= value.dateTo, {
    message: '"From" must be on or before "To".',
    path: ['dateTo'],
  });

export const exportSchema = z
  .object({
    reportType: reportTypeSchema,
    dateFrom: isoDate,
    dateTo: isoDate,
    troopId: z.string().uuid().optional(),
    format: reportFormatSchema,
  })
  .refine((value) => value.dateFrom <= value.dateTo, {
    message: '"From" must be on or before "To".',
    path: ['dateTo'],
  });

export const listHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ReportType = z.infer<typeof reportTypeSchema>;
export type ReportFormat = z.infer<typeof reportFormatSchema>;
export type PreviewQuery = z.infer<typeof previewQuerySchema>;
export type ExportInput = z.infer<typeof exportSchema>;
export type ListHistoryQuery = z.infer<typeof listHistoryQuerySchema>;
