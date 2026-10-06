import type { StoryObj } from '@storybook/angular';

import type { BottomNav } from 'components';

export const Xsmall: StoryObj<BottomNav> = {
  name: '320px phone',
  render: () => ({
    template: `<sd-bottom-nav active="family" />`,
  }),
  globals: { viewport: { value: 'xsmall' } },
  parameters: {
    docs: {
      description: {
        story: 'At the 320px floor the four `minmax(0, 1fr)` columns still fit their one-word labels without truncation.',
      },
    },
  },
};
