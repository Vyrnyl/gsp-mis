'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';

import { useFieldContext } from '@/shared/components/ui/form-field';
import { CONTROL_CLASSES, CONTROL_ERROR_CLASSES } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Multi-line input — registry §5. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, id, 'aria-describedby': describedBy, required, rows = 4, ...props },
  ref,
) {
  const field = useFieldContext();

  return (
    <textarea
      ref={ref}
      rows={rows}
      id={id ?? field?.inputId}
      aria-describedby={describedBy ?? field?.describedBy}
      aria-invalid={field?.hasError || undefined}
      required={required ?? field?.isRequired}
      className={cn(
        CONTROL_CLASSES,
        'resize-y',
        field?.hasError && CONTROL_ERROR_CLASSES,
        className,
      )}
      {...props}
    />
  );
});
