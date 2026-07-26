'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

import { DEFAULT_BADGE_CATEGORY_ICON } from '@/shared/components/icons';
import { Alert, Button, FormField, IconPicker, Input, Modal, Textarea } from '@/shared/components/ui';

import { BADGE_CATEGORY_ICON_OPTIONS, EMPTY_CATEGORY_FORM_VALUES } from '../constants';
import type { CategoryFormValues } from '../types';

export interface CategoryFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  itemNoun: string;
  showOrder: boolean;
  /** Badge categories only — scout levels and activity categories have no icon. */
  showIcon?: boolean;
  initialValues?: CategoryFormValues;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
}

export function CategoryFormModal({
  isOpen,
  mode,
  itemNoun,
  showOrder,
  showIcon = false,
  initialValues,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  const [values, setValues] = useState<CategoryFormValues>(initialValues ?? EMPTY_CATEGORY_FORM_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * Resets only on the closed→open transition, not on every re-render while the modal
   * stays open — `initialValues` is a fresh object from the parent each render, so
   * keying the reset off its identity would wipe out in-progress edits whenever the
   * parent re-renders for an unrelated reason (e.g. a background refetch resolving).
   */
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setValues(initialValues ?? EMPTY_CATEGORY_FORM_VALUES);
      setSubmitAttempted(false);
      setSubmitError(null);
      setIsSubmitting(false);
    }
    wasOpen.current = isOpen;
  }, [isOpen, initialValues]);

  const nameError = submitAttempted && !values.name.trim() ? `${itemNoun} name is required.` : undefined;
  const orderError =
    submitAttempted && showOrder && (values.orderNumber === undefined || values.orderNumber < 1)
      ? 'Order must be 1 or higher.'
      : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    const hasError = !values.name.trim() || (showOrder && (values.orderNumber === undefined || values.orderNumber < 1));
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
      title={mode === 'create' ? `Add ${itemNoun}` : `Edit ${itemNoun}`}
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" isLoading={isSubmitting}>
            {mode === 'create' ? `Add ${itemNoun}` : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        <FormField label="Name" required error={nameError}>
          <Input
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          />
        </FormField>

        {showOrder ? (
          <FormField label="Order" required error={orderError} hint="Determines display and progression order">
            <Input
              type="number"
              min={1}
              value={values.orderNumber ?? ''}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  orderNumber: event.target.value ? Number(event.target.value) : undefined,
                }))
              }
            />
          </FormField>
        ) : null}

        <FormField label="Description" hint="Optional">
          <Textarea
            rows={3}
            value={values.description}
            onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          />
        </FormField>

        {showIcon ? (
          <IconPicker
            legend="Icon"
            hint="Shown on every badge in this category"
            options={BADGE_CATEGORY_ICON_OPTIONS}
            value={values.icon ?? DEFAULT_BADGE_CATEGORY_ICON}
            onChange={(icon) => setValues((current) => ({ ...current, icon }))}
          />
        ) : null}
      </form>
    </Modal>
  );
}
