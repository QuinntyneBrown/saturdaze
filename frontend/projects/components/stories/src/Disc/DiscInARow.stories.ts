import type { StoryObj } from '@storybook/angular';

import type { Disc } from 'components';

export const InARow: StoryObj<Disc> = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 16px; max-width: 360px">
        <div style="display: flex; gap: 12px; align-items: center">
          <sd-disc icon="ticket" tone="sun" />
          <div>
            <div style="font-weight: 600">Soccer practice</div>
            <div style="font-size: 13px; color: var(--colorNeutralForeground2)">Saturdays · 9:00–10:30</div>
          </div>
        </div>
        <div style="display: flex; gap: 12px; align-items: center">
          <sd-disc icon="bag" tone="indoor" />
          <div>
            <div style="font-weight: 600">Groceries</div>
            <div style="font-size: 13px; color: var(--colorNeutralForeground2)">Errand · about 45 min</div>
          </div>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Discs lead list rows; the title beside it carries the meaning, since the disc itself is `aria-hidden`.',
      },
    },
  },
};
