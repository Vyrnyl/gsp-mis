'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { listEvents } from '@/features/events/services/events.service';
import { listSchools } from '@/features/organizations/services/organizations.service';
import { Alert, Button, FormField, Input, Modal, Select, type SelectOption } from '@/shared/components/ui';

import { EMPTY_EXPENSE_FORM_VALUES } from '../constants';
import { listExpenseCategories } from '../services/finance.service';
import type { ExpenseFormValues } from '../types';

/** Attribution is optional by design — a genuinely council-wide cost belongs to no
 * school or activity, and forcing a choice would record a guess as a fact. */
const NO_SCHOOL: SelectOption = { value: '', label: 'Council-wide (no school)' };
const NO_EVENT: SelectOption = { value: '', label: 'Not tied to an activity' };
const NO_CATEGORY: SelectOption = { value: '', label: 'Uncategorized' };

interface ExpenseFormOptions {
  categories: SelectOption[];
  schools: SelectOption[];
  events: SelectOption[];
}

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
  /** `null` while loading — the selects render disabled rather than flashing empty. */
  const [options, setOptions] = useState<ExpenseFormOptions | null>(null);

  // Loaded when the modal first opens rather than on mount: these three lists are only
  // needed here, and a closed modal should not cost three requests on every Finance
  // page view. A failure leaves the pickers disabled — description, amount and date
  // are all that is actually required, so recording an expense still works.
  useEffect(() => {
    if (!isOpen || options !== null) return;

    Promise.all([listExpenseCategories(), listSchools(), listEvents({ pageSize: 100 })])
      .then(([categories, schools, events]) =>
        setOptions({
          categories: categories.map((category) => ({ value: category.id, label: category.name })),
          schools: schools.map((school) => ({ value: school.id, label: school.name })),
          events: events.events.map((event) => ({ value: event.id, label: event.title })),
        }),
      )
      .catch(() => setOptions({ categories: [], schools: [], events: [] }));
  }, [isOpen, options]);

  const categoryOptions = [NO_CATEGORY, ...(options?.categories ?? [])];
  const schoolOptions = [NO_SCHOOL, ...(options?.schools ?? [])];
  const eventOptions = [NO_EVENT, ...(options?.events ?? [])];

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
          <Select
            options={categoryOptions}
            value={values.categoryId}
            disabled={options === null}
            onChange={(event) => set('categoryId', event.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormField label="School" hint="Leave blank for a council-wide cost">
            <Select
              options={schoolOptions}
              value={values.schoolId}
              disabled={options === null}
              onChange={(event) => set('schoolId', event.target.value)}
            />
          </FormField>
          <FormField label="Activity" hint="Leave blank if not tied to one event">
            <Select
              options={eventOptions}
              value={values.eventId}
              disabled={options === null}
              onChange={(event) => set('eventId', event.target.value)}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
