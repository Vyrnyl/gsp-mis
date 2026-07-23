import { ActivityDot, ActivityItem } from '@/shared/components/ui';
import { formatRelativeTime } from '@/shared/utils/format-relative-time';

import type { ActivityEntry } from '../types';

export interface RecentActivityListProps {
  activity: ActivityEntry[];
}

/** Recent activity feed — registry §3. Admin dashboard only. */
export function RecentActivityList({ activity }: RecentActivityListProps) {
  return (
    <div>
      {activity.map((entry, index) => (
        <ActivityItem
          key={entry.id}
          leading={<ActivityDot tone={entry.tone} />}
          title={entry.text}
          meta={formatRelativeTime(entry.occurredAt)}
          className={index === activity.length - 1 ? 'border-b-0' : undefined}
        />
      ))}
    </div>
  );
}
