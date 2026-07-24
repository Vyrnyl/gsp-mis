'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Input, Modal } from '@/shared/components/ui';

import { EMPTY_EXPENSE_FORM_VALUES } from '../constants';
import type { ExpenseFormValues } from '../types';

export interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
}

type FieldErrors = Partial<Record<keyof ExpenseFormValues, string>>;

export function ExpenseFormModal({ isOpen, onClose, onSubmit }: ExpenseFormModalProps) {
  const [values, setValues] = useState<ExpenseFormValues>(EMPTY_EXPENSE_FORM_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(EMPTY_EXPENSE_FORM_VALUES);
      setSubmitAttempted(false);
      setSubmitError(null);
      // `handleSubmit` only clears this on failure — a successful submit closes the
      // modal without resetting it, so a stale `true` would permanently disable
      // Cancel/Record the next time this same modal instance reopens.
      setIsSubmitting(false);
    }
  }, [isOpen]);

  function set<K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const errors: FieldErrors = submitAttempted
    ? {
        description: values.description.trim() ? undefined : 'Description is required.',
        amount: values.amount !== undefined && values.amount > 0 ? undefined : 'Enter an amount greater than 0.',
        expenseDate: values.expenseDate ? undefined : 'Expense date is required.',
      }
    : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    const hasError =
      !values.description.trim() || !values.amount || values.amount <= 0 || !values.expenseDate;
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
      title="Record Expense"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="expense-form" isLoading={isSubmitting}>
            Record Expense
          </Button>
        </>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        <FormField label="Description" required error={errors.description}>
          <Input value={values.description} onChange={(event) => set('description', event.target.value)} />
        </FormField>

        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormField label="Amount (₱)" required error={errors.amount}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={values.amount ?? ''}
              onChange={(event) => set('amount', event.target.value ? Number(event.target.value) : undefined)}
            />
          </FormField>
          <FormField label="Expense Date" required error={errors.expenseDate}>
            <Input type="date" value={values.expenseDate} onChange={(event) => set('expenseDate', event.target.value)} />
          </FormField>
        </div>

        <FormField label="Category" hint="Optional">
          <Input value={values.category} onChange={(event) => set('category', event.target.value)} />
        </FormField>
      </form>
    </Modal>
  );
}
