import type { StoryObj } from '@storybook/angular';

import type { Chip } from 'components';

export const Count: StoryObj<Chip> = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 8px; font-weight: 600">
        Review submissions <sd-chip tone="sun" count>3</sd-chip>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`count` centres a number in a pill at least as wide as it is tall (`.chip--count`).',
      },
    },
  },
};
