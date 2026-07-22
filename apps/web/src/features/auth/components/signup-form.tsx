'use client';

import { useState, type FormEvent } from 'react';

import { Button, FormField, Input, PasswordInput, Select, useToast } from '@/shared/components/ui';
import type { SelectOption } from '@/shared/components/ui';

import type { AuthRoleId } from '../types';
import { PasswordStrengthMeter } from './password-strength-meter';
import { RoleSelector } from './role-selector';

const REGIONS: SelectOption[] = [
  { value: 'car', label: 'CAR' },
  { value: 'region-1', label: 'Region I' },
  { value: 'region-2', label: 'Region II' },
  { value: 'region-3', label: 'Region III' },
  { value: 'region-4a', label: 'Region IV-A' },
  { value: 'region-4b', label: 'Region IV-B' },
  { value: 'region-5', label: 'Region V - Bicol' },
  { value: 'region-6', label: 'Region VI' },
  { value: 'region-7', label: 'Region VII' },
  { value: 'region-8', label: 'Region VIII' },
  { value: 'region-9', label: 'Region IX' },
  { value: 'region-10', label: 'Region X' },
  { value: 'region-11', label: 'Region XI' },
  { value: 'region-12', label: 'Region XII' },
  { value: 'barmm', label: 'BARMM' },
];

/**
 * The prototype's troop-type list mixed an unrelated value ("Tagalog") with a
 * duplicated "Cadet" entry. `scout_levels` is already seeded with these five real
 * age divisions (apps/api/prisma/seed.ts), so the dropdown now reflects that table
 * instead of an invented, broken enum.
 */
const SCOUT_LEVELS: SelectOption[] = [
  { value: 'twinkler', label: 'Twinkler' },
  { value: 'star', label: 'Star Scout' },
  { value: 'junior', label: 'Junior Girl Scout' },
  { value: 'senior', label: 'Senior Girl Scout' },
  { value: 'cadet', label: 'Cadet Girl Scout' },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SignupFormProps {
  role: AuthRoleId;
  onRoleChange: (role: AuthRoleId) => void;
  onSwitchToLogin: () => void;
}

/**
 * UI + Mock step (Loop step 1): submitting only simulates success. Real fields and
 * `POST /api/v1/auth/signup` are settled at the Contract step (Loop step 3), once
 * this screen has passed visual sign-off.
 */
export function SignupForm({ role, onRoleChange, onSwitchToLogin }: SignupFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const firstNameError = submitAttempted && firstName.trim().length === 0 ? 'First name is required.' : undefined;
  const lastNameError = submitAttempted && lastName.trim().length === 0 ? 'Last name is required.' : undefined;
  const emailError =
    submitAttempted && email.trim().length === 0
      ? 'Email address is required.'
      : submitAttempted && !EMAIL_PATTERN.test(email.trim())
        ? 'Enter a valid email address.'
        : undefined;
  const passwordTooShort = (submitAttempted || password.length > 0) && password.length < 8;
  const passwordsMismatch =
    (submitAttempted || confirmTouched) && confirm.length > 0 && confirm !== password;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);

    const hasBlockingError =
      firstName.trim().length === 0 ||
      lastName.trim().length === 0 ||
      !EMAIL_PATTERN.test(email.trim()) ||
      password.length < 8 ||
      confirm !== password;

    if (hasBlockingError) return;

    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      showToast(
        `Account created for ${firstName} ${lastName} (demo). Backend wiring lands at Loop step 4.`,
        'success',
      );
    }, 500);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <RoleSelector legend="Register as" value={role} onChange={onRoleChange} />

      <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
        <FormField label="First Name" required error={firstNameError}>
          <Input placeholder="Maria" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
        </FormField>
        <FormField label="Last Name" required error={lastNameError}>
          <Input placeholder="Santos" value={lastName} onChange={(event) => setLastName(event.target.value)} />
        </FormField>
      </div>

      <FormField label="Email Address" required error={emailError}>
        <Input
          type="email"
          autoComplete="email"
          placeholder="your@gmail.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </FormField>

      {role === 'executive_council' ? (
        <>
          <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
            <FormField label="Council Name">
              <Input placeholder="Catanduanes Council" />
            </FormField>
            <FormField label="Region">
              <Select placeholder="Select region" options={REGIONS} />
            </FormField>
          </div>
          <FormField label="Council Code" hint="e.g. CAT-001">
            <Input placeholder="e.g. CAT-001" />
          </FormField>
        </>
      ) : null}

      {role === 'troop_leader' ? (
        <>
          <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
            <FormField label="Troop Number">
              <Input placeholder="e.g. T-2045" />
            </FormField>
            <FormField label="Primary Scout Level">
              <Select placeholder="Select level" options={SCOUT_LEVELS} />
            </FormField>
          </div>
          <FormField label="Home Council">
            <Input placeholder="e.g. Catanduanes Council" />
          </FormField>
        </>
      ) : null}

      {role === 'admin' ? (
        <>
          <FormField label="Employee ID">
            <Input placeholder="EMP-00123" />
          </FormField>
          <FormField label="Admin Secret Key" hint="Contact the national office for the key">
            <PasswordInput placeholder="••••••••" />
          </FormField>
        </>
      ) : null}

      <FormField
        label="Password"
        required
        className="mb-1"
        error={passwordTooShort ? 'Password must be at least 8 characters.' : undefined}
      >
        <PasswordInput
          autoComplete="new-password"
          placeholder="Min 8 chars"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <PasswordStrengthMeter password={password} />
      </FormField>

      <FormField
        label="Confirm Password"
        required
        error={passwordsMismatch ? 'Passwords do not match.' : undefined}
      >
        <PasswordInput
          autoComplete="new-password"
          placeholder="Repeat password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          onBlur={() => setConfirmTouched(true)}
        />
      </FormField>

      <Button type="submit" variant="primary" isLoading={isSubmitting}>
        Create Account →
      </Button>

      <p className="mt-4 text-center text-[0.85rem] text-muted">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-brand-green hover:underline"
        >
          Sign In
        </button>
      </p>
    </form>
  );
}
