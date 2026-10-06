import type { StoryObj } from '@storybook/angular';

import type { Spinner } from 'components';

export const Size: StoryObj<Spinner> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center">
        <sd-spinner size="sm" />
        <sd-spinner />
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: '`sm` is 20px with a 2px ring (`.spinner--sm`); `md` is the 40px default with a 3px ring.' } },
  },
};
