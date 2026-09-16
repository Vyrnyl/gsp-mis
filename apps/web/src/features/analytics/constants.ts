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

import type {
  AnalyticsDimensionFilters,
  AnalyticsDimensionId,
  AnalyticsTabId,
  DateRange,
  InsightSeverity,
} from './types';

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

/** Sentinel for "no filter" — never sent to the API (see `analytics.service`). Shared
 * by the troop filter and every R4 per-tab dimension filter so there is one value to
 * strip rather than a per-filter convention. */
export const ALL_OPTION = 'all';

/** Pre-R4 name, kept as an alias so the troop filter's existing call sites read the
 * way they always did. */
export const ALL_TROOPS = ALL_OPTION;

/**
 * Which dimension filters each tab exposes (2026-09-16 R4 revision).
 *
 * A filter that cannot apply to a tab is simply **not rendered** there, rather than
 * shown disabled the way the page-level troop filter is: these live inside the tab's
 * own panel, so there is no shared layout to keep from reflowing.
 *
 * Organization and Decisions are deliberately absent — Organization *is* the per-troop
 * comparison, and Decisions is the unfiltered "what needs attention?" view.
 */
export const TAB_DIMENSION_FILTERS: Partial<Record<AnalyticsTabId, AnalyticsDimensionId[]>> = {
  membership: ['schoolId', 'scoutLevelId', 'status'],
  attendance: ['schoolId', 'scoutLevelId'],
  participation: ['activityCategoryId', 'schoolId'],
  badges: ['badgeCategoryId', 'scoutLevelId'],
  financial: ['schoolId', 'activityCategoryId', 'expenseCategoryId'],
};

/** Label + "all" option text per dimension, so every tab's filter bar names a
 * dimension the same way. */
export const DIMENSION_FILTER_META: Record<AnalyticsDimensionId, { label: string; allLabel: string }> = {
  schoolId: { label: 'School', allLabel: 'All Schools' },
  scoutLevelId: { label: 'Scout level', allLabel: 'All Levels' },
  status: { label: 'Status', allLabel: 'All Statuses' },
  activityCategoryId: { label: 'Activity type', allLabel: 'All Activity Types' },
  badgeCategoryId: { label: 'Badge area', allLabel: 'All Badge Areas' },
  expenseCategoryId: { label: 'Expense category', allLabel: 'All Expense Categories' },
};

/** Every dimension filter starts unset — the page opens on the same council-wide view
 * it showed before this revision. */
export const EMPTY_DIMENSION_FILTERS: AnalyticsDimensionFilters = {
  schoolId: ALL_OPTION,
  scoutLevelId: ALL_OPTION,
  status: ALL_OPTION,
  activityCategoryId: ALL_OPTION,
  badgeCategoryId: ALL_OPTION,
  expenseCategoryId: ALL_OPTION,
};

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
];

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
