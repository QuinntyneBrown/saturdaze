import type { StoryObj } from '@storybook/angular';

import type { TextInput } from 'components';

export const Multiline: StoryObj<TextInput> = {
  render: () => ({
    template: `
      <div style="max-width: 420px">
        <sd-text-input
          label="What's happening"
          multiline
          [rows]="4"
          placeholder="Free pancake breakfast at the fire hall, 8–11am. Kids eat free."
          hint="A sentence or two. Families see this on the event card."
        />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`multiline` swaps the input for a `<textarea>`; `rows` sets its starting height (default 3).',
      },
    },
  },
};
