import type { StoryObj } from '@storybook/angular';

import type { PastCard } from 'components';

export const WithDate: StoryObj<PastCard> = {
  render: () => ({
    template: `
      <sd-past-card
        style="max-width: 360px"
        title="Bronte Creek + Rec Room"
        dateRange="10 – 11 May 2026"
        [rating]="5"
        highlights="Mae found a frog. Eli won the basketball arcade."
        [dates]="['Sunday dinner at Snug Harbour · Quinn and Sara']"
      />
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A weekend that included a couple\'s date (L2-225): `dates` adds one "Date" line per date, under the highlights.',
      },
    },
  },
};
