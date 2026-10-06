import type { StoryObj } from '@storybook/angular';

import type { Button } from 'components';

export const Full: StoryObj<Button> = {
  render: () => ({
    template: `
      <div style="max-width: 360px; display: grid; gap: 12px">
        <sd-button full size="lg">Create account</sd-button>
        <sd-button full variant="quiet">Sign in instead</sd-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: '`full` stretches to the container (`.btn--block`) — auth cards and phone sheets.',
      },
    },
  },
};
