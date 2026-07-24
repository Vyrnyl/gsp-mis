import { ActivityDot } from '@/shared/components/ui';
import { cn } from '@/shared/utils/cn';
import { formatRelativeTime } from '@/shared/utils/format-relative-time';

import type { NotificationItem } from '../types';

export interface NotificationRowProps {
  notification: NotificationItem;
  className?: string;
}

/**
 * One notification row — registry §7's `.notif-item`. Not `ActivityItem`: that
 * component's `meta` slot is a short one-line caption (dashboard's feed only ever
 * puts a timestamp there), while a notification needs a full wrapping title *and*
 * message body, so reusing it produced a truncated, single-line title. Still built
 * from `ActivityDot` for the unread indicator rather than a new dot primitive.
 */
export function NotificationRow({ notification, className }: NotificationRowProps) {
  return (
    <div
      className={cn(
        'flex gap-3 border-b border-hairline-faint px-2 py-3 last:border-b-0',
        !notification.isRead && 'bg-brand-green3',
        className,
      )}
    >
      <ActivityDot tone={notification.isRead ? 'blue' : 'green'} className="mt-1.5" />
      <div className="min-w-0 flex-1">
        <p className={cn('text-[0.88rem] text-ink-soft', !notification.isRead && 'font-semibold text-ink')}>
          {notification.title}
        </p>
        <p className="mt-0.5 text-[0.8rem] leading-snug text-muted">{notification.message}</p>
        <p className="mt-1 text-[0.72rem] text-muted">{formatRelativeTime(notification.createdAt)}</p>
      </div>
    </div>
  );
}
