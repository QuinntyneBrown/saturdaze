import type { StoryObj } from '@storybook/angular';

import type { Tooltip } from 'components';

export const IconButtons: StoryObj<Tooltip> = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 2px; padding: 48px 0 0">
        <sd-button variant="ghost" size="sm" icon label="Why this: Riverwood Conservancy" tooltip="Why this pick?">
          <sd-icon name="sparkle" />
        </sd-button>
        <sd-button variant="ghost" size="sm" icon label="Swap Riverwood Conservancy" tooltip="Swap for something else">
          <sd-icon name="swap" />
        </sd-button>
        <sd-button variant="ghost" size="sm" icon label="Lock Riverwood Conservancy" tooltip="Lock — keep when regenerating">
          <sd-icon name="lock" />
        </sd-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          "A block row's actions. Every icon-only `sd-button` shows its `label` as a tooltip; pass a shorter `tooltip` when the label carries context (the block title) that the row already shows. Once one hint is open, moving along the row shows the next without the delay.",
      },
    },
  },
};
