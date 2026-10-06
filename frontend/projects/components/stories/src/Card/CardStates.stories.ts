import type { StoryObj } from '@storybook/angular';

import type { Card } from 'components';

export const States: StoryObj<Card> = {
  render: () => ({
    template: `
      <div class="sd-grid-cards">
        <sd-card locked>
          <strong>La Marina</strong>
          <span class="sd-text-sm sd-text-soft">Mediterranean · Patio</span>
          <div class="sd-cluster">
            <sd-chip tone="accent"><sd-icon name="lock" [size]="13" [stroke]="2" />Locked for lunch</sd-chip>
          </div>
        </sd-card>
        <sd-card dimmed>
          <strong>Symposium Café</strong>
          <span class="sd-text-sm sd-text-soft">Brunch · Family booths</span>
        </sd-card>
        <sd-card muted>
          <strong>Port Credit Buskerfest</strong>
          <span class="sd-text-sm sd-text-soft">Lakeshore Rd · Sat 2pm to 9pm</span>
          <div class="sd-cluster"><sd-chip tone="sun">Pending review</sd-chip></div>
        </sd-card>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          "`locked` draws the 2px accent border of a locked pick, `dimmed` fades its siblings to 60%, and `muted` (85%) marks the family's own pending suggestion. Pair each with a chip that says the state.",
      },
    },
  },
};
