'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Alert, Button, FormField, PasswordInput } from '@/shared/components/ui';
import { SuccessIcon, WarningIcon } from '@/shared/components/icons';

import { AuthRequestError, resetPassword } from '../services/auth.service';
import { PasswordStrengthMeter } from './password-strength-meter';

type ResetView = 'form' | 'invalid' | 'success';

export interface ResetPasswordCardProps {
  /** `null` means no `?token=` was present on the URL at all — same as an invalid token. */
  token: string | null;
}

/**
 * Lands here from the link the 1.1 forgot-password email now sends. Shares the same
 * gradient-header chrome as `AuthCard` but isn't a tab switcher — just one flow, so it
 * isn't extracted into shared chrome for two consumers.
 */
export function ResetPasswordCard({ token }: ResetPasswordCardProps) {
  const router = useRouter();
  const [view, setView] = useState<ResetView>(token ? 'form' : 'invalid');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newPasswordTooShort = (submitAttempted || newPassword.length > 0) && newPassword.length < 8;
  const passwordsMismatch =
    (submitAttempted || confirmTouched) && confirmPassword.length > 0 && confirmPassword !== newPassword;

  /**
   * `token` is only ever missing (`invalid` view) before a submit is possible — an
   * expired/already-used/garbage token is instead discovered here, at submit time, and
   * surfaced as an inline `Alert` with the API's own message rather than swapping the
   * whole view, since the message ("This reset link is invalid or has expired.") is
   * already the exact same copy the `invalid` view uses for the no-token case.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitAttempted(true);

    if (!token || newPassword.length < 8 || confirmPassword !== newPassword) return;

    setIsSubmitting(true);
    try {
      await resetPassword({ token, newPassword });
      setView('success');
    } catch (err) {
      setError(err instanceof AuthRequestError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[500px] overflow-hidden rounded-auth bg-surface shadow-overlay">
      <div className="bg-brand-gradient px-8 py-8 text-center text-white">
        <Image
          src="/logo.jpg"
          alt="Girl Scouts of the Philippines"
          width={70}
          height={70}
          className="mx-auto mb-4 rounded-full object-cover"
        />
        <h1 className="text-[1.5rem] font-medium text-white">Girl Scouts of the Philippines</h1>
        <p className="mt-1 text-[0.85rem] text-white/85">Once a Girl Scout, Always a Girl Scout</p>
      </div>

      <div className="p-7">
        {view === 'form' ? (
          <>
            <h2 className="mb-1 text-[1.1rem] font-semibold text-ink">Set a new password</h2>
            <p className="mb-4 text-[0.88rem] text-muted">
              Choose a strong password you don&apos;t use elsewhere.
            </p>

            {error ? <Alert tone="error">{error}</Alert> : null}

            <form onSubmit={handleSubmit} noValidate>
              <FormField
                label="New Password"
                required
                className="mb-1"
                error={newPasswordTooShort ? 'Password must be at least 8 characters.' : undefined}
              >
                <PasswordInput
                  autoComplete="new-password"
                  placeholder="Min 8 chars"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <PasswordStrengthMeter password={newPassword} />
              </FormField>

              <FormField
                label="Confirm New Password"
                required
                error={passwordsMismatch ? 'Passwords do not match.' : undefined}
              >
                <PasswordInput
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  onBlur={() => setConfirmTouched(true)}
                />
              </FormField>

              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Reset Password
              </Button>
            </form>
          </>
        ) : null}

        {view === 'invalid' ? (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-status-warning-bg">
              <WarningIcon className="text-2xl text-status-warning-fg" aria-hidden />
            </span>
            <h3 className="text-[1.05rem] font-bold text-ink">This reset link is invalid or has expired</h3>
            <p className="mt-1.5 max-w-sm text-[0.88rem] leading-relaxed text-muted">
              Reset links expire after a while for your security. Request a new one from the sign-in page.
            </p>
            <Button type="button" variant="primary" className="mt-5" onClick={() => router.push('/login')}>
              Back to Sign In
            </Button>
          </div>
        ) : null}

        {view === 'success' ? (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-status-success-bg">
              <SuccessIcon className="text-2xl text-status-success-fg" aria-hidden />
            </span>
            <h3 className="text-[1.05rem] font-bold text-ink">Your password has been reset</h3>
            <p className="mt-1.5 max-w-sm text-[0.88rem] leading-relaxed text-muted">
              You can now sign in with your new password.
            </p>
            <Button type="button" variant="primary" className="mt-5" onClick={() => router.push('/login')}>
              Sign In
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
