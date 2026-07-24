'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { Alert, Button, Card, CardHeader, CardSkeleton, ErrorState, FormField, Input } from '@/shared/components/ui';
import { ROLE_LABELS } from '@/shared/constants/roles';

import type { ProfileFormValues, ProfileSummary, ViewState } from '../types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function toFormValues(profile: ProfileSummary): ProfileFormValues {
  return { fullName: profile.fullName, email: profile.email, phoneNumber: profile.phoneNumber ?? '' };
}

export interface ProfileInfoFormProps {
  viewState: ViewState;
  profile: ProfileSummary | null;
  isSaving: boolean;
  onRetry: () => void;
  onSave: (values: ProfileFormValues) => Promise<void>;
}

/**
 * Registry §3 "Profile header" companion card — editable name/email/phone
 * (build-plan.md §3.5). Role and Member Since are read-only here: role assignment is
 * 3.4's Administrator-only concern (`UsersPanel`), not something a user grants
 * themselves.
 */
export function ProfileInfoForm({ viewState, profile, isSaving, onRetry, onSave }: ProfileInfoFormProps) {
  const [draft, setDraft] = useState<ProfileFormValues>(
    profile ? toFormValues(profile) : { fullName: '', email: '', phoneNumber: '' },
  );
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setDraft(toFormValues(profile));
  }, [profile]);

  if (viewState === 'error') {
    return (
      <Card>
        <ErrorState onRetry={onRetry} description="We could not load your profile. Check your connection and try again." />
      </Card>
    );
  }

  if (viewState === 'loading' || !profile) {
    return (
      <Card>
        <CardSkeleton lines={4} />
      </Card>
    );
  }

  const original = toFormValues(profile);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(original);

  const fullNameError = submitAttempted && draft.fullName.trim().length === 0 ? 'Full name is required.' : undefined;
  const emailError =
    submitAttempted && draft.email.trim().length === 0
      ? 'Email address is required.'
      : submitAttempted && !EMAIL_PATTERN.test(draft.email.trim())
        ? 'Enter a valid email address.'
        : undefined;

  function set<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    if (draft.fullName.trim().length === 0 || !EMAIL_PATTERN.test(draft.email.trim())) return;

    try {
      await onSave({
        fullName: draft.fullName.trim(),
        email: draft.email.trim(),
        phoneNumber: draft.phoneNumber.trim(),
      });
      setSubmitAttempted(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save profile. Please try again.');
    }
  }

  return (
    <Card>
      <CardHeader title="Account Information" subtitle="Your name, email and phone number" />
      {submitError ? (
        <Alert tone="error" live>
          {submitError}
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormField label="Full Name" required error={fullNameError}>
            <Input value={draft.fullName} onChange={(event) => set('fullName', event.target.value)} />
          </FormField>
          <FormField label="Email Address" required error={emailError}>
            <Input type="email" value={draft.email} onChange={(event) => set('email', event.target.value)} />
          </FormField>
        </div>
        <FormField label="Phone Number" hint="Optional">
          <Input
            type="tel"
            placeholder="+63 9XX XXX XXXX"
            value={draft.phoneNumber}
            onChange={(event) => set('phoneNumber', event.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 border-t border-hairline-faint pt-4 md:grid-cols-2">
          <div>
            <p className="text-[0.8rem] font-semibold text-ink-soft">Role</p>
            <p className="mt-1 text-[0.92rem] text-ink">{ROLE_LABELS[profile.role]}</p>
            <p className="mt-0.5 text-[0.78rem] text-muted">Managed by an administrator</p>
          </div>
          <div>
            <p className="text-[0.8rem] font-semibold text-ink-soft">Member Since</p>
            <p className="mt-1 text-[0.92rem] text-ink">{toDisplayDate(profile.createdAt)}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <Button
            type="button"
            variant="gray"
            disabled={!isDirty || isSaving}
            onClick={() => {
              setDraft(original);
              setSubmitAttempted(false);
              setSubmitError(null);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} disabled={!isDirty}>
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
