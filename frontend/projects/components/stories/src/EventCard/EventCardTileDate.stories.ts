import type { StoryObj } from '@storybook/angular';

import type { EventCard } from 'components';

export const TileDate: StoryObj<EventCard> = {
  render: () => ({
    template: `
      <div class="sd-grid-cards sd-grid-cards--2" style="max-width: 760px">
        <sd-event-card title="Cirque Mechanics: Pedal Punk" meta="Living Arts Centre · 2pm matinée" date="2026-05-17">
          <sd-chip slot="chips" tone="indoor">Theatre</sd-chip>
          <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />5 min</sd-chip>
        </sd-event-card>
        <sd-event-card title="Mississauga Symphony: Kids' Concert" meta="Living Arts Centre · 11am" mon="May" day="18">
          <sd-chip slot="chips" tone="indoor">Music</sd-chip>
          <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />5 min</sd-chip>
        </sd-event-card>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The tile reads an ISO `date` ("2026-05-17" → May 17) or pre-split `mon` / `day`; the split parts win when both are given.',
      },
    },
  },
};
