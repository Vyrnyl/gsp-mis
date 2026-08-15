'use client';

import { useEffect, useState } from 'react';

import type { Member } from '@/features/members/types';
import { CheckIcon, RejectIcon } from '@/shared/components/icons';
import { Button, FormField, Modal, Textarea } from '@/shared/components/ui';

function toDisplayDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function toDisplayDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export interface ApprovalReviewModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onApprove: (memberId: string) => Promise<void>;
  onReject: (memberId: string, reason: string) => Promise<void>;
}

/**
 * Registration detail/review modal — build-plan.md §1.4. Read-only profile view
 * (same fields as 1.3's `MemberProfileView`) plus Approve / Reject actions. Reject
 * requires a reason, kept as one always-visible field rather than a second modal
 * so the reviewer can write it while still looking at the record.
 */
export function ApprovalReviewModal({ isOpen, member, onClose, onApprove, onReject }: ApprovalReviewModalProps) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setReasonError(null);
      setSubmitting(null);
    }
  }, [isOpen, member?.id]);

  if (!member) return null;

  const fullName = `${member.firstName} ${member.middleName ? `${member.middleName} ` : ''}${member.lastName}`;
  const isBusy = submitting !== null;

  async function handleApprove() {
    if (!member) return;
    setSubmitting('approve');
    try {
      await onApprove(member.id);
    } finally {
      setSubmitting(null);
    }
  }

  async function handleReject() {
    if (!member) return;
    if (reason.trim().length < 5) {
      setReasonError('Give at least a short reason so the applicant knows what to fix.');
      return;
    }
    setReasonError(null);
    setSubmitting('reject');
    try {
      await onReject(member.id, reason.trim());
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Registration"
      size="lg"
      dismissible={!isBusy}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button
            variant="red"
            leadingIcon={<RejectIcon aria-hidden />}
            isLoading={submitting === 'reject'}
            disabled={isBusy}
            onClick={handleReject}
          >
            Reject
          </Button>
          <Button
            variant="green"
            leadingIcon={<CheckIcon aria-hidden />}
            isLoading={submitting === 'approve'}
            disabled={isBusy}
            onClick={handleApprove}
          >
            Approve
          </Button>
        </>
      }
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-ink">{fullName}</h3>
          <p className="mt-0.5 text-[0.85rem] text-muted">
            {member.memberType === 'scout' ? 'Scout' : 'Adult Leader'}
            {member.troop ? ` · ${member.troop.troopCode} — ${member.troop.name}` : ''}
          </p>
        </div>
        <p className="shrink-0 text-right text-[0.8rem] text-muted">
          Submitted
          <br />
          <span className="font-semibold text-ink-soft">{toDisplayDateTime(member.createdAt)}</span>
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <ReviewField label="Birthdate" value={toDisplayDate(member.birthDate)} />
        <ReviewField label="Gender" value={member.gender} className="capitalize" />
        <ReviewField label="Email" value={member.email ?? '—'} />
        <ReviewField label="Phone Number" value={member.phoneNumber ?? '—'} />
        <ReviewField label="Home Address" value={member.address ?? '—'} className="sm:col-span-2" />
        {member.memberType === 'scout' ? (
          <ReviewField label="Scout Level" value={member.scoutLevel?.name ?? '—'} />
        ) : null}
        <ReviewField label="School" value={member.school?.name ?? '—'} />
        <ReviewField label="Council" value={member.councilName ?? '—'} />
        <ReviewField label="Emergency Contact" value={member.emergencyContactName ?? '—'} />
        <ReviewField label="Emergency Phone" value={member.emergencyContactPhone ?? '—'} />
        {member.notes ? <ReviewField label="Notes" value={member.notes} className="sm:col-span-2" /> : null}
      </dl>

      <hr className="my-5 border-hairline-subtle" />

      <FormField
        label="Reason for rejection"
        hint="Only required if you reject this registration."
        error={reasonError ?? undefined}
      >
        <Textarea
          rows={3}
          value={reason}
          disabled={isBusy}
          onChange={(event) => {
            setReason(event.target.value);
            if (reasonError) setReasonError(null);
          }}
          placeholder="e.g. Missing troop confirmation, duplicate record, incomplete guardian details…"
        />
      </FormField>
    </Modal>
  );
}

function ReviewField({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.03em] text-ink-subtle">{label}</dt>
      <dd className="mt-1 text-[0.92rem] text-ink">{value}</dd>
    </div>
  );
}
