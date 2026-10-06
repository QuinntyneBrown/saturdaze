import type { StoryObj } from '@storybook/angular';

import type { DateTile } from 'components';

export const InARow: StoryObj<DateTile> = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px; align-items: center; max-width: 360px">
        <sd-date-tile date="2026-10-17" />
        <div>
          <div style="font-weight: 600">Pumpkin patch &amp; corn maze</div>
          <div style="font-size: 13px; color: var(--colorNeutralForeground2)">Sat, Oct 17 · 10:00 · 25 min drive</div>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The tile leads an event row; the meta text beside it carries the full date for screen readers.',
      },
    },
  },
};
