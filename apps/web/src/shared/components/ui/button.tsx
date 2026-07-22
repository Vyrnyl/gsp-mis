'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { SpinnerIcon } from '@/shared/components/icons';
import { cn } from '@/shared/utils/cn';

export type ButtonVariant = 'green' | 'outline' | 'red' | 'gold' | 'blue' | 'gray' | 'primary';
export type ButtonSize = 'sm' | 'md';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  green: 'bg-brand-green text-white hover:bg-brand-green-hover',
  outline: 'border-[1.5px] border-brand-green bg-surface text-brand-green hover:bg-brand-green3',
  red: 'bg-brand-red text-white hover:bg-brand-red-hover',
  // ui-rules.md §9: white on --gold is 2.30:1 and fails AA. The gold button uses the
  // AA-safe `gold-ink` (#8a7500, 4.54:1). Decorative gold stays for borders/fills only.
  gold: 'bg-brand-gold-ink text-white hover:bg-brand-gold-ink-hover',
  blue: 'bg-brand-blue text-white hover:bg-brand-blue-hover',
  gray: 'bg-subtle text-ink-subtle hover:bg-subtle-hover',
  primary:
    'w-full justify-center rounded-[10px] bg-brand-gradient py-[13px] text-base font-bold text-white ' +
    'hover:-translate-y-px hover:shadow-[0_4px_15px_rgba(46,139,87,0.4)]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[0.8rem]',
  md: 'px-[18px] py-[9px] text-[0.88rem]',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a spinner, disables the button, and marks it `aria-busy`. */
  isLoading?: boolean;
  /** Icon rendered before the label. Suppressed while loading. */
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

/**
 * Base button — registry §6. Covers `.btn`, `.btn-sm` and every `.btn-*` colour
 * variant plus the full-width auth `.btn-primary`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'green',
    size = 'md',
    isLoading = false,
    leadingIcon,
    trailingIcon,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  const isPrimary = variant === 'primary';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled ?? isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-control font-semibold transition',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
        !isPrimary && SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <SpinnerIcon className="animate-spin" aria-hidden />
      ) : (
        leadingIcon && <span aria-hidden>{leadingIcon}</span>
      )}
      {children}
      {!isLoading && trailingIcon && <span aria-hidden>{trailingIcon}</span>}
    </button>
  );
});
