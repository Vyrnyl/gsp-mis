'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Input, PasswordInput, Select, useToast } from '@/shared/components/ui';
import type { SelectOption } from '@/shared/components/ui';

import { AuthRequestError, signup } from '../services/auth.service';
import type { AuthRoleId, SignupRequest } from '../types';
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

export function SignupForm({ role, onRoleChange, onSwitchToLogin }: SignupFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);

  const [councilName, setCouncilName] = useState('');
  const [region, setRegion] = useState('');
  const [councilCode, setCouncilCode] = useState('');

  const [troopNumber, setTroopNumber] = useState('');
  const [primaryScoutLevel, setPrimaryScoutLevel] = useState('');
  const [homeCouncilName, setHomeCouncilName] = useState('');

  const [employeeId, setEmployeeId] = useState('');
  const [adminSecretKey, setAdminSecretKey] = useState('');

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => setError(null), [role]);

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

  const councilNameError =
    submitAttempted && role === 'executive_council' && councilName.trim().length === 0
      ? 'Council name is required.'
      : undefined;
  const regionError =
    submitAttempted && role === 'executive_council' && region.length === 0 ? 'Region is required.' : undefined;
  const councilCodeError =
    submitAttempted && role === 'executive_council' && councilCode.trim().length === 0
      ? 'Council code is required.'
      : undefined;

  const troopNumberError =
    submitAttempted && role === 'troop_leader' && troopNumber.trim().length === 0
      ? 'Troop number is required.'
      : undefined;
  const primaryScoutLevelError =
    submitAttempted && role === 'troop_leader' && primaryScoutLevel.length === 0
      ? 'Primary scout level is required.'
      : undefined;
  const homeCouncilNameError =
    submitAttempted && role === 'troop_leader' && homeCouncilName.trim().length === 0
      ? 'Home council is required.'
      : undefined;

  const employeeIdError =
    submitAttempted && role === 'admin' && employeeId.trim().length === 0 ? 'Employee ID is required.' : undefined;
  const adminSecretKeyError =
    submitAttempted && role === 'admin' && adminSecretKey.length === 0
      ? 'Admin secret key is required.'
      : undefined;

  function buildPayload(): SignupRequest | null {
    const base = { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password };

    if (role === 'executive_council') {
      if (!councilName.trim() || !region || !councilCode.trim()) return null;
      return { ...base, role, councilName: councilName.trim(), region, councilCode: councilCode.trim() };
    }
    if (role === 'troop_leader') {
      if (!troopNumber.trim() || !primaryScoutLevel || !homeCouncilName.trim()) return null;
      return {
        ...base,
        role,
        troopNumber: troopNumber.trim(),
        primaryScoutLevel,
        homeCouncilName: homeCouncilName.trim(),
      };
    }
    if (!employeeId.trim() || !adminSecretKey) return null;
    return { ...base, role, employeeId: employeeId.trim(), adminSecretKey };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitAttempted(true);

    const hasBlockingError =
      firstName.trim().length === 0 ||
      lastName.trim().length === 0 ||
      !EMAIL_PATTERN.test(email.trim()) ||
      password.length < 8 ||
      confirm !== password;

    const payload = hasBlockingError ? null : buildPayload();
    if (!payload) return;

    setIsSubmitting(true);

    try {
      const { user } = await signup(payload);
      showToast(`Account created for ${user.fullName}.`, 'success');
      router.push('/dashboard');
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof AuthRequestError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <RoleSelector legend="Register as" value={role} onChange={onRoleChange} />

      {error ? <Alert tone="error">{error}</Alert> : null}

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
            <FormField label="Council Name" required error={councilNameError}>
              <Input
                placeholder="Catanduanes Council"
                value={councilName}
                onChange={(event) => setCouncilName(event.target.value)}
              />
            </FormField>
            <FormField label="Region" required error={regionError}>
              <Select
                placeholder="Select region"
                options={REGIONS}
                value={region}
                onChange={(event) => setRegion(event.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Council Code" required hint="e.g. CAT-001" error={councilCodeError}>
            <Input
              placeholder="e.g. CAT-001"
              value={councilCode}
              onChange={(event) => setCouncilCode(event.target.value)}
            />
          </FormField>
        </>
      ) : null}

      {role === 'troop_leader' ? (
        <>
          <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
            <FormField label="Troop Number" required error={troopNumberError}>
              <Input
                placeholder="e.g. T-2045"
                value={troopNumber}
                onChange={(event) => setTroopNumber(event.target.value)}
              />
            </FormField>
            <FormField label="Primary Scout Level" required error={primaryScoutLevelError}>
              <Select
                placeholder="Select level"
                options={SCOUT_LEVELS}
                value={primaryScoutLevel}
                onChange={(event) => setPrimaryScoutLevel(event.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Home Council" required error={homeCouncilNameError}>
            <Input
              placeholder="e.g. Catanduanes Council"
              value={homeCouncilName}
              onChange={(event) => setHomeCouncilName(event.target.value)}
            />
          </FormField>
        </>
      ) : null}

      {role === 'admin' ? (
        <>
          <FormField label="Employee ID" required error={employeeIdError}>
            <Input
              placeholder="EMP-00123"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
            />
          </FormField>
          <FormField
            label="Admin Secret Key"
            required
            hint="Contact the national office for the key"
            error={adminSecretKeyError}
          >
            <PasswordInput
              placeholder="••••••••"
              value={adminSecretKey}
              onChange={(event) => setAdminSecretKey(event.target.value)}
            />
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
