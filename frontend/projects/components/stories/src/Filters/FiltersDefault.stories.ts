import type { StoryObj } from '@storybook/angular';

import type { Filters } from 'components';

export const Default: StoryObj<Filters> = {
  args: {
    label: 'Kind of idea',
    scroll: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-filters [label]="label" [scroll]="scroll">
        <sd-filter-chip pressed>All</sd-filter-chip>
        <sd-filter-chip tone="leaf">Outdoor</sd-filter-chip>
        <sd-filter-chip tone="indoor">Indoor</sd-filter-chip>
        <sd-filter-chip tone="sun">Seasonal</sd-filter-chip>
        <sd-filter-chip tone="sky">Weather-safe</sd-filter-chip>
      </sd-filters>
    `,
  }),
};
