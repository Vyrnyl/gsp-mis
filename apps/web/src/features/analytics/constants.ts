import {
  AnalyticsIcon,
  ApprovalIcon,
  AttendanceIcon,
  BadgeIcon,
  BalanceIcon,
  ClockIcon,
  CouncilIcon,
  EventIcon,
  ExpenseIcon,
  IncomeIcon,
  MembersIcon,
  RejectIcon,
  SuccessIcon,
  type IconType,
} from '@/shared/components/icons';
import type { AlertTone, BadgeTone, StatCardTone } from '@/shared/components/ui';
import { palette } from '@/shared/design/tokens';

import type { AnalyticsTabId, DateRange, InsightSeverity } from './types';

/** Mirrors `analytics.schema.ts`'s `dateRangeSchema`. Presets rather than free-form
 * date inputs (Reports' approach) because the trend charts bucket by whole calendar
 * months — an arbitrary mid-month boundary would render a misleading partial bar. */
export const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '3m', label: 'Last 3 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'ytd', label: 'This year' },
];

export const DEFAULT_DATE_RANGE: DateRange = '6m';

/** Sentinel for "no troop filter" — never sent to the API (see `analytics.service`). */
export const ALL_TROOPS = 'all';

/** Decisions leads — it is the "what should we do about this?" summary, and the six
 * aggregate tabs are the evidence behind it. Breakdown trails as the detailed
 * per-dimension slices (added 2026-09-16). */
export const ANALYTICS_TABS: { id: AnalyticsTabId; label: string }[] = [
  { id: 'decisions', label: 'Decisions' },
  { id: 'membership', label: 'Membership' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'participation', label: 'Participation' },
  { id: 'badges', label: 'Badges' },
  { id: 'financial', label: 'Financial' },
  { id: 'organization', label: 'Organization' },
  { id: 'breakdown', label: 'Breakdown' },
];

/** Breakdown dimension sub-tabs (2026-09-16 revision). */
export const BREAKDOWN_DIMENSIONS = [
  { id: 'school', label: 'By School' },
  { id: 'level', label: 'By Level' },
  { id: 'badgeCategory', label: 'By Badge Area' },
  { id: 'activityCategory', label: 'By Activity Type' },
] as const;

export type BreakdownDimensionId = (typeof BREAKDOWN_DIMENSIONS)[number]['id'];

/** Severity → Alert tone + label. Keeps the mapping in one place so the panel and any
 * future consumer agree on what "critical" looks like. */
export const INSIGHT_SEVERITY_PRESENTATION: Record<
  InsightSeverity,
  { tone: AlertTone; label: string; badgeTone: BadgeTone }
> = {
  critical: { tone: 'error', label: 'Needs attention', badgeTone: 'red' },
  warning: { tone: 'warning', label: 'Watch', badgeTone: 'gold' },
  info: { tone: 'info', label: 'For awareness', badgeTone: 'blue' },
};

type StatPresentation = Record<string, { icon: IconType; tone: StatCardTone }>;

export const MEMBERSHIP_STAT_PRESENTATION: StatPresentation = {
  totalMembers: { icon: MembersIcon, tone: 'green' },
  active: { icon: SuccessIcon, tone: 'blue' },
  pending: { icon: ApprovalIcon, tone: 'gold' },
  newThisPeriod: { icon: AnalyticsIcon, tone: 'red' },
};

export const ATTENDANCE_STAT_PRESENTATION: StatPresentation = {
  eventsHeld: { icon: EventIcon, tone: 'green' },
  avgRate: { icon: AttendanceIcon, tone: 'blue' },
  totalPresent: { icon: SuccessIcon, tone: 'gold' },
  totalAbsent: { icon: RejectIcon, tone: 'red' },
};

export const PARTICIPATION_STAT_PRESENTATION: StatPresentation = {
  totalRegistrations: { icon: EventIcon, tone: 'green' },
  avgPerEvent: { icon: MembersIcon, tone: 'blue' },
  avgAttendanceRate: { icon: AttendanceIcon, tone: 'gold' },
};

export const BADGE_STAT_PRESENTATION: StatPresentation = {
  totalAwarded: { icon: BadgeIcon, tone: 'green' },
  verified: { icon: SuccessIcon, tone: 'blue' },
  inProgress: { icon: ClockIcon, tone: 'gold' },
};

export const FINANCIAL_STAT_PRESENTATION: StatPresentation = {
  income: { icon: IncomeIcon, tone: 'green' },
  expenses: { icon: ExpenseIcon, tone: 'red' },
  balance: { icon: BalanceIcon, tone: 'blue' },
};

export const ORGANIZATION_STAT_PRESENTATION: StatPresentation = {
  totalTroops: { icon: CouncilIcon, tone: 'green' },
  avgMembersPerTroop: { icon: MembersIcon, tone: 'blue' },
  topAttendanceRate: { icon: AttendanceIcon, tone: 'gold' },
};

/** Chart colors — real hex values (ChartJS needs them, not Tailwind classes), same
 * convention as the dashboard's `STATUS_CHART_COLORS`/finance's `FINANCE_CHART_COLORS`. */
export const FINANCIAL_TREND_COLORS = {
  income: palette.green2,
  expense: palette.red,
};

export const TROOP_CHART_COLORS = [palette.green2, palette.blue, palette.gold2, palette.red, palette.muted];
