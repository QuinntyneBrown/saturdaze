import type { StoryObj } from '@storybook/angular';

import type { PastCard } from 'components';

export const Unrated: StoryObj<PastCard> = {
  render: () => ({
    template: `
      <sd-past-card style="max-width: 360px" title="Lavender + La Marina" dateRange="17 – 18 May 2026" />
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'A weekend that just ended: `rating` is `null`, so the stars read "Rate it", and there are no highlights yet.',
      },
    },
  },
};
