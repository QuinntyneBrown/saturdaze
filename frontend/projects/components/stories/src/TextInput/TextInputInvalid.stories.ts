import type { StoryObj } from '@storybook/angular';

import type { TextInput } from 'components';

export const Invalid: StoryObj<TextInput> = {
  render: () => ({
    template: `
      <div style="max-width: 360px; display: grid; gap: 16px">
        <sd-text-input
          label="Email"
          type="email"
          autocomplete="email"
          value="quinn@saturdaze"
          hint="We send the Friday preview here."
          error="Use an email like name@example.com."
        />
        <sd-text-input label="Password" type="password" autocomplete="current-password" value="password1" invalid />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A non-empty `error` replaces the hint with a `.field__error` line and sets `aria-invalid`. `invalid` flags the field without a message — the sign-in screen does this for both fields when its banner says the credentials were wrong.',
      },
    },
  },
};
