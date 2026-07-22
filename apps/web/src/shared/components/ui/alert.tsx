import type { ReactNode } from 'react';

import {
  AlertIcon,
  InfoIcon,
  SuccessIcon,
  WarningIcon,
  type IconType,
} from '@/shared/components/icons';
import { cn } from '@/shared/utils/cn';

export type AlertTone = 'error' | 'success' | 'info' | 'warning';

const TONE_CLASSES: Record<AlertTone, string> = {
  error: 'bg-status-danger-bg text-status-danger-fg border-status-danger-border',
  success: 'bg-status-success-bg text-status-success-fg border-status-success-border',
  info: 'bg-status-info-bg text-status-info-fg border-status-info-fg/20',
  warning: 'bg-status-warning-bg text-status-warning-fg border-status-warning-fg/20',
};

const TONE_ICONS: Record<AlertTone, IconType> = {
  error: AlertIcon,
  success: SuccessIcon,
  info: InfoIcon,
  warning: WarningIcon,
};

export interface AlertProps {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
  /**
   * Announce the alert to screen readers when it appears (ui-rules.md §9 live regions).
   * Use for validation/auth failures rendered in response to a user action.
   */
  live?: boolean;
}

/**
 * Inline banner for form and auth messages — registry §7. Replaces `.alert`,
 * `.alert-error`, `.alert-success`.
 *
 * This is *not* the component for a failed data fetch — use `ErrorState`, which
 * carries a retry action.
 */
export function Alert({ tone = 'error', children, className, live = true }: AlertProps) {
  const Icon = TONE_ICONS[tone];

  return (
    <div
      role={live ? 'alert' : undefined}
      className={cn(
        'mb-3 flex items-start gap-2 rounded-control border px-3.5 py-2.5 text-[0.88rem]',
        TONE_CLASSES[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
