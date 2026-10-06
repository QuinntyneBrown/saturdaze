import type { StoryObj } from '@storybook/angular';

import type { Card } from 'components';

export const Variant: StoryObj<Card> = {
  render: () => ({
    template: `
      <div class="sd-grid-cards sd-grid-cards--2" style="max-width: 720px">
        <sd-card>
          <strong>Default</strong>
          <span class="sd-text-sm sd-text-soft">White surface on the cream page.</span>
        </sd-card>
        <sd-card variant="sunk">
          <strong>Sunk</strong>
          <span class="sd-text-sm sd-text-soft">Recessed panel inside a surface.</span>
        </sd-card>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`variant="sunk"` (`.card--sunk`) drops the card into the recessed surface for panels nested inside a dialog or another card.',
      },
    },
  },
};
