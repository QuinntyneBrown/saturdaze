import type { StoryObj } from '@storybook/angular';

import type { PasswordRules } from 'components';

export const AllMet: StoryObj<PasswordRules> = {
  args: {
    rules: [
      { label: '8 or more characters', met: true },
      { label: 'A number or symbol', met: true },
    ],
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 360px">
        <sd-password-rules [rules]="rules" />
      </div>
    `,
  }),
};
