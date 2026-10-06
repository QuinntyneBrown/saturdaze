import type { StoryObj } from '@storybook/angular';

import type { Cover } from 'components';

export const Fallback: StoryObj<Cover & { title: string }> = {
  args: {
    eyebrow: '16 – 17 May',
    title: 'This weekend',
    subtitle: 'A quiet Saturday at home, a cloudy Sunday for the Rec Room.',
  },
  render: (args) => ({
    props: args,
    template: `<sd-cover [media]="null" [eyebrow]="eyebrow" [title]="title" [subtitle]="subtitle" />`,
  }),
};
