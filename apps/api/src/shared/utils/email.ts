import { MailtrapClient } from 'mailtrap';
import nodemailer, { type Transporter } from 'nodemailer';

import { env } from '../../config/env';
import { renderEmailButton, renderEmailFallbackLink, renderEmailLayout, renderEmailParagraph } from './email-templates';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: Transporter | undefined;
let mailtrapClient: MailtrapClient | undefined;

/** Parses the `Name <email>` shape `EMAIL_FROM` is written in; falls back to treating the whole value as the address. */
function parseFromAddress(): { name: string; email: string } {
  const match = env.EMAIL_FROM.match(/^(.*)<(.+)>$/);
  return match ? { name: (match[1] ?? '').trim(), email: (match[2] ?? '').trim() } : { name: '', email: env.EMAIL_FROM };
}

function getMailtrapClient(): MailtrapClient {
  if (!mailtrapClient) mailtrapClient = new MailtrapClient({ token: env.MAILTRAP_API_TOKEN! });
  return mailtrapClient;
}

/**
 * Shared EmailService (build-plan.md §7, open decision #7). Three tiers, checked in
 * order: Mailtrap's HTTP API (`MAILTRAP_API_TOKEN`) if set, then real SMTP (`SMTP_HOST`,
 * works with any provider — Gmail, SendGrid, SES's SMTP interface, ...), then
 * nodemailer's `jsonTransport` as the dev/test default, which never touches the network
 * and logs the message instead — so nothing here ever throws for lack of credentials.
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
  if (env.MAILTRAP_API_TOKEN) {
    const { name, email } = parseFromAddress();
    await getMailtrapClient().send({
      from: { email, name: name || undefined },
      to: [{ email: input.to }],
      subject: input.subject,
      html: input.html,
      text: input.text,
      category: 'GSP MIS',
    });
    return;
  }

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
      html: renderEmailLayout({
        previewText: 'Use this link to choose a new password. It expires in 1 hour.',
        heading: 'Reset your password',
        bodyHtml: [
          renderEmailParagraph('We received a request to reset the password on your GSP MIS account.'),
          renderEmailButton(resetUrl, 'Choose a new password'),
          renderEmailParagraph('This link expires in <strong>1 hour</strong>. If you didn’t request this, you can safely ignore this email — your password won’t change.'),
          renderEmailFallbackLink(resetUrl),
        ].join('\n'),
      }),
    });
  },
};
