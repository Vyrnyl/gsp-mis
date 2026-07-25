'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { AddIcon, DeleteIcon } from '@/shared/components/icons';
import { Alert, Button, FormField, Input, Modal, Select, Textarea } from '@/shared/components/ui';

import { EMPTY_BADGE_FORM_VALUES } from '../constants';
import type { BadgeCategoryOption, BadgeFormValues } from '../types';

export interface BadgeFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  categoryOptions: BadgeCategoryOption[];
  initialValues?: BadgeFormValues;
  onClose: () => void;
  onSubmit: (values: BadgeFormValues) => Promise<void>;
}

/** Admin-only catalog CRUD — project-overview.md scopes "Create/Update/Delete badges" to Administrator. */
export function BadgeFormModal({
  isOpen,
  mode,
  categoryOptions,
  initialValues,
  onClose,
  onSubmit,
}: BadgeFormModalProps) {
  const [values, setValues] = useState<BadgeFormValues>(initialValues ?? EMPTY_BADGE_FORM_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(initialValues ?? EMPTY_BADGE_FORM_VALUES);
      setSubmitAttempted(false);
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialValues]);

  function set<K extends keyof BadgeFormValues>(key: K, value: BadgeFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function setRequirement(index: number, value: string) {
    setValues((current) => ({
      ...current,
      requirements: current.requirements.map((requirement, i) => (i === index ? value : requirement)),
    }));
  }

  function addRequirement() {
    setValues((current) => ({ ...current, requirements: [...current.requirements, ''] }));
  }

  function removeRequirement(index: number) {
    setValues((current) => ({
      ...current,
      requirements: current.requirements.filter((_, i) => i !== index),
    }));
  }

  const nonEmptyRequirements = values.requirements.map((r) => r.trim()).filter(Boolean);
  const nameError = submitAttempted && !values.name.trim() ? 'Badge name is required.' : undefined;
  const pointsError =
    submitAttempted && (values.requiredPoints === undefined || values.requiredPoints < 0)
      ? 'Required points must be 0 or higher.'
      : undefined;
  const requirementsError =
    submitAttempted && nonEmptyRequirements.length === 0 ? 'Add at least one requirement.' : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    const hasError =
      !values.name.trim() ||
      values.requiredPoints === undefined ||
      values.requiredPoints < 0 ||
      nonEmptyRequirements.length === 0;
    if (hasError) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ ...values, requirements: nonEmptyRequirements });
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  const categorySelectOptions = categoryOptions.map((category) => ({ value: category.id, label: category.name }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Add Badge' : 'Edit Badge'}
      size="lg"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="badge-form" isLoading={isSubmitting}>
            {mode === 'create' ? 'Add Badge' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form id="badge-form" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        <FormField label="Badge Name" required error={nameError}>
          <Input value={values.name} onChange={(event) => set('name', event.target.value)} />
        </FormField>

        <div className="grid grid-cols-1 gap-x-4 lg2:grid-cols-2">
          <FormField label="Category" hint="Optional">
            <Select
              options={categorySelectOptions}
              placeholder="No category"
              value={values.categoryId}
              onChange={(event) => set('categoryId', event.target.value)}
            />
          </FormField>

          <FormField label="Required Points" required error={pointsError}>
            <Input
              type="number"
              min={0}
              value={values.requiredPoints ?? ''}
              onChange={(event) =>
                set('requiredPoints', event.target.value ? Number(event.target.value) : undefined)
              }
            />
          </FormField>
        </div>

        <FormField label="Description" hint="Optional">
          <Textarea
            rows={2}
            value={values.description}
            onChange={(event) => set('description', event.target.value)}
          />
        </FormField>

        <FormField label="Requirements" required error={requirementsError} hint="What a scout must do to earn this badge">
          <div className="space-y-2">
            {values.requirements.map((requirement, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={requirement}
                  placeholder={`Requirement ${index + 1}`}
                  onChange={(event) => setRequirement(index, event.target.value)}
                />
                <Button
                  type="button"
                  variant="gray"
                  size="md"
                  aria-label={`Remove requirement ${index + 1}`}
                  onClick={() => removeRequirement(index)}
                  disabled={values.requirements.length === 1}
                >
                  <DeleteIcon aria-hidden />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            leadingIcon={<AddIcon aria-hidden />}
            onClick={addRequirement}
          >
            Add Requirement
          </Button>
        </FormField>
      </form>
    </Modal>
  );
}
