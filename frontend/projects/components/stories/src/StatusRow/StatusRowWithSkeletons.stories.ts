import type { StoryObj } from '@storybook/angular';

import type { StatusRow } from 'components';

export const WithSkeletons: StoryObj<StatusRow> = {
  render: () => ({
    template: `
      <div style="max-width: 560px">
        <sd-status-row>Working through your locks, the forecast and past weekends.</sd-status-row>
        <sd-skeleton-row />
        <sd-skeleton-row />
        <sd-skeleton-row />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'The weekend generating state: the status row announces the work while skeleton rows hold the shape of the day.',
      },
    },
  },
};
