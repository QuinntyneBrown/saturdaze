import type { StoryObj } from '@storybook/angular';

import type { EventCard } from 'components';

export const Pending: StoryObj<EventCard> = {
  render: () => ({
    template: `
      <sd-event-card
        style="max-width: 360px"
        muted
        title="Port Credit Buskerfest"
        meta="Lakeshore Rd · Sat 2pm to 9pm"
        date="2026-06-20"
        url="https://example.com/port-credit-buskerfest-2026"
      >
        <sd-chip slot="chips" tone="sun">Pending review</sd-chip>
        <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />2 min</sd-chip>
      </sd-event-card>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          "`muted` (`.card--muted`) is the family's own suggestion awaiting review: 85% opacity and no Details button, even with a `url`.",
      },
    },
  },
};
