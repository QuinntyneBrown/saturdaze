import type { StoryObj } from '@storybook/angular';

import type { FilterChip } from 'components';

export const WithIcon: StoryObj<FilterChip> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        <sd-filter-chip tone="primary" pressed><sd-icon name="heart" filled />Saved</sd-filter-chip>
        <sd-filter-chip tone="sun"><sd-icon name="star" />5★ weekends</sd-filter-chip>
        <sd-filter-chip tone="accent"><sd-icon name="car" />Under 15 min</sd-filter-chip>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Project an `sd-icon` before the label; the chip sizes it to 14px and it inherits the label colour.' } },
  },
};
