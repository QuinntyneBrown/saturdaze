import type { StoryObj } from '@storybook/angular';

import type { Leg } from 'components';

export const Short: StoryObj<Leg> = {
  args: {
    label: '5 min · 2 km home',
    ariaLabel: 'Travel: 5 minutes, 2 kilometres home',
  },
  render: (args) => ({
    props: args,
    template: `<div role="list" style="max-width: 560px"><sd-leg [label]="label" [ariaLabel]="ariaLabel" /></div>`,
  }),
};
