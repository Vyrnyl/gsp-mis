import type { BadgeTone } from '@/shared/components/ui';

import type { ActivityReportFormValues, ActivityReportStatus } from './types';

export const ACTIVITY_REPORT_STATUS_LABELS: Record<ActivityReportStatus, string> = {
  submitted: 'Submitted',
  reviewed: 'Reviewed',
};

/** Matches events' submitted-work/awaiting-review-vs-done convention (upcoming=blue, completed=green). */
export const ACTIVITY_REPORT_STATUS_TONES: Record<ActivityReportStatus, BadgeTone> = {
  submitted: 'blue',
  reviewed: 'green',
};

export const EMPTY_ACTIVITY_REPORT_FORM_VALUES: ActivityReportFormValues = {
  eventId: '',
  summary: '',
  participationNotes: '',
  outcomes: '',
};
