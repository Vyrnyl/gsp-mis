import {
  ActivityIcon,
  AnalyticsIcon,
  AttendanceIcon,
  BadgeIcon,
  FinanceIcon,
  MembersIcon,
  type IconType,
} from '@/shared/components/icons';
import type { AuthRoleId } from '@/features/auth/types';
import { roleHasPermission, type PermissionName } from '@/shared/constants/roles';

import type { ReportFormat, ReportTypeDef, ReportTypeId } from './types';

export const REPORT_TYPES: ReportTypeDef[] = [
  { id: 'membership', label: 'Membership Report', description: 'Registered scouts and adult leaders by status and troop.' },
  { id: 'attendance', label: 'Attendance Report', description: 'Event attendance rates across the selected date range.' },
  { id: 'badge', label: 'Badge Report', description: 'Badges awarded, verified, and still in progress.' },
  { id: 'financial', label: 'Financial Report', description: 'Payments collected and expenses recorded.' },
  { id: 'activity', label: 'Activity Report', description: 'Troop activity reports submitted to the council.' },
  { id: 'executive', label: 'Executive Report', description: 'Organization-wide performance across every module.' },
];

export const REPORT_TYPE_ICONS: Record<ReportTypeId, IconType> = {
  membership: MembersIcon,
  attendance: AttendanceIcon,
  badge: BadgeIcon,
  financial: FinanceIcon,
  activity: ActivityIcon,
  executive: AnalyticsIcon,
};

/**
 * `null` for `executive` — that type isn't gated by a single domain permission, it's
 * a cross-module summary reserved for Admin + Executive Council (same role-shaped
 * split 1.5's dashboard uses for its org-wide vs. own-troop variants), checked
 * directly against role in `getAvailableReportTypes` below.
 */
export const REPORT_TYPE_PERMISSION: Record<ReportTypeId, PermissionName | null> = {
  membership: 'members:read',
  attendance: 'attendance:read',
  badge: 'badges:read',
  financial: 'finance:read',
  activity: 'activity-reports:read',
  executive: null,
};

export const REPORT_FORMAT_LABELS: Record<ReportFormat, string> = {
  pdf: 'PDF',
  excel: 'Excel',
};

/** Mirrors `MAX_REPORT_RANGE_DAYS` in `apps/api/.../reports.schema.ts` — no repository
 * query behind a report type is paginated, so an unbounded range pulls the whole table
 * into memory before PDF/Excel generation runs. Used to cap the date inputs' min/max
 * so the browser never lets a user pick an out-of-range combination in the first place.
 * 731 not 730 — a literal Jan-1-to-Jan-1 two-year span crosses one leap day. */
export const MAX_REPORT_RANGE_DAYS = 731;

/** Report types the signed-in role may generate — filters `REPORT_TYPES` by permission. */
export function getAvailableReportTypes(role: AuthRoleId): ReportTypeDef[] {
  return REPORT_TYPES.filter((type) => {
    if (type.id === 'executive') return role === 'admin' || role === 'executive_council';
    const permission = REPORT_TYPE_PERMISSION[type.id];
    return permission ? roleHasPermission(role, permission) : true;
  });
}
