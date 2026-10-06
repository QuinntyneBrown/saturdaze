import type { StoryObj } from '@storybook/angular';

import type { Tooltip } from 'components';

export const WithVisibleText: StoryObj<Tooltip> = {
  render: () => ({
    template: `
      <div style="padding: 48px 0 0">
        <sd-button variant="quiet" tooltip="Adds every block to your calendar app">
          <sd-icon name="calendar" />
          Add to calendar
        </sd-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'On a button with visible text the tooltip is extra detail, not the name: it is wired to the button with `aria-describedby` while it shows.',
      },
    },
  },
};
