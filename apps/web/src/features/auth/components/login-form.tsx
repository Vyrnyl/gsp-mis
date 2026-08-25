'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Input, PasswordInput, useToast } from '@/shared/components/ui';

import { AuthRequestError, login } from '../services/auth.service';
import type { AuthRoleId } from '../types';
import { RoleSelector } from './role-selector';

export interface LoginFormProps {
  role: AuthRoleId;
  onRoleChange: (role: AuthRoleId) => void;
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
}

/**
 * UI + Mock step (Loop step 1): credentials are checked against the local demo
 * fixture, not a real session. `POST /api/v1/auth/login` replaces this at step 4.
 */
export function LoginForm({ role, onRoleChange, onSwitchToSignup, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => setError(null), [role]);

  const emailError = submitAttempted && email.trim().length === 0 ? 'Email address is required.' : undefined;
  const passwordError = submitAttempted && password.length === 0 ? 'Password is required.' : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitAttempted(true);

    if (email.trim().length === 0 || password.length === 0) return;

    setIsSubmitting(true);

    try {
      const { user } = await login({ email: email.trim(), password });
      showToast(`Signed in as ${user.fullName}.`, 'success');
      router.push('/dashboard');
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof AuthRequestError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <RoleSelector legend="Sign in as" value={role} onChange={onRoleChange} />

      {error ? <Alert tone="error">{error}</Alert> : null}

      <FormField label="Email Address" required error={emailError}>
        <Input
          type="email"
          autoComplete="username"
          placeholder="your@gmail.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </FormField>

      <FormField label="Password" required error={passwordError}>
        <PasswordInput
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </FormField>

      <div className="-mt-2 mb-3 text-right">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-[0.82rem] text-brand-green hover:underline"
        >
          Forgot password?
        </button>
      </div>

      <Button type="submit" variant="primary" isLoading={isSubmitting}>
        Sign In →
      </Button>

      <p className="mt-4 text-center text-[0.85rem] text-muted">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-semibold text-brand-green hover:underline"
        >
          Sign Up
        </button>
      </p>
    </form>
  );
}
