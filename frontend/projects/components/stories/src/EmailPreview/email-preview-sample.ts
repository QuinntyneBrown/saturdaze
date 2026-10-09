import type { EmailPreviewPlaceholder } from 'components';

/** A rendered password-reset email, as the preview endpoint returns it. */
export const SAMPLE_HTML = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffaf5">
  <tr><td style="padding:32px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#1f2933">
    <h1 style="margin:0 0 16px;font-size:22px">Reset your password</h1>
    <p style="margin:0 0 16px">Hi Alex,</p>
    <p style="margin:0 0 16px">Someone asked to reset the password for alex@example.com. The link works for 60 minutes, once.</p>
    <p style="margin:0 0 24px"><a href="https://app.saturdaze.app/reset-password?token=sample" style="display:inline-block;background:#c2410c;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Choose a new password</a></p>
    <p style="margin:0;font-size:12px;color:#7b8794">Saturdaze · 2026</p>
  </td></tr>
</table>`;

export const SAMPLE_TEXT = `Hi Alex,

Someone asked to reset the password for alex@example.com. Open this link within 60 minutes to choose a new password:

https://app.saturdaze.app/reset-password?token=sample

Saturdaze`;

export const SAMPLE_PLACEHOLDERS: readonly EmailPreviewPlaceholder[] = [
  { name: 'recipientName', value: 'Alex', source: 'builtin' },
  { name: 'recipientEmail', value: 'alex@example.com', source: 'builtin' },
  { name: 'expiresIn', value: '60 minutes', source: 'sample' },
  {
    name: 'resetLink',
    value: 'https://app.saturdaze.app/reset-password?token=sample',
    source: 'sample',
  },
  { name: 'appName', value: 'Saturdaze', source: 'builtin' },
];
