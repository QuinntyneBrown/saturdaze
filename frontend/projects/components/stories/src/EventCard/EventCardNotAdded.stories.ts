import type { StoryObj } from '@storybook/angular';

import type { EventCard } from 'components';

export const NotAdded: StoryObj<EventCard> = {
  render: () => ({
    template: `
      <sd-event-card
        style="max-width: 360px"
        muted
        dismissable
        title="Lakeshore Ribfest"
        meta="Memorial Park · Sun 12pm to 8pm"
        date="2026-06-21"
        note="Already listed as Port Credit Ribfest."
      >
        <sd-chip slot="chips" tone="warn">Not added</sd-chip>
      </sd-event-card>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A suggestion an administrator did not add (L2-149): `note` gives the reason under the chips and `dismissable` offers "Dismiss", named for the event, which emits `dismiss`.',
      },
    },
  },
};
