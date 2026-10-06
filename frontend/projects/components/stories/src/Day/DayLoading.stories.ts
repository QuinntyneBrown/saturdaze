import type { StoryObj } from '@storybook/angular';

import type { Day } from 'components';

export const Loading: StoryObj<Day> = {
  render: () => ({
    template: `
      <sd-day style="max-width: 560px" title="Saturday" [actions]="false" aria-busy="true">
        <sd-skeleton-row />
        <sd-skeleton-row />
        <sd-skeleton-row />
        <sd-skeleton-row />
      </sd-day>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'While the weekend loads or generates, the page turns `actions` off and fills the day with `sd-skeleton-row`s.',
      },
    },
  },
};
