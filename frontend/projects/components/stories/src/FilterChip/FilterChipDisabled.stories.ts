import type { StoryObj } from '@storybook/angular';

import type { FilterChip } from 'components';

export const Disabled: StoryObj<FilterChip> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        <sd-filter-chip disabled>Dinner</sd-filter-chip>
        <sd-filter-chip disabled pressed>Lunch</sd-filter-chip>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`disabled` sets the native attribute, fades the chip and swallows clicks — `pressedChange` never fires.',
      },
    },
  },
};
