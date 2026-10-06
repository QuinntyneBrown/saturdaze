import type { StoryObj } from '@storybook/angular';

import type { Filters } from 'components';

export const Scroll: StoryObj<Filters> = {
  render: () => ({
    template: `
      <div style="max-width: 360px; --layoutGutter: 16px">
        <sd-filters label="Kind of event">
          <sd-filter-chip pressed>All</sd-filter-chip>
          <sd-filter-chip tone="leaf">Festivals</sd-filter-chip>
          <sd-filter-chip tone="indoor">Theatre</sd-filter-chip>
          <sd-filter-chip tone="sun">Seasonal</sd-filter-chip>
          <sd-filter-chip tone="sky">Weather-safe</sd-filter-chip>
          <sd-filter-chip>Ages 5+</sd-filter-chip>
          <sd-filter-chip>Under 30 min</sd-filter-chip>
        </sd-filters>
      </div>
    `,
  }),
  globals: { viewport: { value: 'mobile', isRotated: false } },
  parameters: {
    docs: {
      description: {
        story:
          '`scroll` (default) is `.scroller-x`: one line that scrolls sideways with faded edges on phones and wraps from tablet up. The canvas opens at the Mobile viewport so the scroller shows.',
      },
    },
  },
};
