import type { StoryObj } from '@storybook/angular';

import type { Button } from 'components';

export const IconOnly: StoryObj<Button> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
        <sd-button variant="quiet" icon label="Regenerate"><sd-icon name="refresh" /></sd-button>
        <sd-button variant="ghost" icon label="More actions"><sd-icon name="more" /></sd-button>
        <sd-button variant="danger" icon label="Delete"><sd-icon name="trash" /></sd-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`icon` renders the square `.btn--icon`. It has no visible text, so `label` is required — it becomes the `aria-label` and the tooltip shown on hover and keyboard focus (see Tooltip).',
      },
    },
  },
};
