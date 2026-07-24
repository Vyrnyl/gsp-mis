'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Input, Modal, Select } from '@/shared/components/ui';

import { EMPTY_PAYMENT_FORM_VALUES, PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../constants';
import type { FeeTypeOption, MemberOption, PaymentFormValues } from '../types';

export interface PaymentFormModalProps {
  isOpen: boolean;
  memberOptions: MemberOption[];
  feeTypeOptions: FeeTypeOption[];
  onClose: () => void;
  onSubmit: (values: PaymentFormValues) => Promise<void>;
}

type FieldErrors = Partial<Record<keyof PaymentFormValues, string>>;

export function PaymentFormModal({
  isOpen,
  memberOptions,
  feeTypeOptions,
  onClose,
  onSubmit,
}: PaymentFormModalProps) {
  const [values, setValues] = useState<PaymentFormValues>(EMPTY_PAYMENT_FORM_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(EMPTY_PAYMENT_FORM_VALUES);
      setSubmitAttempted(false);
      setSubmitError(null);
      // `handleSubmit` only clears this on failure — a successful submit closes the
      // modal without resetting it, so a stale `true` would permanently disable
      // Cancel/Record the next time this same modal instance reopens.
      setIsSubmitting(false);
    }
  }, [isOpen]);

  function set<K extends keyof PaymentFormValues>(key: K, value: PaymentFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleFeeTypeChange(feeTypeId: string) {
    const feeType = feeTypeOptions.find((option) => option.id === feeTypeId);
    setValues((current) => ({ ...current, feeTypeId, amount: feeType?.amount ?? current.amount }));
  }

  const memberSelectOptions = memberOptions.map((member) => ({
    value: member.id,
    label: member.troopName ? `${member.fullName} — ${member.troopName}` : member.fullName,
  }));
  const feeTypeSelectOptions = feeTypeOptions.map((feeType) => ({ value: feeType.id, label: feeType.name }));

  const errors: FieldErrors = submitAttempted
    ? {
        memberId: values.memberId ? undefined : 'Member is required.',
        feeTypeId: values.feeTypeId ? undefined : 'Fee type is required.',
        amount: values.amount !== undefined && values.amount > 0 ? undefined : 'Enter an amount greater than 0.',
        paymentDate: values.paymentDate ? undefined : 'Payment date is required.',
      }
    : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    const hasError =
      !values.memberId || !values.feeTypeId || !values.amount || values.amount <= 0 || !values.paymentDate;
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
      title="Record Payment"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="payment-form" isLoading={isSubmitting}>
            Record Payment
          </Button>
        </>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        <FormField label="Member" required error={errors.memberId}>
          <Select
            options={memberSelectOptions}
            placeholder="Select member"
            value={values.memberId}
            onChange={(event) => set('memberId', event.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormField label="Fee Type" required error={errors.feeTypeId}>
            <Select
              options={feeTypeSelectOptions}
              placeholder="Select fee type"
              value={values.feeTypeId}
              onChange={(event) => handleFeeTypeChange(event.target.value)}
            />
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
        </div>

        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormField label="Payment Date" required error={errors.paymentDate}>
            <Input
              type="date"
              value={values.paymentDate}
              onChange={(event) => set('paymentDate', event.target.value)}
            />
          </FormField>
          <FormField label="Payment Method">
            <Select
              options={PAYMENT_METHOD_OPTIONS}
              value={values.paymentMethod}
              onChange={(event) => set('paymentMethod', event.target.value as PaymentFormValues['paymentMethod'])}
            />
          </FormField>
        </div>

        <FormField label="Status">
          <Select
            options={PAYMENT_STATUS_OPTIONS}
            value={values.status}
            onChange={(event) => set('status', event.target.value as PaymentFormValues['status'])}
          />
        </FormField>
      </form>
    </Modal>
  );
}
