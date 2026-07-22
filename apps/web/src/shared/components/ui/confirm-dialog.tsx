'use client';

import type { ReactNode } from 'react';

import { WarningIcon } from '@/shared/components/icons';
import { Button, type ButtonVariant } from '@/shared/components/ui/button';
import { Modal } from '@/shared/components/ui/modal';

export type ConfirmTone = 'danger' | 'warning' | 'default';

const TONE: Record<ConfirmTone, { button: ButtonVariant; iconWrap: string; icon: string }> = {
  danger: { button: 'red', iconWrap: 'bg-status-danger-bg', icon: 'text-brand-red' },
  warning: { button: 'gold', iconWrap: 'bg-status-warning-bg', icon: 'text-status-warning-fg' },
  default: { button: 'green', iconWrap: 'bg-brand-green3', icon: 'text-brand-green' },
};

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  /** What will happen, in plain words. Name the record being acted on. */
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation dialog for destructive actions — registry §9.
 *
 * Required by ui-rules.md §10: delete, archive and reject must confirm rather than
 * firing from a bare button. Built on `Modal`, so it inherits the focus trap.
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const toneClasses = TONE[tone];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      dismissible={!isConfirming}
      footer={
        <>
          <Button variant="gray" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button variant={toneClasses.button} onClick={onConfirm} isLoading={isConfirming}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${toneClasses.iconWrap}`}
        >
          <WarningIcon className={`text-lg ${toneClasses.icon}`} aria-hidden />
        </span>
        <div className="text-[0.92rem] leading-relaxed text-ink-soft">{description}</div>
      </div>
    </Modal>
  );
}
