export type ViewState = 'loading' | 'error' | 'ready';

export type AnalyticsTabId =
  | 'decisions'
  | 'membership'
  | 'attendance'
  | 'participation'
  | 'badges'
  | 'financial'
  | 'organization'
  | 'breakdown';

/** Mirrors `analytics.schema.ts`'s `dateRangeSchema` by hand — same cross-workspace
 * convention as reports/finance/members. Presets rather than free-form dates so the
 * monthly trend buckets always align to whole calendar months. */
export type DateRange = '3m' | '6m' | '12m' | 'ytd';

/** The dimensions a tab can be narrowed by (2026-09-16 R4 revision). Every one is a
 * string holding either `ALL_OPTION` or an id, mirroring `troopId`'s sentinel
 * convention rather than using `undefined` — a `<Select>` always has a value. */
export interface AnalyticsDimensionFilters {
  schoolId: string;
  scoutLevelId: string;
  /** `MemberStatus.name`, not an id — see `analytics.schema.ts`. */
  status: string;
  activityCategoryId: string;
  badgeCategoryId: string;
  expenseCategoryId: string;
}

/** Which dimension a given tab actually exposes. Used to render only the filters that
 * mean something on the active tab (unlike the page-level troop filter, which stays
 * visible-but-disabled so the top bar does not reflow on every tab change). */
export type AnalyticsDimensionId = keyof AnalyticsDimensionFilters;

export interface AnalyticsFilters extends AnalyticsDimensionFilters {
  range: DateRange;
  /** `'all'` is the UI sentinel for "no troop filter" — normalized to an omitted
   * query param by the service, never sent as a literal. */
  troopId: string;
}

/** Stat cards are presentation-only past `id`/`label`/`value` — icon/tone are looked
 * up client-side in `constants.ts`, matching the finance/dashboard features' convention. */
export interface AnalyticsStatValue {
  id: string;
  label: string;
  value: number | string;
}

/** One bucket in a single-series monthly trend chart (membership, attendance). */
export interface TrendPoint {
  label: string;
  value: number;
}

/** One bucket in the Income vs. Expense trend chart — same shape as finance's `MonthlyFinancePoint`. */
export interface MonthlyFinancePoint {
  label: string;
  income: number;
  expense: number;
}

export interface MembershipAnalytics {
  stats: AnalyticsStatValue[];
  /** New registrations per calendar month across the selected range. */
  trend: TrendPoint[];
}

export interface AttendanceAnalytics {
  stats: AnalyticsStatValue[];
  /** Average attendance rate (%) per calendar month across the selected range. */
  trend: TrendPoint[];
}

export interface EventParticipation {
  eventId: string;
  eventTitle: string;
  registrations: number;
  attendanceRate: number;
}

export interface ParticipationAnalytics {
  stats: AnalyticsStatValue[];
  /** Most recent events with at least one registration, newest first. */
  byEvent: EventParticipation[];
}

export interface BadgeCompletionSlice {
  badgeId: string;
  badgeName: string;
  /** % of members *in the current troop scope* who have earned or verified this badge. */
  completionRate: number;
}

export interface BadgeAnalytics {
  stats: AnalyticsStatValue[];
  completionByBadge: BadgeCompletionSlice[];
}

export interface FinancialAnalytics {
  stats: AnalyticsStatValue[];
  trend: MonthlyFinancePoint[];
  /**
   * Breakdowns of the same in-range money the stats and trend are built from
   * (2026-09-16 R4 revision). The brief asks explicitly not to show only overall
   * financial totals, which is all this tab showed before. Same objects the Decisions
   * tab ranks — built once server-side, so the two tabs cannot disagree.
   */
  incomeBySchool: MoneySlice[];
  expenseBySchool: MoneySlice[];
  expenseByCategory: MoneySlice[];
  expenseByEvent: MoneySlice[];
  /** Income vs. spending per school, netted — the direct comparison the brief asks for. */
  schoolFinance: SchoolFinanceRow[];
}

export interface TroopPerformance {
  troopId: string;
  troopName: string;
  memberCount: number;
  attendanceRate: number;
  badgesEarned: number;
}

export interface OrganizationAnalytics {
  stats: AnalyticsStatValue[];
  troops: TroopPerformance[];
}

export interface AnalyticsSnapshot {
  membership: MembershipAnalytics;
  attendance: AttendanceAnalytics;
  participation: ParticipationAnalytics;
  badges: BadgeAnalytics;
  financial: FinancialAnalytics;
  organization: OrganizationAnalytics;
  /** 2026-09-16 revision — school / level / badge-area / activity-type slices. */
  breakdown: BreakdownAnalytics;
  /** 2026-09-16 revision — ranked findings built on top of `breakdown`. */
  decisionSupport: DecisionSupport;
  generatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Breakdown dimensions + Decision-Making (2026-09-16 revision)
// Mirrors `analytics.types.ts` by hand — same cross-workspace convention as the
// rest of this file.
// ─────────────────────────────────────────────────────────────

/** One row of a group-by breakdown. School, level and badge-area rows all share this
 * shape so a single table/chart pair renders all three. */
export interface DimensionBreakdownRow {
  id: string;
  label: string;
  memberCount: number;
  attendanceRate: number;
  /** Records behind `attendanceRate` — zero means "no attendance data", which is not
   * the same as 0% turnout. */
  attendanceRecords: number;
  badgesEarned: number;
  /** Comparable across groups of different sizes, unlike a raw badge total. */
  badgesPerMember: number;
}

/** Activity types group by event rather than by member, so they carry event counts. */
export interface ActivityCategoryRow {
  id: string;
  label: string;
  eventCount: number;
  /** Events with attendance actually recorded — an upcoming event reads as 0% but is
   * not a turnout failure. */
  heldEvents: number;
  registrations: number;
  attendanceRate: number;
}

export interface BreakdownAnalytics {
  bySchool: DimensionBreakdownRow[];
  byLevel: DimensionBreakdownRow[];
  byBadgeCategory: DimensionBreakdownRow[];
  byActivityCategory: ActivityCategoryRow[];
}

export type InsightSeverity = 'critical' | 'warning' | 'info';

export type InsightCategory = 'participation' | 'achievement' | 'performance' | 'budget' | 'membership';

/** One actionable finding — carries the figure it rests on, so a reader can
 * sanity-check the claim rather than trusting it. */
export interface Insight {
  id: string;
  severity: InsightSeverity;
  category: InsightCategory;
  title: string;
  detail: string;
  recommendation: string;
  metric: string;
}

export interface MoneySlice {
  id: string;
  label: string;
  amount: number;
  share: number;
}

/** Income vs. spending for one school, with net — the direct comparison the brief
 * asks for, derivable since the 2026-09-16 expense-attribution migration. */
export interface SchoolFinanceRow {
  id: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

/** Members who have aged past their level's band. Point-in-time only — the database
 * records no promotion history, so trends over time remain underivable. */
export interface PromotionReadinessRow {
  levelId: string;
  levelName: string;
  overAge: number;
  memberCount: number;
  nextLevelName: string | null;
}

export interface DecisionSupport {
  insights: Insight[];
  /** Groups too small to rank fairly — shown so "insufficient data" never reads as
   * "healthy". */
  suppressed: { label: string; memberCount: number; reason: string }[];
  incomeBySchool: MoneySlice[];
  expenseByCategory: MoneySlice[];
  /** Spending attributed to a school; unattributed rows appear as "Council-wide". */
  expenseBySchool: MoneySlice[];
  expenseByEvent: MoneySlice[];
  schoolFinance: SchoolFinanceRow[];
  promotionReadiness: PromotionReadinessRow[];
}
