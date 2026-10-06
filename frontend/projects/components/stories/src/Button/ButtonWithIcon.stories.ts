import type { StoryObj } from '@storybook/angular';

import type { Button } from 'components';

export const WithIcon: StoryObj<Button> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
        <sd-button><sd-icon slot="leading" name="sparkle" />Plan my weekend</sd-button>
        <sd-button variant="quiet"><sd-icon slot="leading" name="lock" />Lock day</sd-button>
        <sd-button variant="ghost">See all ideas<sd-icon slot="trailing" name="arrow_right" /></sd-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Project an `sd-icon` into `[slot=leading]` or `[slot=trailing]`; it inherits the label colour.',
      },
    },
  },
};
