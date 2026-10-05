import type { StoryObj } from '@storybook/angular';

import type { Strength } from 'components';

export const Level: StoryObj<Strength> = {
  render: () => ({
    template: `
      <div style="max-width: 360px; display: grid; gap: 20px">
        <sd-strength level="weak" label="Weak · eight characters or more." />
        <sd-strength level="ok" label="OK · eight characters or more. Add a capital letter to make it strong." />
        <sd-strength level="strong" label="Strong." />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: '`weak` fills one segment, `ok` two and `strong` all three, each in its own tone. A `null` level leaves the bar empty.',
      },
    },
  },
};
