'use client';

import { AlertIcon, RetryIcon } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

export interface ErrorStateProps {
  title?: string;
  /** What failed, in user terms. Avoid raw exception text. */
  description?: string;
  /** Wire this to a refetch. Omit only when there is genuinely nothing to retry. */
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  className?: string;
}

/**
 * Inline failure panel with a retry action — registry §9.
 *
 * Distinct from `Alert`: `Alert` carries form/validation messages, this covers a
 * failed read and owns the retry (ui-rules.md §10).
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this content. Check your connection and try again.',
  onRetry,
  retryLabel = 'Try again',
  isRetrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-status-danger-border',
        'bg-status-danger-bg/40 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-status-danger-bg">
        <AlertIcon className="text-2xl text-brand-red" aria-hidden />
      </span>
      <h3 className="text-[1.05rem] font-bold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[0.88rem] leading-relaxed text-muted">{description}</p>
      {onRetry ? (
        <Button
          variant="outline"
          className="mt-5"
          onClick={onRetry}
          isLoading={isRetrying}
          leadingIcon={<RetryIcon aria-hidden />}
        >
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
