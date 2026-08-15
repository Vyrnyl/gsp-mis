'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Input, Modal, Select } from '@/shared/components/ui';

import { EMPTY_SCHOOL_FORM_VALUES } from '../constants';
import type { Council, SchoolFormValues } from '../types';

export interface SchoolFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValues?: SchoolFormValues;
  councils: Council[];
  onClose: () => void;
  onSubmit: (values: SchoolFormValues) => Promise<void>;
}

type FieldErrors = Partial<Record<'name' | 'councilId', string>>;

export function SchoolFormModal({ isOpen, mode, initialValues, councils, onClose, onSubmit }: SchoolFormModalProps) {
  const [values, setValues] = useState<SchoolFormValues>(initialValues ?? EMPTY_SCHOOL_FORM_VALUES);
  const [snapshot, setSnapshot] = useState<SchoolFormValues>(initialValues ?? EMPTY_SCHOOL_FORM_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * Resets only on the closed→open transition, not on every re-render while the modal
   * stays open — same fix as `troop-form-modal.tsx` (see 1.6's notes on the
   * reset-`useEffect`-keyed-on-a-fresh-object bug).
   */
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      const resetValues = initialValues ?? EMPTY_SCHOOL_FORM_VALUES;
      setValues(resetValues);
      setSnapshot(resetValues);
      setSubmitAttempted(false);
      setSubmitError(null);
      setIsSubmitting(false);
    }
    wasOpen.current = isOpen;
  }, [isOpen, initialValues]);

  const isDirty = JSON.stringify(values) !== JSON.stringify(snapshot);
  const councilOptions = councils.map((council) => ({ value: council.id, label: council.name }));

  const errors: FieldErrors = submitAttempted
    ? {
        name: values.name.trim() ? undefined : 'School name is required.',
        councilId: values.councilId ? undefined : 'Council is required.',
      }
    : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    const hasError = !values.name.trim() || !values.councilId;
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
      title={mode === 'create' ? 'Add School' : 'Edit School'}
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="school-form" isLoading={isSubmitting} disabled={!isDirty || isSubmitting}>
            {mode === 'create' ? 'Add School' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form id="school-form" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        <FormField label="School Name" required error={errors.name} hint="e.g. Catanduanes State University (CATSU)">
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
      </form>
    </Modal>
  );
}
