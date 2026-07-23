'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Input, Modal, Textarea } from '@/shared/components/ui';

import { EMPTY_COUNCIL_FORM_VALUES } from '../constants';
import type { CouncilFormValues } from '../types';

export interface CouncilFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValues?: CouncilFormValues;
  onClose: () => void;
  onSubmit: (values: CouncilFormValues) => Promise<void>;
}

export function CouncilFormModal({ isOpen, mode, initialValues, onClose, onSubmit }: CouncilFormModalProps) {
  const [values, setValues] = useState<CouncilFormValues>(initialValues ?? EMPTY_COUNCIL_FORM_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(initialValues ?? EMPTY_COUNCIL_FORM_VALUES);
      setSubmitAttempted(false);
      setSubmitError(null);
    }
  }, [isOpen, initialValues]);

  const nameError = submitAttempted && !values.name.trim() ? 'Council name is required.' : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);
    if (!values.name.trim()) return;

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
      title={mode === 'create' ? 'Add Council' : 'Edit Council'}
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="council-form" isLoading={isSubmitting}>
            {mode === 'create' ? 'Add Council' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form id="council-form" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        <FormField label="Council Name" required error={nameError}>
          <Input
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          />
        </FormField>

        <FormField label="Description" hint="Optional">
          <Textarea
            rows={3}
            value={values.description}
            onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          />
        </FormField>
      </form>
    </Modal>
  );
}
