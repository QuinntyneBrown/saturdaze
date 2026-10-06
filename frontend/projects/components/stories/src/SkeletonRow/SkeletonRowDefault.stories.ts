import type { StoryObj } from '@storybook/angular';

import type { SkeletonRow } from 'components';

export const Default: StoryObj<SkeletonRow> = {
  render: () => ({
    template: `
      <div style="max-width: 560px">
        <sd-skeleton-row />
      </div>
    `,
  }),
};
