'use client';

import { useState, type FormEvent } from 'react';

import { PasswordStrengthMeter } from '@/features/auth/components/password-strength-meter';
import { Alert, Button, Card, CardHeader, FormField, PasswordInput } from '@/shared/components/ui';

import type { ChangePasswordFormValues } from '../types';

const EMPTY_VALUES: ChangePasswordFormValues = { currentPassword: '', newPassword: '', confirmPassword: '' };

export interface ChangePasswordFormProps {
  isSaving: boolean;
  onSave: (values: ChangePasswordFormValues) => Promise<void>;
}

/**
 * Registry §5 Forms. Reuses `PasswordStrengthMeter` from `features/auth` rather than
 * duplicating it — same cross-feature reuse precedent as 3.4's Add User modal.
 */
export function ChangePasswordForm({ isSaving, onSave }: ChangePasswordFormProps) {
  const [values, setValues] = useState<ChangePasswordFormValues>(EMPTY_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function set<K extends keyof ChangePasswordFormValues>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const currentPasswordError =
    submitAttempted && values.currentPassword.length === 0 ? 'Current password is required.' : undefined;
  const newPasswordTooShort =
    (submitAttempted || values.newPassword.length > 0) && values.newPassword.length < 8;
  const passwordsMismatch =
    (submitAttempted || confirmTouched) &&
    values.confirmPassword.length > 0 &&
    values.confirmPassword !== values.newPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitAttempted(true);

    const hasBlockingError =
      values.currentPassword.length === 0 ||
      values.newPassword.length < 8 ||
      values.confirmPassword !== values.newPassword;
    if (hasBlockingError) return;

    try {
      await onSave(values);
      setValues(EMPTY_VALUES);
      setSubmitAttempted(false);
      setConfirmTouched(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not update password.');
    }
  }

  return (
    <Card>
      <CardHeader title="Change Password" subtitle="Choose a strong password you don't use elsewhere" />
      {formError ? (
        <Alert tone="error" live>
          {formError}
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Current Password" required error={currentPasswordError}>
          <PasswordInput
            autoComplete="current-password"
            value={values.currentPassword}
            onChange={(event) => set('currentPassword', event.target.value)}
          />
        </FormField>

        <FormField
          label="New Password"
          required
          className="mb-1"
          error={newPasswordTooShort ? 'Password must be at least 8 characters.' : undefined}
        >
          <PasswordInput
            autoComplete="new-password"
            placeholder="Min 8 chars"
            value={values.newPassword}
            onChange={(event) => set('newPassword', event.target.value)}
          />
          <PasswordStrengthMeter password={values.newPassword} />
        </FormField>

        <FormField label="Confirm New Password" required error={passwordsMismatch ? 'Passwords do not match.' : undefined}>
          <PasswordInput
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(event) => set('confirmPassword', event.target.value)}
            onBlur={() => setConfirmTouched(true)}
          />
        </FormField>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isSaving}>
            Update Password
          </Button>
        </div>
      </form>
    </Card>
  );
}
