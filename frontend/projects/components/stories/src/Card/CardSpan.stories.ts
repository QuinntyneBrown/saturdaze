import type { StoryObj } from '@storybook/angular';

import type { Card } from 'components';

export const Span: StoryObj<Card> = {
  render: () => ({
    template: `
      <div class="sd-grid-cards sd-grid-cards--2" style="max-width: 760px">
        <sd-card span interactive>
          <div class="sd-cluster sd-cluster--between">
            <strong>Bronte Creek Provincial Park</strong>
            <sd-chip tone="primary">Top pick</sd-chip>
          </div>
          <span class="sd-text-sm sd-text-soft">Oakville · short trail and a splash pad</span>
        </sd-card>
        <sd-card interactive>
          <strong>Royal Botanical Gardens</strong>
          <span class="sd-text-sm sd-text-soft">Burlington</span>
        </sd-card>
        <sd-card interactive>
          <strong>The Rec Room</strong>
          <span class="sd-text-sm sd-text-soft">Square One</span>
        </sd-card>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: '`span` (`.card--span`) stretches across every column of the grid for the one card that leads it. `interactive` adds the hover lift.',
      },
    },
  },
};
