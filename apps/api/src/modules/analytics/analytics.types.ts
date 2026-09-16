export interface AnalyticsStatValueDto {
  id: string;
  label: string;
  value: number | string;
}

export interface TrendPointDto {
  label: string;
  value: number;
}

export interface MonthlyFinancePointDto {
  label: string;
  income: number;
  expense: number;
}

export interface MembershipAnalyticsDto {
  stats: AnalyticsStatValueDto[];
  trend: TrendPointDto[];
}

export interface AttendanceAnalyticsDto {
  stats: AnalyticsStatValueDto[];
  trend: TrendPointDto[];
}

export interface EventParticipationDto {
  eventId: string;
  eventTitle: string;
  registrations: number;
  attendanceRate: number;
}

export interface ParticipationAnalyticsDto {
  stats: AnalyticsStatValueDto[];
  byEvent: EventParticipationDto[];
}

export interface BadgeCompletionSliceDto {
  badgeId: string;
  badgeName: string;
  completionRate: number;
}

export interface BadgeAnalyticsDto {
  stats: AnalyticsStatValueDto[];
  completionByBadge: BadgeCompletionSliceDto[];
}

export interface FinancialAnalyticsDto {
  stats: AnalyticsStatValueDto[];
  trend: MonthlyFinancePointDto[];
}

export interface TroopPerformanceDto {
  troopId: string;
  troopName: string;
  memberCount: number;
  attendanceRate: number;
  badgesEarned: number;
}

export interface OrganizationAnalyticsDto {
  stats: AnalyticsStatValueDto[];
  troops: TroopPerformanceDto[];
}

export interface AnalyticsSnapshotDto {
  membership: MembershipAnalyticsDto;
  attendance: AttendanceAnalyticsDto;
  participation: ParticipationAnalyticsDto;
  badges: BadgeAnalyticsDto;
  financial: FinancialAnalyticsDto;
  organization: OrganizationAnalyticsDto;
  /** 2026-09-16 revision — school / level / badge-area / activity-type slices. */
  breakdown: BreakdownAnalyticsDto;
  /** 2026-09-16 revision — ranked, thresholded findings built on top of `breakdown`. */
  decisionSupport: DecisionSupportDto;
  generatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Breakdown dimensions + Decision-Making (2026-09-16 revision)
// ─────────────────────────────────────────────────────────────

/**
 * One row of a "group by some dimension" breakdown — school, scout level, badge
 * category or activity category all share this shape, so the frontend renders them
 * through one chart/table component instead of four near-identical ones.
 *
 * `memberCount` is the denominator behind `attendanceRate`/`badgesPerMember`, and is
 * returned rather than hidden so the UI can suppress a rank when the sample is too
 * small to mean anything (see `MIN_SAMPLE_SIZE` in the service).
 */
export interface DimensionBreakdownRowDto {
  id: string;
  label: string;
  memberCount: number;
  attendanceRate: number;
  /** Attendance records behind `attendanceRate`. A group with none has no attendance
   * *data*, which is not the same as 0% turnout — the decision layer needs the
   * difference so it never reports "lowest participation" for an absence of records. */
  attendanceRecords: number;
  badgesEarned: number;
  /** Badges earned per member — comparable across groups of different sizes, which
   * a raw `badgesEarned` total is not. Rounded to 1 decimal. */
  badgesPerMember: number;
}

export interface BreakdownAnalyticsDto {
  bySchool: DimensionBreakdownRowDto[];
  byLevel: DimensionBreakdownRowDto[];
  byBadgeCategory: DimensionBreakdownRowDto[];
  byActivityCategory: ActivityCategoryRowDto[];
}

/** Activity categories are grouped by *event*, not by member, so they carry event
 * counts rather than member counts — a different shape from the member-keyed rows. */
export interface ActivityCategoryRowDto {
  id: string;
  label: string;
  eventCount: number;
  /** Events that actually have attendance records. An upcoming event reads as 0%
   * attendance but is not a turnout failure — the decision layer uses this to tell
   * "nobody came" from "not held yet". */
  heldEvents: number;
  registrations: number;
  attendanceRate: number;
}

export type InsightSeverity = 'critical' | 'warning' | 'info';

/**
 * One actionable finding. The brief's Decision-Making section asks for "specific and
 * actionable insights, not just total numbers", so every insight carries the figure
 * it was derived from (`metric`) and the dimension it points at, not just prose.
 */
export interface InsightDto {
  id: string;
  severity: InsightSeverity;
  /** Which of the brief's five decision areas this answers. */
  category: 'participation' | 'achievement' | 'performance' | 'budget' | 'membership';
  title: string;
  /** Plain-language finding, including the number it rests on. */
  detail: string;
  /** What the council could actually do about it. */
  recommendation: string;
  metric: string;
}

export interface DecisionSupportDto {
  insights: InsightDto[];
  /** Groups excluded from ranking for having too few members to judge fairly — shown
   * explicitly so a suppressed group is never mistaken for a healthy one. */
  suppressed: { label: string; memberCount: number; reason: string }[];
  /** Income by school — the derivable half of the brief's budget breakdown. */
  incomeBySchool: { id: string; label: string; amount: number; share: number }[];
  /** Expense totals by their free-text `category` string. Council-wide: expenses
   * carry no school/troop/event FK, so this cannot be attributed further. */
  expenseByCategory: { label: string; amount: number; share: number }[];
}
