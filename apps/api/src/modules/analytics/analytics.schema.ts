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

/**
 * An optional uuid filter that also accepts the frontend's empty-string "no filter"
 * sentinel. Declared once rather than per-param: the 2026-09-16 R4 revision added six
 * more of these, and repeating the `.or(z.literal(''))` transform seven times is how
 * one of them ends up subtly different from the rest.
 */
const optionalIdFilter = () =>
  z
    .string()
    .uuid()
    .optional()
    .or(z.literal('').transform(() => undefined));

/**
 * Membership status is a seeded name (`active`/`pending`/…), not a uuid — `Member`
 * links to a `MemberStatus` row whose `name` is what the UI filters on, so this one
 * param is a bounded string rather than an id.
 */
const optionalNameFilter = () =>
  z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .or(z.literal('').transform(() => undefined));

export const overviewQuerySchema = z.object({
  range: dateRangeSchema,
  /** Omitted / empty = all troops. Empty string is coerced away so the frontend can
   * send its "All Troops" sentinel without special-casing the query builder. */
  troopId: optionalIdFilter(),

  // ── Per-tab dimension filters (2026-09-16 R4 revision) ──────────────────
  // Each one narrows a *specific tab's* breakdowns; they are page-scoped params
  // rather than tab-scoped because the six tabs still share a single fetch, and the
  // service applies each only where that dimension is meaningful. All optional, so
  // an omitted param means "all" exactly as before this revision — the contract stays
  // backward-compatible and the pre-R4 two-param request is still valid.
  /** Membership + Attendance + Participation + Financial — reached through the member
   * (or, for expenses, through `Expense.schoolId` since the R3b attribution migration). */
  schoolId: optionalIdFilter(),
  /** Membership + Attendance + Badges — `Member.scoutLevelId`. */
  scoutLevelId: optionalIdFilter(),
  /** Membership only — matched against `MemberStatus.name`, not an id. */
  status: optionalNameFilter(),
  /** Participation + Financial — `Event.categoryId`. */
  activityCategoryId: optionalIdFilter(),
  /** Badges — `Badge.categoryId`, the badge *area*. */
  badgeCategoryId: optionalIdFilter(),
  /** Financial — `Expense.categoryId` (the controlled category added by R3b). */
  expenseCategoryId: optionalIdFilter(),
});

export type DateRange = z.infer<typeof dateRangeSchema>;
export type OverviewQuery = z.infer<typeof overviewQuerySchema>;
