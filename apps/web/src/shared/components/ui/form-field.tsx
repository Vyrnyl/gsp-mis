'use client';

import { createContext, useContext, useId, type ReactNode } from 'react';

import { AlertIcon } from '@/shared/components/icons';
import { cn } from '@/shared/utils/cn';

interface FieldContextValue {
  inputId: string;
  describedBy: string | undefined;
  hasError: boolean;
  isRequired: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Read the surrounding `FormField`'s wiring. Inputs use this to pick up `id`,
 * `aria-describedby` and error state without the caller repeating them.
 */
export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}

export interface FormFieldProps {
  label: ReactNode;
  children: ReactNode;
  /** Field-level validation message. Presence switches the field into its error state. */
  error?: string;
  /** Helper text shown under the control when there is no error. */
  hint?: string;
  required?: boolean;
  className?: string;
}

/**
 * Label + control + error/hint wrapper — registry §9.
 *
 * Required by ui-rules.md §10: the prototype has no form-level validation display
 * at all. This enforces the label↔input association (`htmlFor`/`id`) and gives the
 * both-sides validation rule somewhere consistent to render.
 */
export function FormField({
  label,
  children,
  error,
  hint,
  required = false,
  className,
}: FormFieldProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <FieldContext.Provider
      value={{ inputId, describedBy, hasError: Boolean(error), isRequired: required }}
    >
      <div className={cn('mb-4', className)}>
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-[0.85rem] font-semibold text-ink-soft"
        >
          {label}
          {required ? (
            <span className="ml-1 text-brand-red" aria-hidden>
              *
            </span>
          ) : null}
        </label>

        {children}

        {error ? (
          <p id={errorId} className="mt-1.5 flex items-center gap-1 text-[0.8rem] text-brand-red">
            <AlertIcon className="shrink-0" aria-hidden />
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="mt-1.5 text-[0.8rem] text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}
