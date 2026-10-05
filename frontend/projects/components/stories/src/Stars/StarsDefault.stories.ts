import type { StoryObj } from '@storybook/angular';

import type { Stars } from 'components';

export const Default: StoryObj<Stars> = {
  args: {
    rating: 4,
    label: '4 of 5',
    size: 'md',
    editable: false,
    groupLabel: 'Rating',
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-stars
        [rating]="rating"
        [label]="label"
        [size]="size"
        [editable]="editable"
        [groupLabel]="groupLabel"
        (ratingChange)="rating = $event"
      />
    `,
  }),
};
