/**
 * Table-based, fully-inline-styled HTML shell for outgoing email (email.ts). Table
 * layout + inline styles rather than flexbox/grid or a `<style>` block — Outlook
 * desktop's Word rendering engine ignores most modern CSS, and this is the one place
 * in the app where that constraint applies; every other screen uses the real
 * `tokens.ts` palette via Tailwind. Colors below are copied from that palette rather
 * than imported, since this bundles into the API, not the web app.
 */
const COLOR = {
  green: '#1a6b3c',
  green4: '#1a5c34',
  goldInk: '#8a7500',
  ink: '#212529',
  muted: '#6c757d',
  bg: '#f4f6f0',
  surface: '#ffffff',
  border: '#eeeeee',
} as const;

export interface EmailLayoutInput {
  /** Shown by inbox previews (Gmail, Outlook) before the email is opened, hidden in the rendered body. */
  previewText: string;
  heading: string;
  /** Pre-built inline-styled HTML — paragraphs, buttons, etc. Not sanitized: callers control all input (no end-user text reaches this). */
  bodyHtml: string;
}

export function renderEmailLayout({ previewText, heading, bodyHtml }: EmailLayoutInput): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading}</title>
  </head>
  <body style="margin:0; padding:0; background-color:${COLOR.bg}; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${previewText}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.bg}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:${COLOR.surface}; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:${COLOR.green}; background:linear-gradient(135deg, ${COLOR.green} 0%, ${COLOR.green4} 100%); padding:28px 32px;">
                <span style="color:#ffffff; font-size:17px; font-weight:700; letter-spacing:0.2px;">Girl Scouts of the Philippines</span>
                <div style="color:#e3efe8; font-size:12px; margin-top:2px;">Membership Information System</div>
              </td>
            </tr>
            <tr>
              <td style="height:4px; background-color:${COLOR.goldInk}; font-size:0; line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px; color:${COLOR.ink}; font-size:20px; font-weight:700;">${heading}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px; border-top:1px solid ${COLOR.border};">
                <p style="margin:0; color:${COLOR.muted}; font-size:12px; line-height:1.6;">
                  This is an automated message from the GSP Management Information System. Please don't reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderEmailButton(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
    <tr>
      <td style="border-radius:8px; background-color:${COLOR.goldInk};">
        <a href="${url}" style="display:inline-block; padding:12px 28px; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; border-radius:8px;">${label}</a>
      </td>
    </tr>
  </table>`;
}

export function renderEmailParagraph(text: string): string {
  return `<p style="margin:0 0 16px; color:${COLOR.ink}; font-size:14px; line-height:1.6;">${text}</p>`;
}

export function renderEmailFallbackLink(url: string): string {
  return `<p style="margin:0 0 4px; color:${COLOR.muted}; font-size:12px; line-height:1.6;">
    If the button above doesn't work, copy and paste this link into your browser:
  </p>
  <p style="margin:0; word-break:break-all;">
    <a href="${url}" style="color:${COLOR.green}; font-size:12px;">${url}</a>
  </p>`;
}
