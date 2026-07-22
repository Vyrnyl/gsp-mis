'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';

import { ChevronDownIcon } from '@/shared/components/icons';
import { useFieldContext } from '@/shared/components/ui/form-field';
import { CONTROL_CLASSES, CONTROL_ERROR_CLASSES } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  /** Rendered as a disabled first option so the empty value reads as a prompt. */
  placeholder?: string;
}

/** Native select — registry §5. A searchable Combobox variant lands with Phase 1 filters. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, className, id, 'aria-describedby': describedBy, required, ...props },
  ref,
) {
  const field = useFieldContext();

  return (
    <div className="relative">
      <select
        ref={ref}
        id={id ?? field?.inputId}
        aria-describedby={describedBy ?? field?.describedBy}
        aria-invalid={field?.hasError || undefined}
        required={required ?? field?.isRequired}
        className={cn(
          CONTROL_CLASSES,
          'appearance-none pr-10',
          field?.hasError && CONTROL_ERROR_CLASSES,
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </div>
  );
});
