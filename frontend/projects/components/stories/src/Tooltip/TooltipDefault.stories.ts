import type { StoryObj } from '@storybook/angular';

import type { Tooltip } from 'components';

export const Default: StoryObj<Tooltip> = {
  render: () => ({
    template: `
      <div style="padding: 48px 0 0">
        <sd-button variant="ghost" icon label="Swap Riverwood Conservancy" tooltip="Swap for something else">
          <sd-icon name="swap" />
        </sd-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Hover or tab to the button. The hint appears after a short delay on hover and at once on keyboard focus; Escape, blur, pointer-out or a press dismisses it.',
      },
    },
  },
};
