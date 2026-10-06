import type { StoryObj } from '@storybook/angular';

import type { PastCard } from 'components';

export const AddAPhoto: StoryObj<PastCard & { title: string }> = {
  args: {
    title: 'Rainy Rec Room',
    dateRange: '5 – 6 Apr 2026',
    rating: 2,
    favourite: false,
    highlights: 'Too loud for Mae, too long a queue for the lanes.',
    cover: null,
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
        [cover]="cover"
      />
    `,
  }),
};
