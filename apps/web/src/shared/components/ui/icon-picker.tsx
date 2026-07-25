'use client';

import { useId } from 'react';

import type { IconType } from '@/shared/components/icons';
import { cn } from '@/shared/utils/cn';

export interface IconPickerOption {
  /** Persisted value — a semantic key, never a `react-icons` component name. */
  value: string;
  icon: IconType;
  /** Accessible name for this swatch; the visible "label" is the glyph itself. */
  label: string;
}

export interface IconPickerProps {
  options: IconPickerOption[];
  value: string;
  onChange: (value: string) => void;
  /** Visible group label — rendered as the fieldset's `<legend>`. */
  legend: string;
  hint?: string;
  className?: string;
}

/**
 * Grid of icon swatches backed by real `sr-only` radio inputs — same technique as
 * auth's `RoleSelector` and 3.2's `ReportTypeSelector`, so arrow-key navigation and
 * screen-reader semantics come for free instead of being rebuilt on `<div onClick>`.
 *
 * Not wrapped in `FormField` by its callers, and deliberately so: `FormField` renders
 * a single `htmlFor` label, which would dangle over a radio group. `<fieldset>` +
 * `<legend>` is the correct grouping, so this component owns its own label and hint.
 *
 * Deliberately generic — it takes its options rather than importing a specific icon
 * set, so a second consumer can reuse it without a fork. Selected state is the green
 * fill from `RoleSelector`; never white-on-gold, which fails WCAG AA (ui-rules.md §9).
 */
export function IconPicker({ options, value, onChange, legend, hint, className }: IconPickerProps) {
  const name = useId();
  const hintId = `${name}-hint`;

  return (
    <fieldset className={cn('mb-4 border-0 p-0', className)}>
      <legend className="mb-1.5 block text-[0.85rem] font-semibold text-ink-soft">{legend}</legend>

      <div className="flex flex-wrap gap-2" aria-describedby={hint ? hintId : undefined}>
        {options.map((option) => {
          const inputId = `${name}-${option.value}`;
          const Icon = option.icon;

          return (
            <div key={option.value}>
              <input
                type="radio"
                id={inputId}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <label
                htmlFor={inputId}
                title={option.label}
                className={cn(
                  'flex size-11 cursor-pointer items-center justify-center rounded-[10px] border-2 border-hairline',
                  'text-lg text-muted transition',
                  'hover:border-brand-green2 hover:text-brand-green',
                  'peer-checked:border-brand-green peer-checked:bg-brand-green3 peer-checked:text-brand-green',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-green2 peer-focus-visible:ring-offset-2',
                )}
              >
                <Icon aria-hidden />
                <span className="sr-only">{option.label}</span>
              </label>
            </div>
          );
        })}
      </div>

      {hint ? (
        <p id={hintId} className="mt-1.5 text-[0.8rem] text-muted">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}
