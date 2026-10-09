import { ChangeDetectionStrategy, Component } from '@angular/core';

import { EmailPreview, EmailPreviewPlaceholder } from 'components';

const PLACEHOLDERS: readonly EmailPreviewPlaceholder[] = [
  { name: 'recipientName', value: 'Alex', source: 'builtin' },
  {
    name: 'resetLink',
    value: 'https://app.saturdaze.app/reset-password?token=sample',
    source: 'sample',
  },
  { name: 'giftCode', value: '', source: 'missing' },
];

@Component({
  imports: [EmailPreview],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-email-preview
      subject="Reset your Saturdaze password"
      preheader="The link works for 60 minutes."
      html="<p style='font-family:Arial,sans-serif;padding:24px'>Hi Alex, choose a new password.</p>"
      text="Hi Alex, choose a new password."
      [placeholders]="placeholders"
    />
  `,
})
export default class EmailPreviewScenario {
  protected readonly placeholders = PLACEHOLDERS;
}
