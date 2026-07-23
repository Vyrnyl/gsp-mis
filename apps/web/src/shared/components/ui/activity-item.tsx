import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

export type ActivityDotTone = 'green' | 'gold' | 'blue' | 'red';

const DOT_TONE_CLASSES: Record<ActivityDotTone, string> = {
  green: 'bg-brand-green',
  gold: 'bg-brand-gold',
  blue: 'bg-brand-blue',
  red: 'bg-brand-red',
};

/** Small colored status dot — replaces `.activity-dot` + tone. Use as `ActivityItem`'s `leading`. */
export function ActivityDot({ tone, className }: { tone: ActivityDotTone; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('mt-[5px] size-2.5 shrink-0 rounded-full', DOT_TONE_CLASSES[tone], className)}
    />
  );
}

export interface ActivityItemProps {
  /** `ActivityDot` or an avatar (`TableAvatar`) — whatever the row needs to lead with. */
  leading: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  /** Right-aligned badge, percentage, etc. */
  trailing?: ReactNode;
  className?: string;
}

/**
 * Activity feed row — registry §3. Replaces `.activity-item` / `.activity-text` /
 * `.activity-time`. A parent list just stacks these; the last child drops its
 * divider automatically via `[&>*:last-child]:border-b-0` on the list wrapper, or
 * pass `className="border-b-0"` on the final item directly.
 */
export function ActivityItem({ leading, title, meta, trailing, className }: ActivityItemProps) {
  return (
    <div className={cn('flex items-center gap-3 border-b border-hairline-faint py-3', className)}>
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[0.88rem] text-ink-soft">{title}</div>
        {meta ? <div className="mt-0.5 text-[0.75rem] text-muted">{meta}</div> : null}
      </div>
      {trailing}
    </div>
  );
}
