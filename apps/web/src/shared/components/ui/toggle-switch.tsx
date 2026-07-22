'use client';

import { useId, type InputHTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

export interface ToggleSwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  /** Accessible name. Rendered visibly unless `hideLabel` is set. */
  label: string;
  hideLabel?: boolean;
}

/**
 * iOS-style toggle — registry §5/§8. Replaces `.toggle-switch` / `.slider`.
 *
 * Keeps the prototype's checkbox + sibling-slider pattern, but the checkbox is
 * only visually hidden (`sr-only`, not zero-sized) so it stays keyboard focusable,
 * and the focus ring is drawn on the track via `peer-focus-visible`.
 */
export function ToggleSwitch({
  label,
  hideLabel = false,
  className,
  id,
  ...props
}: ToggleSwitchProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <input
        id={inputId}
        type="checkbox"
        className="peer sr-only"
        aria-label={hideLabel ? label : undefined}
        {...props}
      />
      {/* Visual track. Empty on purpose — the accessible name comes from the
          visible label below, or from `aria-label` when the label is hidden. */}
      <label
        htmlFor={inputId}
        className={cn(
          'relative h-6 w-11 shrink-0 cursor-pointer rounded-full bg-[#ccc] transition',
          'peer-checked:bg-brand-green peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-green2 peer-focus-visible:ring-offset-2',
          'after:absolute after:bottom-[3px] after:left-[3px] after:size-[18px] after:rounded-full',
          'after:bg-white after:transition after:content-[""] peer-checked:after:translate-x-5',
        )}
      />
      {hideLabel ? null : (
        <label htmlFor={inputId} className="cursor-pointer text-[0.92rem] text-ink">
          {label}
        </label>
      )}
    </div>
  );
}
