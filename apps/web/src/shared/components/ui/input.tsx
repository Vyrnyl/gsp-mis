'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';

import { EyeIcon, EyeOffIcon } from '@/shared/components/icons';
import { useFieldContext } from '@/shared/components/ui/form-field';
import { cn } from '@/shared/utils/cn';

/**
 * Shared control skin — inputs, selects and textareas all use it so they stay
 * visually identical. Green focus ring per ui-rules.md §6; the ring replaces the
 * removed outline rather than leaving nothing behind (§9).
 */
export const CONTROL_CLASSES =
  'w-full rounded-field border-[1.5px] border-hairline bg-surface px-3.5 py-[11px] text-[0.95rem] ' +
  'text-ink transition placeholder:text-muted focus:border-brand-green focus:outline-none ' +
  'focus:shadow-field disabled:cursor-not-allowed disabled:bg-hairline-faint disabled:text-muted';

export const CONTROL_ERROR_CLASSES =
  'border-brand-red focus:border-brand-red focus:shadow-[0_0_0_3px_rgba(192,57,43,0.12)]';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Text/email/number input — registry §5. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, id, 'aria-describedby': describedBy, required, ...props },
  ref,
) {
  const field = useFieldContext();

  return (
    <input
      ref={ref}
      id={id ?? field?.inputId}
      aria-describedby={describedBy ?? field?.describedBy}
      aria-invalid={field?.hasError || undefined}
      required={required ?? field?.isRequired}
      className={cn(CONTROL_CLASSES, field?.hasError && CONTROL_ERROR_CLASSES, className)}
      {...props}
    />
  );
});

export type PasswordInputProps = Omit<InputProps, 'type'>;

/**
 * Password input with a show/hide toggle — replaces `.toggle-eye`.
 *
 * The prototype's toggle is a bare emoji with no accessible name; this one is a
 * real button with `aria-label` and `aria-pressed`.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, ...props }, ref) {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={isVisible ? 'text' : 'password'}
          className={cn('pr-11', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setIsVisible((value) => !value)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted transition hover:text-ink"
        >
          {isVisible ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
        </button>
      </div>
    );
  },
);
