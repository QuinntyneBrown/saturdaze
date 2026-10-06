import type { StoryObj } from '@storybook/angular';

import type { PastCard } from 'components';

export const Default: StoryObj<PastCard & { title: string }> = {
  args: {
    title: 'Bronte Creek + Rec Room',
    dateRange: '10 – 11 May 2026',
    rating: 5,
    favourite: true,
    highlights: 'Mae found a frog. Eli won the basketball arcade. Pasta night was a hit.',
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-past-card
        style="max-width: 360px"
        [title]="title"
        [dateRange]="dateRange"
        [rating]="rating"
        [favourite]="favourite"
        [highlights]="highlights"
      />
    `,
  }),
};
