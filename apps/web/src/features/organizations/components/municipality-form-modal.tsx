'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Input, Modal, Select } from '@/shared/components/ui';

import { EMPTY_MUNICIPALITY_FORM_VALUES } from '../constants';
import type { Council, MunicipalityFormValues } from '../types';

export interface MunicipalityFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValues?: MunicipalityFormValues;
  councils: Council[];
  onClose: () => void;
  onSubmit: (values: MunicipalityFormValues) => Promise<void>;
}

type FieldErrors = Partial<Record<'name' | 'councilId', string>>;

export function MunicipalityFormModal({
  isOpen,
  mode,
  initialValues,
  councils,
  onClose,
  onSubmit,
}: MunicipalityFormModalProps) {
  const [values, setValues] = useState<MunicipalityFormValues>(
    initialValues ?? EMPTY_MUNICIPALITY_FORM_VALUES,
  );
  const [snapshot, setSnapshot] = useState<MunicipalityFormValues>(
    initialValues ?? EMPTY_MUNICIPALITY_FORM_VALUES,
  );
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /** Resets only on the closed→open transition — same fix as `school-form-modal.tsx`. */
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      const resetValues = initialValues ?? EMPTY_MUNICIPALITY_FORM_VALUES;
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
        name: values.name.trim() ? undefined : 'Municipality name is required.',
        councilId: values.councilId ? undefined : 'Council is required.',
      }
    : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    if (!values.name.trim() || !values.councilId) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Add Municipality' : 'Edit Municipality'}
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="municipality-form"
            isLoading={isSubmitting}
            disabled={!isDirty || isSubmitting}
          >
            {mode === 'create' ? 'Add Municipality' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form id="municipality-form" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        <FormField label="Municipality Name" required error={errors.name} hint="e.g. Virac">
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
            onChange={(event) =>
              setValues((current) => ({ ...current, councilId: event.target.value }))
            }
          />
        </FormField>
      </form>
    </Modal>
  );
}
