'use client';

import { useState } from 'react';

import { ApprovalIcon, DeleteIcon, resolveBadgeCategoryIcon } from '@/shared/components/icons';
import { Button, ConfirmDialog, Modal } from '@/shared/components/ui';

import type { MemberBadgeRecord, MemberProgressSummary } from '../types';
import { MemberBadgeStatusBadge } from './member-badge-status-badge';

export interface MemberProgressDetailModalProps {
  member: MemberProgressSummary | null;
  canVerify: boolean;
  verifyingId: string | null;
  onVerify: (memberBadgeId: string) => Promise<void>;
  onRemove: (memberBadgeId: string) => Promise<void>;
  onClose: () => void;
}

function toDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Read-only per-member badge list, plus the Admin-only actions: Verify on `earned` rows and
 * Remove on every row. `canVerify` is the Admin check for both.
 */
export function MemberProgressDetailModal({
  member,
  canVerify,
  verifyingId,
  onVerify,
  onRemove,
  onClose,
}: MemberProgressDetailModalProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<MemberBadgeRecord | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleVerify(memberBadgeId: string) {
    setLocalError(null);
    try {
      await onVerify(memberBadgeId);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Could not verify this badge. Please try again.',
      );
    }
  }

  async function handleConfirmRemove() {
    if (!removeTarget) return;
    setLocalError(null);
    setIsRemoving(true);
    try {
      await onRemove(removeTarget.id);
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : 'Could not remove this badge record. Please try again.',
      );
    } finally {
      setIsRemoving(false);
      setRemoveTarget(null);
    }
  }

  return (
    <>
      {/* Hidden while confirming, not stacked: Modal listens for Escape on `document`, so one
        keypress would otherwise close this list along with the dialog above it. */}
      <Modal
        isOpen={member !== null && removeTarget === null}
        onClose={onClose}
        title={member ? `${member.memberName}'s Badges` : 'Badges'}
        size="lg"
      >
        {member ? (
          <>
            {localError ? <p className="mb-3 text-[0.85rem] text-brand-red">{localError}</p> : null}
            {member.badges.length === 0 ? (
              <p className="py-6 text-center text-[0.9rem] text-muted">
                No badges recorded for this member yet.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {member.badges.map((record) => {
                  const CategoryIcon = resolveBadgeCategoryIcon(record.badgeCategoryIcon);

                  return (
                    <li
                      key={record.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-field border border-hairline-subtle p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-status-warning-bg text-brand-gold-ink">
                          <CategoryIcon className="text-[0.95rem]" aria-hidden />
                        </span>
                        <div>
                          <p className="text-[0.9rem] font-semibold text-ink">{record.badgeName}</p>
                          <p className="text-[0.78rem] text-muted">
                            {record.badgeCategoryName ?? 'Uncategorized'}
                            {record.earnedAt ? ` · Earned ${toDisplayDate(record.earnedAt)}` : ''}
                            {record.verifiedByName ? ` · Verified by ${record.verifiedByName}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MemberBadgeStatusBadge status={record.status} />
                        {canVerify && record.status === 'earned' ? (
                          <Button
                            size="sm"
                            variant="gold"
                            leadingIcon={<ApprovalIcon aria-hidden />}
                            isLoading={verifyingId === record.id}
                            onClick={() => handleVerify(record.id)}
                          >
                            Verify
                          </Button>
                        ) : null}
                        {canVerify ? (
                          <Button
                            size="sm"
                            variant="outline"
                            leadingIcon={<DeleteIcon aria-hidden />}
                            aria-label={`Remove ${record.badgeName}`}
                            onClick={() => setRemoveTarget(record)}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={removeTarget !== null}
        title="Remove this badge record?"
        description={
          removeTarget
            ? `"${removeTarget.badgeName}" will be removed from ${removeTarget.memberName}'s record, including its earned date and any verification. You can record the badge again later.`
            : ''
        }
        tone="danger"
        confirmLabel="Remove Record"
        isConfirming={isRemoving}
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
}
