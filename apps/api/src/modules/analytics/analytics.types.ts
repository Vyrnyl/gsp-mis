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

/** One registration-status group (2026-09-16 R4 revision). Carries `share` because the
 * useful question about status is proportional — "what fraction is still pending?" —
 * not absolute. */
export interface StatusBreakdownRowDto {
  id: string;
  label: string;
  memberCount: number;
  share: number;
}

export interface MembershipAnalyticsDto {
  stats: AnalyticsStatValueDto[];
  trend: TrendPointDto[];
  /**
   * The same roster split by dimension (2026-09-16 R4 revision), answering the brief's
   * Membership Data and Member Classification bullets on the tab that owns them.
   * Before R4 this tab was four totals plus one total over time, split by nothing.
   */
  bySchool: DimensionBreakdownRowDto[];
  byLevel: DimensionBreakdownRowDto[];
  byStatus: StatusBreakdownRowDto[];
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

/** One school's participation (2026-09-16 R4 revision). Distinct from
 * `DimensionBreakdownRowDto` because participation asks a different question of a
 * school than membership does: not "how many members?" but "how many of them actually
 * turn up?" — so it carries the active/inactive split rather than badge figures. */
export interface SchoolParticipationRowDto {
  id: string;
  label: string;
  memberCount: number;
  /** Members with at least one event registration in range. The brief's "active vs.
   * inactive members" ask — inactive is `memberCount - activeMembers`, derived in the
   * UI rather than sent twice. */
  activeMembers: number;
  /** Share of the school's members who participated at all, which is what makes a
   * 4-member school comparable to a 40-member one. */
  participationRate: number;
  registrations: number;
  attendanceRate: number;
  /** Attendance records behind `attendanceRate` — zero means no data, not 0% turnout.
   * Same distinction the R3 false-positive fix turned on. */
  attendanceRecords: number;
}

/**
 * Community engagement (2026-09-16 R4 revision) — the `update.txt` bullet missed
 * entirely by R3.
 *
 * "Community" is identified by *name* on the seeded `BadgeCategory` ("Community
 * Service") and `ActivityCategory` ("Community Outreach") rather than by a schema flag,
 * because no such flag exists. That makes the match a convention, not a guarantee: if
 * a council renames those categories the figures go to zero rather than silently
 * reporting something else. The UI says which categories it counted, so an empty card
 * is self-explaining instead of looking like nobody volunteers.
 */
export interface CommunityEngagementDto {
  /** The category names actually matched, so the UI can name its own sources. Empty
   * when a council has no community-tagged categories at all. */
  badgeCategories: string[];
  activityCategories: string[];
  communityBadgesEarned: number;
  communityEvents: number;
  communityRegistrations: number;
  /** Per-school engagement, so "which schools are engaged with the community?" is
   * answerable rather than just a council total. */
  bySchool: CommunityEngagementSchoolRowDto[];
}

export interface CommunityEngagementSchoolRowDto {
  id: string;
  label: string;
  memberCount: number;
  communityBadgesEarned: number;
  communityRegistrations: number;
  /** Members with at least one community badge or community-event registration. */
  engagedMembers: number;
  engagementRate: number;
}

export interface ParticipationAnalyticsDto {
  stats: AnalyticsStatValueDto[];
  byEvent: EventParticipationDto[];
  /**
   * The same participation split by dimension (2026-09-16 R4 revision). Before R4 this
   * tab was three totals plus one chart of registrations per event — it could say how
   * many people registered, never which kinds of activity or which schools they came
   * from.
   */
  byActivityType: ActivityCategoryRowDto[];
  bySchool: SchoolParticipationRowDto[];
  community: CommunityEngagementDto;
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
  /**
   * Breakdowns of the same in-range money the stats and trend are built from
   * (2026-09-16 R4 revision). The brief's financial line asks explicitly not to show
   * only overall totals, and until R4 this tab was three totals plus one total over
   * time. Same objects the Decisions tab ranks, built once in `buildMoneyBreakdown`.
   */
  incomeBySchool: MoneySliceDto[];
  expenseBySchool: MoneySliceDto[];
  expenseByCategory: MoneySliceDto[];
  expenseByEvent: MoneySliceDto[];
  /** Income vs. spending per school, netted — the direct comparison the brief asks for. */
  schoolFinance: SchoolFinanceRowDto[];
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

export interface MoneySliceDto {
  id: string;
  label: string;
  amount: number;
  share: number;
}

/** Income and expenses side by side for one school, with the resulting net — the
 * comparison the brief asks for ("compare spending between schools"), derivable since
 * the 2026-09-16 expense-attribution migration. */
export interface SchoolFinanceRowDto {
  id: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

/** A member whose age has moved past their current level's band — the derivable half
 * of the brief's promotion ask. Promotion *history* is still not recorded anywhere, so
 * trends over time remain out of reach; this is a point-in-time readiness check. */
export interface PromotionReadinessRowDto {
  levelId: string;
  levelName: string;
  /** Members above `maxAge` for this level. */
  overAge: number;
  memberCount: number;
  /** Where they should move next, by `orderNumber`. Null at the top level. */
  nextLevelName: string | null;
}

export interface DecisionSupportDto {
  insights: InsightDto[];
  /** Groups excluded from ranking for having too few members to judge fairly — shown
   * explicitly so a suppressed group is never mistaken for a healthy one. */
  suppressed: { label: string; memberCount: number; reason: string }[];
  incomeBySchool: MoneySliceDto[];
  /** Expense totals by category — the controlled `ExpenseCategory` where set, else the
   * legacy free-text label for rows predating it (2026-09-16). */
  expenseByCategory: MoneySliceDto[];
  /** Spending attributed to a school. Rows with no school FK are reported under an
   * explicit "Council-wide" entry rather than dropped or guessed at. */
  expenseBySchool: MoneySliceDto[];
  /** Spending attributed to a specific event/activity. */
  expenseByEvent: MoneySliceDto[];
  /** Income vs. spending per school, with net — the direct school-to-school comparison. */
  schoolFinance: SchoolFinanceRowDto[];
  promotionReadiness: PromotionReadinessRowDto[];
}
