import { Badge } from '@/shared/components/ui';

import { ACTIVITY_REPORT_STATUS_LABELS, ACTIVITY_REPORT_STATUS_TONES } from '../constants';
import type { ActivityReportStatus } from '../types';

export function ActivityReportStatusBadge({ status }: { status: ActivityReportStatus }) {
  return <Badge tone={ACTIVITY_REPORT_STATUS_TONES[status]}>{ACTIVITY_REPORT_STATUS_LABELS[status]}</Badge>;
}
