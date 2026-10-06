import type { StoryObj } from '@storybook/angular';

import type { Card } from 'components';

export const Padding: StoryObj<Card> = {
  render: () => ({
    template: `
      <div style="max-width: 520px; display: grid; gap: 16px">
        <sd-card>
          <strong>Splash pad at Lakeside Park</strong>
          <span class="sd-text-sm sd-text-soft">Medium padding · ideas and family rows</span>
        </sd-card>
        <sd-card padding="lg">
          <strong>Port Credit Buskerfest</strong>
          <span class="sd-text-sm sd-text-soft">Large padding · a submission in the review queue</span>
        </sd-card>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`padding="lg"` (`.card--pad-lg`) gives document-like cards more air; `md` is the default.',
      },
    },
  },
};
