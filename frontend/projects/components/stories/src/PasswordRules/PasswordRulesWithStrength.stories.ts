import type { StoryObj } from '@storybook/angular';

import type { PasswordRules } from 'components';

export const WithStrength: StoryObj<PasswordRules> = {
  render: () => ({
    template: `
      <div style="max-width: 360px; display: flex; flex-direction: column; gap: 6px">
        <sd-password-rules
          [rules]="[
            { label: '8 or more characters', met: true },
            { label: 'A number or symbol', met: false },
          ]"
        />
        <sd-strength level="ok" label="OK." />
      </div>
    `,
  }),
};
