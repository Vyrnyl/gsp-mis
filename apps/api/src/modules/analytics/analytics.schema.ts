import { z } from 'zod';

/**
 * Request validation for the analytics module (Feature 3.3).
 *
 * Added by the 2026-09-02 filter revision — the feature originally shipped with a
 * hardcoded "last 6 months, all troops" view and no query contract at all.
 *
 * Mirrored by hand in `apps/web/src/features/analytics/types.ts` — same
 * cross-workspace convention as `reports.schema.ts` / `finance.schema.ts`.
 *
 * Contracted routes (mounted under `/api/v1/analytics`):
 *   GET /overview — overviewQuerySchema
 */

/**
 * Presets rather than free-form `dateFrom`/`dateTo` (which is what Reports uses).
 * Two reasons this feature differs: the trend charts bucket by *calendar month*, so
 * an arbitrary mid-month boundary would render a misleading partial first/last bar;
 * and a fixed set of ranges needs no max-range cap (`MAX_REPORT_RANGE_DAYS`), since
 * the widest option is bounded by construction.
 */
export const dateRangeSchema = z.enum(['3m', '6m', '12m', 'ytd']).default('6m');

export const overviewQuerySchema = z.object({
  range: dateRangeSchema,
  /** Omitted / empty = all troops. Empty string is coerced away so the frontend can
   * send its "All Troops" sentinel without special-casing the query builder. */
  troopId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export type DateRange = z.infer<typeof dateRangeSchema>;
export type OverviewQuery = z.infer<typeof overviewQuerySchema>;
