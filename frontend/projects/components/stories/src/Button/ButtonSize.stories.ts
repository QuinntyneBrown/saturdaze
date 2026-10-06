import type { StoryObj } from '@storybook/angular';

import type { Button } from 'components';

export const Size: StoryObj<Button> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
        <sd-button size="sm">Small</sd-button>
        <sd-button size="md">Medium</sd-button>
        <sd-button size="lg">Large</sd-button>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Three sizes: `sm` (dense rows), `md` (default) and `lg` (hero and auth CTAs).' } },
  },
};
