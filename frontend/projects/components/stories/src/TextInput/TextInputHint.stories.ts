import type { StoryObj } from '@storybook/angular';

import type { TextInput } from 'components';

export const Hint: StoryObj<TextInput> = {
  render: () => ({
    template: `
      <div style="max-width: 360px; display: grid; gap: 16px">
        <sd-text-input label="Family name" placeholder="The Browns" hint="How we greet you." required />
        <sd-text-input
          label="Password"
          type="password"
          autocomplete="new-password"
          hint="Eight characters or more."
        />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`hint` renders a `.field__hint` line under the input and is linked through `aria-describedby`. `required` adds the quiet "Required" marker to the label.',
      },
    },
  },
};
