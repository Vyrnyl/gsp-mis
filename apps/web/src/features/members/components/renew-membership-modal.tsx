'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { Button, FormField, Input, Modal } from '@/shared/components/ui';

import { MembersRequestError } from '../services/members.service';
import type { RenewMembershipValues } from '../types';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function oneYearFrom(dateIso: string): string {
  const date = new Date(dateIso);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

export interface RenewMembershipModalProps {
  isOpen: boolean;
  memberName: string;
  onClose: () => void;
  onSubmit: (values: RenewMembershipValues) => Promise<void>;
}

/**
 * Writes a new `memberships` term rather than mutating the current one, per
 * database-design.md §3.2 — history stays intact.
 */
export function RenewMembershipModal({ isOpen, memberName, onClose, onSubmit }: RenewMembershipModalProps) {
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(oneYearFrom(todayIso()));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const start = todayIso();
      setStartDate(start);
      setEndDate(oneYearFrom(start));
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!startDate || !endDate) {
      setError('Both dates are required.');
      return;
    }
    if (endDate <= startDate) {
      setError('End date must be after the start date.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ startDate, endDate });
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof MembersRequestError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Renew Membership"
      size="sm"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="renew-membership-form" isLoading={isSubmitting}>
            Renew
          </Button>
        </>
      }
    >
      <p className="mb-4 text-[0.88rem] text-muted">
        New term for <strong className="text-ink">{memberName}</strong>. This adds a new membership
        record rather than changing the current one.
      </p>
      <form id="renew-membership-form" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormField label="Start Date" required>
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </FormField>
          <FormField label="End Date" required error={error ?? undefined}>
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
