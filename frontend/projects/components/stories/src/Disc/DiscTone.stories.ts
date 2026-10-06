import type { StoryObj } from '@storybook/angular';

import type { Disc } from 'components';

export const Tone: StoryObj<Disc> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
        <sd-disc icon="calendar" />
        <sd-disc icon="lock" tone="accent" />
        <sd-disc icon="mail" tone="primary" />
        <sd-disc icon="key" tone="warn" />
        <sd-disc icon="ticket" tone="sun" />
        <sd-disc icon="rain" tone="sky" />
        <sd-disc icon="tree" tone="leaf" />
        <sd-disc icon="bag" tone="indoor" />
        <sd-disc icon="pin" tone="surface" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Nine tones: the neutral default, `accent`, `primary`, `warn`, the activity hues `sun` / `sky` / `leaf` / `indoor`, and `surface` (white with a hairline) for recessed backgrounds.',
      },
    },
  },
};
