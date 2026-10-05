import type { StoryObj } from '@storybook/angular';

import type { DateTile } from 'components';

export const FromDate: StoryObj<DateTile> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
        <sd-date-tile date="2026-05-17" />
        <sd-date-tile date="2026-10-31" />
        <sd-date-tile date="2026-12-03T10:30:00Z" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: '`date` takes an ISO date or date-time. Only the `YYYY-MM-DD` prefix is read and the day drops its leading zero.',
      },
    },
  },
};
