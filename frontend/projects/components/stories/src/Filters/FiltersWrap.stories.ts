import type { StoryObj } from '@storybook/angular';

import type { Filters } from 'components';

export const Wrap: StoryObj<Filters> = {
  render: () => ({
    template: `
      <div style="max-width: 320px">
        <sd-filters label="Meal" [scroll]="false">
          <sd-filter-chip pressed>Lunch</sd-filter-chip>
          <sd-filter-chip>Dinner</sd-filter-chip>
          <sd-filter-chip>Brunch</sd-filter-chip>
          <sd-filter-chip>Under 15 min</sd-filter-chip>
          <sd-filter-chip>Under 30 min</sd-filter-chip>
        </sd-filters>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'With `scroll` off the row is `.filters` and always wraps — use it inside cards and dialogs.',
      },
    },
  },
};
