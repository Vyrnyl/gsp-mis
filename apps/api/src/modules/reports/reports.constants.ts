import type { ReportType } from './reports.schema';

/** Mirrors `REPORT_TYPES` labels in `apps/web/src/features/reports/constants.ts`. */
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  membership: 'Membership Report',
  attendance: 'Attendance Report',
  badge: 'Badge Report',
  financial: 'Financial Report',
  activity: 'Activity Report',
  executive: 'Executive Report',
};
