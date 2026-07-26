import { randomBytes } from 'node:crypto';

import { OAuth2Client } from 'google-auth-library';
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
let gmailOAuthClient: OAuth2Client | undefined;

/**
 * Many PaaS hosts (Render's free plan included) silently drop outbound SMTP
 * packets instead of refusing the connection, so a blocked port hangs rather
 * than fails. `forgotPassword` (auth.service.ts) awaits `send()` and treats it
 * as best-effort via try/catch, but a hang is neither a resolve nor a reject —
 * it just blocks the HTTP response forever. Bounding every send call here is
 * what actually makes it best-effort.
 */
const EMAIL_SEND_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Email send timed out after ${ms}ms`)), ms);
    }),
  ]);
}

/** Parses the `Name <email>` shape `EMAIL_FROM` is written in; falls back to treating the whole value as the address. */
function parseFromAddress(): { name: string; email: string } {
  const match = env.EMAIL_FROM.match(/^(.*)<(.+)>$/);
  return match ? { name: (match[1] ?? '').trim(), email: (match[2] ?? '').trim() } : { name: '', email: env.EMAIL_FROM };
}

function getMailtrapClient(): MailtrapClient {
  if (!mailtrapClient) mailtrapClient = new MailtrapClient({ token: env.MAILTRAP_API_TOKEN! });
  return mailtrapClient;
}

function getGmailOAuthClient(): OAuth2Client {
  if (!gmailOAuthClient) {
    gmailOAuthClient = new OAuth2Client(env.GMAIL_CLIENT_ID, env.GMAIL_CLIENT_SECRET);
    gmailOAuthClient.setCredentials({ refresh_token: env.GMAIL_REFRESH_TOKEN });
  }
  return gmailOAuthClient;
}

/** Builds the RFC 2822 message the Gmail API's `messages.send` expects as base64url in its `raw` field. */
function buildGmailRawMessage(input: SendEmailInput): string {
  const boundary = `gsp-mis-${randomBytes(8).toString('hex')}`;
  const message = [
    `From: ${env.EMAIL_FROM}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    input.text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    input.html,
    '',
    `--${boundary}--`,
  ].join('\r\n');

  return Buffer.from(message, 'utf8').toString('base64url');
}

/**
 * Sends through the Gmail API over HTTPS instead of raw SMTP, using the account behind
 * `GMAIL_REFRESH_TOKEN`. Unlike SMTP, this isn't affected by hosts (Render's free plan
 * included) that silently drop outbound SMTP traffic, and unlike Mailtrap's shared
 * sending domain, it isn't restricted to the account owner's own inbox — it sends as a
 * real Gmail account, so it can reach any recipient exactly like Gmail's own web UI can.
 */
async function sendViaGmailApi(input: SendEmailInput): Promise<void> {
  const { token } = await getGmailOAuthClient().getAccessToken();
  if (!token) throw new Error('Failed to obtain a Gmail API access token from the refresh token');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: buildGmailRawMessage(input) }),
  });

  if (!response.ok) {
    throw new Error(`Gmail API send failed (${response.status}): ${await response.text()}`);
  }
}

/**
 * Shared EmailService (build-plan.md §7, open decision #7). Checked in order: the Gmail
 * API (`GMAIL_CLIENT_ID`/`GMAIL_CLIENT_SECRET`/`GMAIL_REFRESH_TOKEN`) if set, then
 * Mailtrap's HTTP API (`MAILTRAP_API_TOKEN`), then real SMTP (`SMTP_HOST`, works with
 * any provider), then nodemailer's `jsonTransport` as the dev/test default, which never
 * touches the network and logs the message instead — so nothing here ever throws for
 * lack of credentials.
 */
function getTransporter(): Transporter {
  if (transporter) return transporter;

  transporter = env.SMTP_HOST
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
        connectionTimeout: EMAIL_SEND_TIMEOUT_MS,
        greetingTimeout: EMAIL_SEND_TIMEOUT_MS,
        socketTimeout: EMAIL_SEND_TIMEOUT_MS,
      })
    : nodemailer.createTransport({ jsonTransport: true });

  return transporter;
}

async function send(input: SendEmailInput): Promise<void> {
  if (env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN) {
    await withTimeout(sendViaGmailApi(input), EMAIL_SEND_TIMEOUT_MS);
    return;
  }

  if (env.MAILTRAP_API_TOKEN) {
    const { name, email } = parseFromAddress();
    await withTimeout(
      getMailtrapClient().send({
        from: { email, name: name || undefined },
        to: [{ email: input.to }],
        subject: input.subject,
        html: input.html,
        text: input.text,
        category: 'GSP MIS',
      }),
      EMAIL_SEND_TIMEOUT_MS,
    );
    return;
  }

  const info = await withTimeout(
    getTransporter().sendMail({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
    EMAIL_SEND_TIMEOUT_MS,
  );

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
