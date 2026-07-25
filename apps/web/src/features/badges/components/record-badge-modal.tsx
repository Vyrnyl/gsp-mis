'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { resolveBadgeCategoryIcon } from '@/shared/components/icons';
import { Alert, Button, FormField, Modal, Select } from '@/shared/components/ui';

import { EMPTY_RECORD_BADGE_FORM_VALUES, MEMBER_BADGE_STATUS_LABELS } from '../constants';
import type { BadgeCatalogItem, MemberOption, RecordBadgeFormValues } from '../types';

export interface RecordBadgeModalProps {
  isOpen: boolean;
  memberOptions: MemberOption[];
  badgeOptions: BadgeCatalogItem[];
  onClose: () => void;
  onSubmit: (values: RecordBadgeFormValues) => Promise<void>;
}

type FieldErrors = Partial<Record<'memberId' | 'badgeId', string>>;

/**
 * Troop Leader + Admin only — "Record earned badges" / "Update achievements" (project-overview.md,
 * Troop Leader's Badge Tracking section). Only ever writes `in_progress`/`earned`; moving a record
 * to `verified` is a separate Admin-only action on the Member Progress tab.
 */
export function RecordBadgeModal({ isOpen, memberOptions, badgeOptions, onClose, onSubmit }: RecordBadgeModalProps) {
  const [values, setValues] = useState<RecordBadgeFormValues>(EMPTY_RECORD_BADGE_FORM_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(EMPTY_RECORD_BADGE_FORM_VALUES);
      setSubmitAttempted(false);
      setSubmitError(null);
    }
  }, [isOpen]);

  function set<K extends keyof RecordBadgeFormValues>(key: K, value: RecordBadgeFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const errors: FieldErrors = submitAttempted
    ? {
        memberId: values.memberId ? undefined : 'Select a member.',
        badgeId: values.badgeId ? undefined : 'Select a badge.',
      }
    : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    if (!values.memberId || !values.badgeId) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  const memberSelectOptions = memberOptions.map((member) => ({
    value: member.id,
    label: member.troopName ? `${member.fullName} — ${member.troopName}` : member.fullName,
  }));
  const badgeSelectOptions = badgeOptions.map((badge) => ({ value: badge.id, label: badge.name }));
  const selectedBadge = badgeOptions.find((badge) => badge.id === values.badgeId) ?? null;
  const SelectedBadgeIcon = resolveBadgeCategoryIcon(selectedBadge?.categoryIcon);
  const statusOptions = (['in_progress', 'earned'] as const).map((status) => ({
    value: status,
    label: MEMBER_BADGE_STATUS_LABELS[status],
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Badge Progress"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="record-badge-form" isLoading={isSubmitting}>
            Save
          </Button>
        </>
      }
    >
      <form id="record-badge-form" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        {memberOptions.length === 0 ? (
          <Alert tone="info">No members are available to record a badge for.</Alert>
        ) : null}

        <FormField label="Member" required error={errors.memberId}>
          <Select
            options={memberSelectOptions}
            placeholder="Select a member"
            value={values.memberId}
            onChange={(event) => set('memberId', event.target.value)}
            disabled={memberOptions.length === 0}
          />
        </FormField>

        <FormField label="Badge" required error={errors.badgeId}>
          <div className="flex items-center gap-2.5">
            {/* Native <select> can't render an icon per option (Combobox is still `planned` in
                the registry) — this swatch is the icon feedback instead, updating with the pick. */}
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-status-warning-bg text-brand-gold-ink">
              <SelectedBadgeIcon className="text-[0.9rem]" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <Select
                options={badgeSelectOptions}
                placeholder="Select a badge"
                value={values.badgeId}
                onChange={(event) => set('badgeId', event.target.value)}
                disabled={badgeOptions.length === 0}
              />
            </div>
          </div>
        </FormField>

        <FormField label="Status" hint="Verification happens separately, after the badge is earned">
          <Select
            options={statusOptions}
            value={values.status}
            onChange={(event) => set('status', event.target.value as RecordBadgeFormValues['status'])}
          />
        </FormField>
      </form>
    </Modal>
  );
}
