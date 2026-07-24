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
import type { StatCardTone } from '@/shared/components/ui';
import { palette } from '@/shared/design/tokens';

import type { AnalyticsTabId } from './types';

export const ANALYTICS_TABS: { id: AnalyticsTabId; label: string }[] = [
  { id: 'membership', label: 'Membership' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'participation', label: 'Participation' },
  { id: 'badges', label: 'Badges' },
  { id: 'financial', label: 'Financial' },
  { id: 'organization', label: 'Organization' },
];

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
