import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

export type BadgeTone = 'green' | 'red' | 'blue' | 'gold' | 'gray';

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: 'bg-status-success-bg text-status-success-fg',
  red: 'bg-status-danger-bg text-status-danger-fg',
  blue: 'bg-status-info-bg text-status-info-fg',
  // The `.badge-gold` pairing (#856404 on #fff3cd) passes AA — it is kept as-is.
  gold: 'bg-status-warning-bg text-status-warning-fg',
  gray: 'bg-status-neutral-bg text-status-neutral-fg',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
}

/** Status pill — registry §1. Replaces `.badge` + `.badge-*`. */
export function Badge({ tone = 'gray', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
