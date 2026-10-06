import type { StoryObj } from '@storybook/angular';

import type { Segments } from 'components';

export const Default: StoryObj<Segments> = {
  args: {
    tabs: [
      { label: 'Activities', link: '/ideas', exact: true },
      { label: 'Food', link: '/ideas/food' },
      { label: 'Events', link: '/ideas/events' },
    ],
    label: 'Idea type',
    narrow: false,
    active: 'Food',
  },
  render: (args) => ({
    props: args,
    template: `<sd-segments [tabs]="tabs" [label]="label" [narrow]="narrow" [active]="active" />`,
  }),
};
