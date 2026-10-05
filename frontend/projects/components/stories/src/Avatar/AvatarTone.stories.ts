import type { StoryObj } from '@storybook/angular';

import type { Avatar } from 'components';

export const Tone: StoryObj<Avatar> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
        <sd-avatar name="Quinn" tone="primary" />
        <sd-avatar name="Sara" tone="leaf" />
        <sd-avatar name="Eli" tone="sky" />
        <sd-avatar name="Mae" tone="sun" />
        <sd-avatar name="Grandma Jo" tone="indoor" />
        <sd-avatar name="Guest" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Person tones: Quinn `primary`, Sara `leaf`, Eli `sky`, Mae `sun`, then `indoor`; `default` is the neutral recessed disc.',
      },
    },
  },
};
