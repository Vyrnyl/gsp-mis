'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Input, Modal, Select, Textarea } from '@/shared/components/ui';

import { EMPTY_ACHIEVEMENT_FORM_VALUES } from '../constants';
import type { AchievementFormValues, MemberOption } from '../types';

export interface AchievementFormModalProps {
  isOpen: boolean;
  memberOptions: MemberOption[];
  onClose: () => void;
  onSubmit: (values: AchievementFormValues) => Promise<void>;
}

type FieldErrors = Partial<Record<'memberId' | 'achievementName' | 'achievedAt', string>>;

/** Troop Leader + Admin — "Update achievements" / "Track advancement" (project-overview.md). */
export function AchievementFormModal({ isOpen, memberOptions, onClose, onSubmit }: AchievementFormModalProps) {
  const [values, setValues] = useState<AchievementFormValues>(EMPTY_ACHIEVEMENT_FORM_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(EMPTY_ACHIEVEMENT_FORM_VALUES);
      setSubmitAttempted(false);
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  function set<K extends keyof AchievementFormValues>(key: K, value: AchievementFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const errors: FieldErrors = submitAttempted
    ? {
        memberId: values.memberId ? undefined : 'Select a member.',
        achievementName: values.achievementName.trim() ? undefined : 'Achievement name is required.',
        achievedAt: values.achievedAt ? undefined : 'Date achieved is required.',
      }
    : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    if (!values.memberId || !values.achievementName.trim() || !values.achievedAt) return;

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Achievement"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="achievement-form" isLoading={isSubmitting}>
            Save Achievement
          </Button>
        </>
      }
    >
      <form id="achievement-form" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        <FormField label="Member" required error={errors.memberId}>
          <Select
            options={memberSelectOptions}
            placeholder="Select a member"
            value={values.memberId}
            onChange={(event) => set('memberId', event.target.value)}
            disabled={memberOptions.length === 0}
          />
        </FormField>

        <FormField label="Achievement" required error={errors.achievementName}>
          <Input
            value={values.achievementName}
            placeholder="e.g. Perfect Attendance — Q3 2026"
            onChange={(event) => set('achievementName', event.target.value)}
          />
        </FormField>

        <FormField label="Date Achieved" required error={errors.achievedAt}>
          <Input
            type="date"
            value={values.achievedAt}
            onChange={(event) => set('achievedAt', event.target.value)}
          />
        </FormField>

        <FormField label="Description" hint="Optional">
          <Textarea rows={3} value={values.description} onChange={(event) => set('description', event.target.value)} />
        </FormField>
      </form>
    </Modal>
  );
}
