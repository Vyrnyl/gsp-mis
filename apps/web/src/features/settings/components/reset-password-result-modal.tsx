'use client';

import { useState } from 'react';

import { CheckIcon, DocumentIcon } from '@/shared/components/icons';
import { Alert, Button, Modal } from '@/shared/components/ui';

export interface ResetPasswordResultModalProps {
  isOpen: boolean;
  userName: string | null;
  temporaryPassword: string | null;
  onClose: () => void;
}

/**
 * Shows the freshly generated temporary password exactly once. There is no
 * real email delivery yet (open decision #7, build-plan.md §7) — same
 * non-blocking gap 1.1's forgot-password left open — so the admin must relay it
 * to the user out of band, same as the prototype's "Resetting password for…" toast
 * implied but never actually delivered.
 */
export function ResetPasswordResultModal({ isOpen, userName, temporaryPassword, onClose }: ResetPasswordResultModalProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!temporaryPassword) return;
    await navigator.clipboard.writeText(temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Password Reset" footer={<Button onClick={onClose}>Done</Button>}>
      <Alert tone="success">
        A new temporary password was generated for <strong>{userName}</strong>.
      </Alert>
      <p className="mb-1.5 text-[0.85rem] font-semibold text-ink-soft">Temporary Password</p>
      <div className="mb-3 flex items-center gap-2 rounded-field border-[1.5px] border-hairline bg-subtle px-3.5 py-3">
        <code className="flex-1 break-all text-[0.95rem] font-semibold text-ink">{temporaryPassword}</code>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <CheckIcon aria-hidden /> : <DocumentIcon aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <p className="text-[0.8rem] text-muted">
        Share this with the user through a secure channel. It will not be shown again — the user should change it after
        logging in.
      </p>
    </Modal>
  );
}
