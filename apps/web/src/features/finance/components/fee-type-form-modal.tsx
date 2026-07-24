'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Input, Modal, Textarea } from '@/shared/components/ui';

import { EMPTY_FEE_TYPE_FORM_VALUES } from '../constants';
import type { FeeTypeFormValues } from '../types';

export interface FeeTypeFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValues?: FeeTypeFormValues;
  onClose: () => void;
  onSubmit: (values: FeeTypeFormValues) => Promise<void>;
}

type FieldErrors = Partial<Record<keyof FeeTypeFormValues, string>>;

export function FeeTypeFormModal({ isOpen, mode, initialValues, onClose, onSubmit }: FeeTypeFormModalProps) {
  const [values, setValues] = useState<FeeTypeFormValues>(initialValues ?? EMPTY_FEE_TYPE_FORM_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(initialValues ?? EMPTY_FEE_TYPE_FORM_VALUES);
      setSubmitAttempted(false);
      setSubmitError(null);
      // `handleSubmit` only clears this on failure — a successful submit closes the
      // modal without resetting it, so a stale `true` would permanently disable
      // Cancel/Save the next time this same modal instance reopens.
      setIsSubmitting(false);
    }
  }, [isOpen, initialValues]);

  function set<K extends keyof FeeTypeFormValues>(key: K, value: FeeTypeFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const errors: FieldErrors = submitAttempted
    ? {
        name: values.name.trim() ? undefined : 'Name is required.',
        amount: values.amount !== undefined && values.amount > 0 ? undefined : 'Enter an amount greater than 0.',
      }
    : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    const hasError = !values.name.trim() || !values.amount || values.amount <= 0;
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
      title={mode === 'create' ? 'Add Fee Type' : 'Edit Fee Type'}
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="fee-type-form" isLoading={isSubmitting}>
            {mode === 'create' ? 'Add Fee Type' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form id="fee-type-form" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        <FormField label="Name" required error={errors.name}>
          <Input value={values.name} onChange={(event) => set('name', event.target.value)} />
        </FormField>

        <FormField label="Amount (₱)" required error={errors.amount}>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={values.amount ?? ''}
            onChange={(event) => set('amount', event.target.value ? Number(event.target.value) : undefined)}
          />
        </FormField>

        <FormField label="Description" hint="Optional">
          <Textarea rows={3} value={values.description} onChange={(event) => set('description', event.target.value)} />
        </FormField>
      </form>
    </Modal>
  );
}
