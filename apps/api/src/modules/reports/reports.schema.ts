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

/** No repository query behind a report type applies a row limit — an unbounded range
 * pulls the whole table into memory before PDF/Excel generation ever runs. Capped at
 * 2 years (mirrored in `apps/web/src/features/reports/constants.ts`) rather than
 * something tighter like 1-2 months, since that would already reject this feature's
 * own default filter (`startOfYearIso()` → today, ~7 months mid-year). 731 not 730 —
 * a literal Jan-1-to-Jan-1 two-year span crosses one leap day (e.g. 2024-01-01 to
 * 2026-01-01 is 731 days), and that's an honest "2 years," not someone abusing the cap. */
export const MAX_REPORT_RANGE_DAYS = 731;

function daysBetween(dateFrom: string, dateTo: string): number {
  const from = new Date(`${dateFrom}T00:00:00.000Z`).getTime();
  const to = new Date(`${dateTo}T00:00:00.000Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}

function withinMaxRange<T extends { dateFrom: string; dateTo: string }>(value: T): boolean {
  return daysBetween(value.dateFrom, value.dateTo) <= MAX_REPORT_RANGE_DAYS;
}

const MAX_RANGE_ISSUE = {
  message: `Date range cannot exceed ${MAX_REPORT_RANGE_DAYS} days (about 2 years).`,
  path: ['dateTo'],
};

export const reportTypeSchema = z.enum(['membership', 'attendance', 'badge', 'financial', 'activity', 'executive']);
/** Full set a stored `Report` row can have — includes `excel` so history/download of
 * previously-exported Excel files (generated before the option below was pulled) keeps working. */
export const reportFormatSchema = z.enum(['pdf', 'excel']);
/** Excel export is temporarily disabled — only `pdf` is accepted for *new* exports.
 * Widen back to `reportFormatSchema` to re-enable (generator/storage support was left intact). */
export const exportFormatSchema = z.enum(['pdf']);

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
  })
  .refine(withinMaxRange, MAX_RANGE_ISSUE);

export const exportSchema = z
  .object({
    reportType: reportTypeSchema,
    dateFrom: isoDate,
    dateTo: isoDate,
    troopId: z.string().uuid().optional(),
    format: exportFormatSchema,
  })
  .refine((value) => value.dateFrom <= value.dateTo, {
    message: '"From" must be on or before "To".',
    path: ['dateTo'],
  })
  .refine(withinMaxRange, MAX_RANGE_ISSUE);

export const listHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ReportType = z.infer<typeof reportTypeSchema>;
export type ReportFormat = z.infer<typeof reportFormatSchema>;
export type PreviewQuery = z.infer<typeof previewQuerySchema>;
export type ExportInput = z.infer<typeof exportSchema>;
export type ListHistoryQuery = z.infer<typeof listHistoryQuerySchema>;
