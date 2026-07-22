'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { CloseIcon } from '@/shared/components/icons';
import { useBodyScrollLock } from '@/shared/hooks/use-body-scroll-lock';
import { useFocusTrap } from '@/shared/hooks/use-focus-trap';
import { cn } from '@/shared/utils/cn';

export type ModalSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-[420px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[760px]',
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Right-aligned footer actions. Omit for a body-only modal. */
  footer?: ReactNode;
  size?: ModalSize;
  /** Set false for flows that must not be dismissed by backdrop click or Escape. */
  dismissible?: boolean;
  className?: string;
}

/**
 * Modal dialog — registry §7. Replaces `.modal-overlay` / `.modal` / `.modal-*`.
 *
 * Improves on the prototype: renders in a portal, traps focus, restores focus on
 * close, closes on Escape and backdrop click, locks body scroll, and carries real
 * `role="dialog"` / `aria-modal` / `aria-labelledby` wiring (ui-rules.md §9).
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  dismissible = true,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useBodyScrollLock(isOpen);
  useFocusTrap(dialogRef, isOpen);

  useEffect(() => {
    if (!isOpen || !dismissible) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, dismissible, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex animate-fade-in items-center justify-center bg-black/50 p-5 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'max-h-[90vh] w-full overflow-y-auto rounded-modal bg-surface shadow-overlay',
          SIZE_CLASSES[size],
          className,
        )}
      >
        <div className="sticky top-0 z-[1] flex items-center justify-between gap-4 border-b border-hairline-subtle bg-surface px-6 pb-[18px] pt-[22px]">
          <h2 id={titleId} className="text-[1.1rem] font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-muted transition hover:bg-hairline-subtle hover:text-ink"
          >
            <CloseIcon className="text-[1.3rem]" aria-hidden />
          </button>
        </div>

        <div className="px-6 py-[22px]">{children}</div>

        {footer ? (
          <div className="flex flex-wrap justify-end gap-2.5 border-t border-hairline-subtle px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
