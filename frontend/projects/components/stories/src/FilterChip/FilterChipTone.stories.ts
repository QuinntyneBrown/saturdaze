import type { StoryObj } from '@storybook/angular';

import type { FilterChip } from 'components';

export const Tone: StoryObj<FilterChip> = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 12px">
        <div style="display: flex; flex-wrap: wrap; gap: 8px">
          <sd-filter-chip>All</sd-filter-chip>
          <sd-filter-chip tone="leaf">Outdoor</sd-filter-chip>
          <sd-filter-chip tone="indoor">Indoor</sd-filter-chip>
          <sd-filter-chip tone="sky">Weather-safe</sd-filter-chip>
          <sd-filter-chip tone="sun">Seasonal</sd-filter-chip>
          <sd-filter-chip tone="accent">Free</sd-filter-chip>
          <sd-filter-chip tone="primary">Favourites</sd-filter-chip>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px">
          <sd-filter-chip pressed>All</sd-filter-chip>
          <sd-filter-chip pressed tone="leaf">Outdoor</sd-filter-chip>
          <sd-filter-chip pressed tone="indoor">Indoor</sd-filter-chip>
          <sd-filter-chip pressed tone="sky">Weather-safe</sd-filter-chip>
          <sd-filter-chip pressed tone="sun">Seasonal</sd-filter-chip>
          <sd-filter-chip pressed tone="accent">Free</sd-filter-chip>
          <sd-filter-chip pressed tone="primary">Favourites</sd-filter-chip>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Off (top row) every tone is the same outline; the tone only shows once pressed (bottom row). `default` fills with ink.',
      },
    },
  },
};
