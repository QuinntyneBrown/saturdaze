import type { StoryObj } from '@storybook/angular';

import type { EmailPreview } from 'components';

import { SAMPLE_HTML, SAMPLE_PLACEHOLDERS, SAMPLE_TEXT } from './email-preview-sample';

export const Default: StoryObj<EmailPreview> = {
  args: {
    subject: 'Reset your Saturdaze password',
    preheader: 'The link works for 60 minutes.',
    html: SAMPLE_HTML,
    text: SAMPLE_TEXT,
    placeholders: SAMPLE_PLACEHOLDERS,
    error: '',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 720px">
        <sd-email-preview
          [subject]="subject"
          [preheader]="preheader"
          [html]="html"
          [text]="text"
          [placeholders]="placeholders"
          [error]="error"
        />
      </div>
    `,
  }),
};
