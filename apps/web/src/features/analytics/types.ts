export type ViewState = 'loading' | 'error' | 'ready';

export type AnalyticsTabId = 'membership' | 'attendance' | 'participation' | 'badges' | 'financial' | 'organization';

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
  /** New registrations per month, last 6 calendar months. */
  trend: TrendPoint[];
}

export interface AttendanceAnalytics {
  stats: AnalyticsStatValue[];
  /** Average attendance rate (%) per month, last 6 calendar months. */
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
  /** % of all members who have earned or verified this badge. */
  completionRate: number;
}

export interface BadgeAnalytics {
  stats: AnalyticsStatValue[];
  completionByBadge: BadgeCompletionSlice[];
}

export interface FinancialAnalytics {
  stats: AnalyticsStatValue[];
  trend: MonthlyFinancePoint[];
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
  generatedAt: string;
}
