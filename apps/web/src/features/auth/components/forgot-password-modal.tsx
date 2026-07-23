'use client';

import { useId, useState, type FormEvent } from 'react';

import { Button, FormField, Input, Modal, useToast } from '@/shared/components/ui';

import { forgotPassword } from '../services/auth.service';

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Replaces the prototype's `showForgot()`, which used a native `prompt()` then
 * `alert()` — both block the thread, ignore the design system, and are
 * unreachable by assistive tech in a predictable way. A modal keeps the flow on
 * the same design tokens and inside the app's focus-trap/`aria-live` machinery.
 */
export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const formId = useId();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  /**
   * The backend's response is deliberately identical whether or not the email
   * exists (no user enumeration), so a thrown `AuthRequestError` here only ever
   * means a genuine network/server fault, not "email not found."
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const { message } = await forgotPassword({ email: email.trim() });
      showToast(message, 'success');
      setEmail('');
      onClose();
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset your password"
      size="sm"
      footer={
        <>
          <Button type="button" variant="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} variant="green" isLoading={isSubmitting}>
            Send Reset Link
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        <p className="mb-4 text-[0.88rem] text-muted">
          Enter the email on your account and we&apos;ll send a link to reset your password.
        </p>
        <FormField label="Email Address" required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="your@gmail.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>
      </form>
    </Modal>
  );
}
