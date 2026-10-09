import type { StoryObj } from '@storybook/angular';

import type { EmailPreview } from 'components';

export const MissingSample: StoryObj<EmailPreview> = {
  render: () => ({
    props: {
      placeholders: [
        { name: 'recipientName', value: 'Alex', source: 'builtin' },
        { name: 'giftCode', value: '', source: 'missing' },
      ],
    },
    template: `
      <div style="max-width: 720px">
        <sd-email-preview
          subject="Your code  from Saturdaze"
          preheader="Happy birthday, Alex"
          html="<p style='font-family:Arial,sans-serif;padding:24px'>Hi Alex, here is your code: </p>"
          text="Hi Alex, here is your code: "
          [placeholders]="placeholders"
        />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A placeholder with neither a sample nor a built-in value renders empty and is flagged "No sample value", so the gap shows before the template is used.',
      },
    },
  },
};
