import type { StoryObj } from '@storybook/angular';

import type { SkeletonRow } from 'components';

export const Stack: StoryObj<SkeletonRow> = {
  render: () => ({
    template: `
      <div style="max-width: 560px">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 4px">Saturday</h3>
        <sd-skeleton-row />
        <sd-skeleton-row />
        <sd-skeleton-row />
        <sd-skeleton-row />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: { story: 'A day loading: four rows stand in for the morning, lunch, afternoon and dinner blocks.' },
    },
  },
};
