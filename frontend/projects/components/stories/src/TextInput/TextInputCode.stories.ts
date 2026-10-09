import type { StoryObj } from '@storybook/angular';

import type { TextInput } from 'components';

export const Code: StoryObj<TextInput> = {
  render: () => ({
    template: `
      <div style="max-width: 560px">
        <sd-text-input
          label="HTML body"
          multiline
          code
          [rows]="6"
          required
          value="<p>Hi {{ '{{' }}recipientName{{ '}}' }},</p>\n<p>Your weekend plan is ready.</p>"
          hint="No scripts, frames, forms or on… event attributes."
        />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`code` sets source text in monospace without wrapping or spellcheck — the email template editor uses it for the HTML and plain-text bodies.',
      },
    },
  },
};
