import { Badge } from '@/shared/components/ui';

import { EVENT_STATUS_LABELS, EVENT_STATUS_TONES } from '../constants';
import type { EventStatus } from '../types';

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <Badge tone={EVENT_STATUS_TONES[status]}>{EVENT_STATUS_LABELS[status]}</Badge>;
}
