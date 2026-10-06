import type { StoryObj } from '@storybook/angular';

import type { PastCard } from 'components';

export const Grid: StoryObj<PastCard> = {
  render: () => ({
    template: `
      <div class="sd-grid-cards">
        <sd-past-card
          favourite
          title="Bronte Creek + Rec Room"
          dateRange="10 – 11 May 2026"
          [rating]="5"
          highlights="Mae found a frog. Eli won the basketball arcade. Pasta night was a hit."
        />
        <sd-past-card
          title="Zoo + lavender preview"
          dateRange="26 – 27 Apr 2026"
          [rating]="4"
          highlights="First lavender sprouts. Kids tired by 3pm, so pace the next one."
        />
        <sd-past-card
          title="Rainy Rec Room"
          dateRange="5 – 6 Apr 2026"
          [rating]="2"
          highlights="Too loud for Mae, too long a queue for the lanes. Skipping it for a while."
        />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The Past screen: newest first in `sd-grid-cards`, favourites marked with the filled heart.',
      },
    },
  },
};
