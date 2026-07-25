'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Modal, Select, Textarea } from '@/shared/components/ui';

import { EMPTY_ACTIVITY_REPORT_FORM_VALUES } from '../constants';
import type { ActivityReportFormValues, ReportableEvent } from '../types';

export interface ActivityReportFormModalProps {
  isOpen: boolean;
  eventOptions: ReportableEvent[];
  onClose: () => void;
  onSubmit: (values: ActivityReportFormValues) => Promise<void>;
}

type FieldErrors = Partial<Record<keyof ActivityReportFormValues, string>>;

function toDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Loop step 1 (UI + Mock). `onSubmit` is a plain async callback so this component
 * doesn't care whether it's writing to a mock array (this step) or a real endpoint
 * (Wire Write) — same shape as `EventFormModal`.
 */
export function ActivityReportFormModal({ isOpen, eventOptions, onClose, onSubmit }: ActivityReportFormModalProps) {
  const [values, setValues] = useState<ActivityReportFormValues>(EMPTY_ACTIVITY_REPORT_FORM_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(EMPTY_ACTIVITY_REPORT_FORM_VALUES);
      setSubmitAttempted(false);
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  function set<K extends keyof ActivityReportFormValues>(key: K, value: ActivityReportFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const eventSelectOptions = eventOptions.map((event) => ({
    value: event.id,
    label: `${event.title} — ${toDisplayDate(event.eventDate)}`,
  }));

  const errors: FieldErrors = submitAttempted
    ? {
        eventId: values.eventId ? undefined : 'Select the event this report is for.',
        summary: values.summary.trim() ? undefined : 'Summary is required.',
      }
    : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    if (!values.eventId || !values.summary.trim()) return;

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
      title="Submit Activity Report"
      size="lg"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="activity-report-form" isLoading={isSubmitting}>
            Submit Report
          </Button>
        </>
      }
    >
      <form id="activity-report-form" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        {eventOptions.length === 0 ? (
          <Alert tone="info">No completed events are available to report on yet.</Alert>
        ) : null}

        <FormField label="Event" required error={errors.eventId}>
          <Select
            options={eventSelectOptions}
            placeholder="Select a completed event"
            value={values.eventId}
            onChange={(event) => set('eventId', event.target.value)}
            disabled={eventOptions.length === 0}
          />
        </FormField>

        <FormField label="Summary" required error={errors.summary} hint="What happened at this event?">
          <Textarea rows={3} value={values.summary} onChange={(event) => set('summary', event.target.value)} />
        </FormField>

        <FormField label="Participation Notes" hint="Optional — attendance, turnout, notable participation">
          <Textarea
            rows={3}
            value={values.participationNotes}
            onChange={(event) => set('participationNotes', event.target.value)}
          />
        </FormField>

        <FormField label="Outcomes" hint="Optional — badges earned, milestones reached, follow-up needed">
          <Textarea rows={3} value={values.outcomes} onChange={(event) => set('outcomes', event.target.value)} />
        </FormField>
      </form>
    </Modal>
  );
}
