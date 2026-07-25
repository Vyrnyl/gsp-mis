'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Input, Modal, Select } from '@/shared/components/ui';

import { EMPTY_TROOP_FORM_VALUES } from '../constants';
import type { Council, Troop, TroopFormValues, TroopLeaderOption } from '../types';

export interface TroopFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValues?: TroopFormValues;
  councils: Council[];
  leaderOptions: TroopLeaderOption[];
  /** All troops, used to exclude leaders already assigned elsewhere — a leader can lead only one troop. */
  troops: Troop[];
  /** The troop being edited, if any — its own current leader stays selectable. */
  currentTroopId?: string;
  onClose: () => void;
  onSubmit: (values: TroopFormValues) => Promise<void>;
}

type FieldErrors = Partial<Record<'troopCode' | 'name' | 'councilId', string>>;

export function TroopFormModal({
  isOpen,
  mode,
  initialValues,
  councils,
  leaderOptions,
  troops,
  currentTroopId,
  onClose,
  onSubmit,
}: TroopFormModalProps) {
  const [values, setValues] = useState<TroopFormValues>(initialValues ?? EMPTY_TROOP_FORM_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(initialValues ?? EMPTY_TROOP_FORM_VALUES);
      setSubmitAttempted(false);
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialValues]);

  const councilOptions = councils.map((council) => ({ value: council.id, label: council.name }));
  const leadersAssignedElsewhere = new Set(
    troops.filter((troop) => troop.leaderId && troop.id !== currentTroopId).map((troop) => troop.leaderId),
  );
  const availableLeaderOptions = leaderOptions.filter((leader) => !leadersAssignedElsewhere.has(leader.id));
  const leaderSelectOptions = [
    { value: '', label: 'No Leader Assigned' },
    ...availableLeaderOptions.map((leader) => ({ value: leader.id, label: `${leader.fullName} (${leader.email})` })),
  ];

  const errors: FieldErrors = submitAttempted
    ? {
        troopCode: values.troopCode.trim() ? undefined : 'Troop code is required.',
        name: values.name.trim() ? undefined : 'Troop name is required.',
        councilId: values.councilId ? undefined : 'Council is required.',
      }
    : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    const hasError = !values.troopCode.trim() || !values.name.trim() || !values.councilId;
    if (hasError) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Add Troop' : 'Edit Troop'}
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="troop-form" isLoading={isSubmitting}>
            {mode === 'create' ? 'Add Troop' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form id="troop-form" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        <FormField label="Troop Code" required error={errors.troopCode} hint="e.g. CAT-VIR-012">
          <Input
            value={values.troopCode}
            disabled={mode === 'edit'}
            onChange={(event) => setValues((current) => ({ ...current, troopCode: event.target.value }))}
          />
        </FormField>

        <FormField label="Troop Name" required error={errors.name}>
          <Input
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          />
        </FormField>

        <FormField label="Council" required error={errors.councilId}>
          <Select
            options={councilOptions}
            placeholder="Select council"
            value={values.councilId}
            onChange={(event) => setValues((current) => ({ ...current, councilId: event.target.value }))}
          />
        </FormField>

        <FormField label="Troop Leader" hint="Only unassigned Troop Leaders appear here — each leader can lead just one troop">
          <Select
            options={leaderSelectOptions}
            value={values.leaderId}
            onChange={(event) => setValues((current) => ({ ...current, leaderId: event.target.value }))}
          />
        </FormField>
      </form>
    </Modal>
  );
}
