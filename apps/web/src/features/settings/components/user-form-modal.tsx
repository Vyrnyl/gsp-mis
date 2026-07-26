'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Input, Modal, PasswordInput, Select } from '@/shared/components/ui';

import { EMPTY_CREATE_USER_FORM_VALUES, ROLE_ASSIGN_OPTIONS } from '../constants';
import type { CreateUserFormValues, UserFormValues } from '../types';
import { PasswordStrengthMeter } from '@/features/auth/components/password-strength-meter';

export interface UserFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValues?: UserFormValues;
  onClose: () => void;
  onSubmit: (values: CreateUserFormValues) => Promise<void>;
}

type FieldErrors = Partial<Record<keyof CreateUserFormValues, string>>;

/**
 * One modal for both Add User and Edit User (build-plan.md §3.4). Edit omits the
 * password field entirely — resetting a password is its own action with its own
 * confirm dialog (`ResetPasswordDialog`), matching the prototype's separate
 * 🔑 Reset button rather than folding it into the profile-edit form.
 */
export function UserFormModal({ isOpen, mode, initialValues, onClose, onSubmit }: UserFormModalProps) {
  const [values, setValues] = useState<CreateUserFormValues>(
    initialValues ? { ...initialValues, password: '' } : EMPTY_CREATE_USER_FORM_VALUES,
  );
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
      setValues(initialValues ? { ...initialValues, password: '' } : EMPTY_CREATE_USER_FORM_VALUES);
      setSubmitAttempted(false);
      setSubmitError(null);
      setIsSubmitting(false);
    }
    wasOpen.current = isOpen;
  }, [isOpen, initialValues]);

  function set<K extends keyof CreateUserFormValues>(key: K, value: CreateUserFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const errors: FieldErrors = submitAttempted
    ? {
        fullName: values.fullName.trim() ? undefined : 'Full name is required.',
        email: values.email.trim() ? undefined : 'Email address is required.',
        password: mode === 'create' && values.password.length < 8 ? 'Password must be at least 8 characters.' : undefined,
      }
    : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    const hasError =
      !values.fullName.trim() || !values.email.trim() || (mode === 'create' && values.password.length < 8);
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
      title={mode === 'create' ? 'Add User' : 'Edit User'}
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" isLoading={isSubmitting}>
            {mode === 'create' ? 'Add User' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} noValidate>
        {submitError ? (
          <Alert tone="error" live>
            {submitError}
          </Alert>
        ) : null}

        <FormField label="Full Name" error={errors.fullName} required>
          <Input value={values.fullName} onChange={(event) => set('fullName', event.target.value)} required />
        </FormField>

        <FormField label="Email Address" error={errors.email} required>
          <Input
            type="email"
            value={values.email}
            onChange={(event) => set('email', event.target.value)}
            required
          />
        </FormField>

        <FormField label="Phone Number" hint="Optional">
          <Input value={values.phoneNumber} onChange={(event) => set('phoneNumber', event.target.value)} />
        </FormField>

        <FormField label="Role" required>
          <Select
            options={ROLE_ASSIGN_OPTIONS}
            value={values.role}
            onChange={(event) => set('role', event.target.value as UserFormValues['role'])}
          />
        </FormField>

        {mode === 'create' ? (
          <FormField label="Temporary Password" error={errors.password} hint="At least 8 characters. Share it with the user securely." required>
            <PasswordInput value={values.password} onChange={(event) => set('password', event.target.value)} required />
            <PasswordStrengthMeter password={values.password} />
          </FormField>
        ) : null}
      </form>
    </Modal>
  );
}
