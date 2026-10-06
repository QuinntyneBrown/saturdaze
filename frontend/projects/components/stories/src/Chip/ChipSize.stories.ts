import type { StoryObj } from '@storybook/angular';

import type { Chip } from 'components';

export const Size: StoryObj<Chip> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
        <sd-chip tone="sun">Pending review</sd-chip>
        <sd-chip tone="sun" size="sm">Pending review</sd-chip>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: '`md` (24px, default) on cards; `sm` (20px) in dense rows such as the review queue.' } },
  },
};
