'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

import { CloseIcon, SearchIcon } from '@/shared/components/icons';
import { cn } from '@/shared/utils/cn';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Accessible name. Always required — a bare magnifier is not a label. */
  label: string;
  /** Shows a clear button when there is a value. */
  onClear?: () => void;
}

/**
 * Standardised search field — registry §9.
 *
 * The prototype repeats an ad hoc search input with inline styles in several
 * places; this is the single version, with a real label and a clear affordance.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { label, onClear, className, value, placeholder = 'Search…', ...props },
  ref,
) {
  const hasValue = typeof value === 'string' && value.length > 0;

  return (
    <div className={cn('relative', className)}>
      <SearchIcon
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        ref={ref}
        type="search"
        aria-label={label}
        value={value}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-control border-[1.5px] border-hairline bg-surface py-2 pl-9 text-[0.88rem]',
          'text-ink transition placeholder:text-muted focus:border-brand-green focus:outline-none focus:shadow-field',
          hasValue && onClear ? 'pr-9' : 'pr-3.5',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
        {...props}
      />
      {hasValue && onClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear ${label.toLowerCase()}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted transition hover:bg-hairline-subtle hover:text-ink"
        >
          <CloseIcon aria-hidden />
        </button>
      ) : null}
    </div>
  );
});
