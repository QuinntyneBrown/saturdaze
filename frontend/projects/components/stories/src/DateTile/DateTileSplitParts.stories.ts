import type { StoryObj } from '@storybook/angular';

import type { DateTile } from 'components';

export const SplitParts: StoryObj<DateTile> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
        <sd-date-tile mon="Nov" day="1" />
        <sd-date-tile mon="Oct" day="12" date="2026-01-01" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: { story: 'Pre-split `mon` / `day` render as given and win over `date` (the second tile ignores its January date).' },
    },
  },
};
