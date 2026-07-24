'use client';

import { useState } from 'react';

import { ApprovalIcon } from '@/shared/components/icons';
import { Button, Modal } from '@/shared/components/ui';

import type { MemberProgressSummary } from '../types';
import { MemberBadgeStatusBadge } from './member-badge-status-badge';

export interface MemberProgressDetailModalProps {
  member: MemberProgressSummary | null;
  canVerify: boolean;
  verifyingId: string | null;
  onVerify: (memberBadgeId: string) => Promise<void>;
  onClose: () => void;
}

function toDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Read-only per-member badge list, plus the Admin-only Verify action on `earned` rows. */
export function MemberProgressDetailModal({
  member,
  canVerify,
  verifyingId,
  onVerify,
  onClose,
}: MemberProgressDetailModalProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleVerify(memberBadgeId: string) {
    setLocalError(null);
    try {
      await onVerify(memberBadgeId);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not verify this badge. Please try again.');
    }
  }

  return (
    <Modal isOpen={member !== null} onClose={onClose} title={member ? `${member.memberName}'s Badges` : 'Badges'} size="lg">
      {member ? (
        <>
          {localError ? <p className="mb-3 text-[0.85rem] text-brand-red">{localError}</p> : null}
          {member.badges.length === 0 ? (
            <p className="py-6 text-center text-[0.9rem] text-muted">No badges recorded for this member yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {member.badges.map((record) => (
                <li
                  key={record.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-field border border-hairline-subtle p-3"
                >
                  <div>
                    <p className="text-[0.9rem] font-semibold text-ink">{record.badgeName}</p>
                    <p className="text-[0.78rem] text-muted">
                      {record.badgeCategoryName ?? 'Uncategorized'}
                      {record.earnedAt ? ` · Earned ${toDisplayDate(record.earnedAt)}` : ''}
                      {record.verifiedByName ? ` · Verified by ${record.verifiedByName}` : ''}
                    </p>
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
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </Modal>
  );
}
