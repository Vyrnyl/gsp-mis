import type { ReactNode } from 'react';

import { EmptyIcon, type IconType } from '@/shared/components/icons';
import { cn } from '@/shared/utils/cn';

export interface EmptyStateProps {
  title: string;
  /** One line on why it is empty and what to do about it. */
  description?: string;
  icon?: IconType;
  /** Primary action — e.g. "Register the first member". */
  action?: ReactNode;
  className?: string;
}

/**
 * Empty state — registry §9.
 *
 * Required by the Definition of Done: every list and table needs one. The
 * prototype has nine tables and zero empty states (ui-rules.md §10).
 */
export function EmptyState({
  title,
  description,
  icon: Icon = EmptyIcon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}
    >
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-brand-green3">
        <Icon className="text-2xl text-brand-green" aria-hidden />
      </span>
      <h3 className="text-[1.05rem] font-bold text-ink">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[0.88rem] leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
