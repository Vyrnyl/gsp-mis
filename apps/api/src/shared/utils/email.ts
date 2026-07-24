import nodemailer, { type Transporter } from 'nodemailer';

import { env } from '../../config/env';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: Transporter | undefined;

/**
 * Shared EmailService (build-plan.md §7, open decision #7). SMTP transport works with
 * any provider (Gmail, SendGrid, Mailtrap, SES's SMTP interface, ...) so no proprietary
 * SDK is tied to this file. When `SMTP_HOST` is unset (dev/test, and any environment
 * that hasn't configured it yet), falls back to nodemailer's `jsonTransport`, which
 * never touches the network — the message is logged instead of sent, so nothing here
 * ever throws for lack of credentials.
 */
function getTransporter(): Transporter {
  if (transporter) return transporter;

  transporter = env.SMTP_HOST
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      })
    : nodemailer.createTransport({ jsonTransport: true });

  return transporter;
}

async function send(input: SendEmailInput): Promise<void> {
  const info = await getTransporter().sendMail({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (!env.SMTP_HOST) {
    console.info(`[email:dev] SMTP not configured — logging instead of sending.\n${info.message.toString()}`);
  }
}

export const emailService = {
  send,

  /** First concrete email this app sends (feature 1.1's forgot-password follow-up). */
  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await send({
      to,
      subject: 'Reset your GSP MIS password',
      text: `We received a request to reset your password. Open this link to choose a new one (expires in 1 hour): ${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
      html: `
        <p>We received a request to reset your password.</p>
        <p><a href="${resetUrl}">Click here to choose a new password</a> (expires in 1 hour).</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  },
};
