'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Input, Modal, Select, Textarea } from '@/shared/components/ui';

import { EMPTY_EVENT_FORM_VALUES } from '../constants';
import { EventsRequestError } from '../services/events.service';
import type { EventCategoryOption, EventFormValues, EventOrganizerOption } from '../types';

export interface EventFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValues?: EventFormValues;
  categoryOptions: EventCategoryOption[];
  organizerOptions: EventOrganizerOption[];
  onClose: () => void;
  onSubmit: (values: EventFormValues) => Promise<void>;
}

type FieldErrors = Partial<Record<keyof EventFormValues, string>>;

export function EventFormModal({
  isOpen,
  mode,
  initialValues,
  categoryOptions,
  organizerOptions,
  onClose,
  onSubmit,
}: EventFormModalProps) {
  const [values, setValues] = useState<EventFormValues>(initialValues ?? EMPTY_EVENT_FORM_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(initialValues ?? EMPTY_EVENT_FORM_VALUES);
      setSubmitAttempted(false);
      setSubmitError(null);
    }
  }, [isOpen, initialValues]);

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const categorySelectOptions = categoryOptions.map((category) => ({ value: category.id, label: category.name }));
  const organizerSelectOptions = organizerOptions.map((organizer) => ({
    value: organizer.id,
    label: organizer.fullName,
  }));

  const timeOrderInvalid =
    Boolean(values.startTime) && Boolean(values.endTime) && values.endTime <= values.startTime;

  const errors: FieldErrors = submitAttempted
    ? {
        title: values.title.trim() ? undefined : 'Event title is required.',
        eventDate: values.eventDate ? undefined : 'Event date is required.',
        categoryId: values.categoryId ? undefined : 'Category is required.',
        endTime: timeOrderInvalid ? 'End time must be after the start time.' : undefined,
      }
    : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    const hasError =
      !values.title.trim() || !values.eventDate || !values.categoryId || timeOrderInvalid;
    if (hasError) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err instanceof EventsRequestError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'New Event' : 'Edit Event'}
      size="lg"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="event-form" isLoading={isSubmitting}>
            {mode === 'create' ? 'Create Event' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form id="event-form" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        <FormField label="Event Title" required error={errors.title}>
          <Input value={values.title} onChange={(event) => set('title', event.target.value)} />
        </FormField>

        <FormField label="Description" hint="Optional">
          <Textarea rows={3} value={values.description} onChange={(event) => set('description', event.target.value)} />
        </FormField>

        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormField label="Category" required error={errors.categoryId}>
            <Select
              options={categorySelectOptions}
              placeholder="Select category"
              value={values.categoryId}
              onChange={(event) => set('categoryId', event.target.value)}
            />
          </FormField>
          <FormField label="Event Date" required error={errors.eventDate}>
            <Input type="date" value={values.eventDate} onChange={(event) => set('eventDate', event.target.value)} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormField label="Start Time" hint="Optional">
            <Input type="time" value={values.startTime} onChange={(event) => set('startTime', event.target.value)} />
          </FormField>
          <FormField label="End Time" hint="Optional" error={errors.endTime}>
            <Input type="time" value={values.endTime} onChange={(event) => set('endTime', event.target.value)} />
          </FormField>
        </div>

        <FormField label="Location" hint="Optional">
          <Input value={values.location} onChange={(event) => set('location', event.target.value)} />
        </FormField>

        <FormField label="Organizer / Troop Leader" hint="Optional — can be assigned later">
          <Select
            options={organizerSelectOptions}
            placeholder="Unassigned"
            value={values.organizerId}
            onChange={(event) => set('organizerId', event.target.value)}
          />
        </FormField>
      </form>
    </Modal>
  );
}
