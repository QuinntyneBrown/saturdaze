import type { StoryObj } from '@storybook/angular';

import type { Chip } from 'components';

export const Tone: StoryObj<Chip> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
        <sd-chip>All ages</sd-chip>
        <sd-chip tone="sun">Seasonal</sd-chip>
        <sd-chip tone="sky">22° · Sunny</sd-chip>
        <sd-chip tone="leaf">Outdoor</sd-chip>
        <sd-chip tone="indoor">Theatre</sd-chip>
        <sd-chip tone="accent">Locked</sd-chip>
        <sd-chip tone="primary">Top pick</sd-chip>
        <sd-chip tone="warn">Drives over 60 min</sd-chip>
        <sd-chip tone="ink">New</sd-chip>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Nine tones. `default` is the neutral recessed chip; `sun`, `sky`, `leaf` and `indoor` follow the activity hues; `accent`, `primary`, `warn` and `ink` mark state.',
      },
    },
  },
};
