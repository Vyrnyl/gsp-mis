'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Input, Modal, Textarea } from '@/shared/components/ui';

import { EMPTY_ANNOUNCEMENT_FORM_VALUES } from '../constants';
import type { AnnouncementFormValues } from '../types';

export interface AnnouncementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AnnouncementFormValues) => Promise<void>;
}

/** Create-only for v1 (build-plan.md §2.5 scopes no edit/delete) — Admin + Executive Council. */
export function AnnouncementFormModal({ isOpen, onClose, onSubmit }: AnnouncementFormModalProps) {
  const [values, setValues] = useState<AnnouncementFormValues>(EMPTY_ANNOUNCEMENT_FORM_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(EMPTY_ANNOUNCEMENT_FORM_VALUES);
      setSubmitAttempted(false);
      setSubmitError(null);
    }
  }, [isOpen]);

  function set<K extends keyof AnnouncementFormValues>(key: K, value: AnnouncementFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const titleError = submitAttempted && !values.title.trim() ? 'Title is required.' : undefined;
  const contentError = submitAttempted && !values.content.trim() ? 'Content is required.' : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    if (!values.title.trim() || !values.content.trim()) return;

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
      title="New Announcement"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="announcement-form" isLoading={isSubmitting}>
            Post Announcement
          </Button>
        </>
      }
    >
      <form id="announcement-form" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        <FormField label="Title" required error={titleError}>
          <Input value={values.title} onChange={(event) => set('title', event.target.value)} />
        </FormField>

        <FormField label="Content" required error={contentError}>
          <Textarea
            rows={5}
            value={values.content}
            onChange={(event) => set('content', event.target.value)}
          />
        </FormField>

        <FormField label="Expires On" hint="Optional — the post is dropped from the feed after this date">
          <Input
            type="date"
            value={values.expiresAt}
            onChange={(event) => set('expiresAt', event.target.value)}
          />
        </FormField>
      </form>
    </Modal>
  );
}
