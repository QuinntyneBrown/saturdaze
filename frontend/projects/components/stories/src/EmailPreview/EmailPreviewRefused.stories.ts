import type { StoryObj } from '@storybook/angular';

import type { EmailPreview } from 'components';

import { SAMPLE_HTML, SAMPLE_PLACEHOLDERS, SAMPLE_TEXT } from './email-preview-sample';

export const Refused: StoryObj<EmailPreview> = {
  render: () => ({
    props: { html: SAMPLE_HTML, text: SAMPLE_TEXT, placeholders: SAMPLE_PLACEHOLDERS },
    template: `
      <div style="max-width: 720px">
        <sd-email-preview
          subject="Reset your Saturdaze password"
          preheader="The link works for 60 minutes."
          [html]="html"
          [text]="text"
          [placeholders]="placeholders"
          error="Scripts, frames, forms and on… event attributes aren't allowed in an email. Remove them and save again."
        />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`error` explains why the preview could not refresh; the last good render stays underneath it.',
      },
    },
  },
};
