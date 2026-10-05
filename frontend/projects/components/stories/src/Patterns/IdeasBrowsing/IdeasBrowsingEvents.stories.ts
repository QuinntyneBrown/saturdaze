import type { StoryObj } from '@storybook/angular';

import { appShell } from '../shared/shell';
import { IDEAS_STYLES, IDEAS_TABS, ideasHeader } from './ideas';

export const Events: StoryObj = {
  render: () => ({
    props: { tabs: IDEAS_TABS },
    styles: IDEAS_STYLES,
    template: appShell(
      'ideas',
      `
        ${ideasHeader(
          'What is on near Port Credit this weekend.',
          'Events',
          '<sd-button slot="primary" variant="primary"><sd-icon name="plus" />Suggest an event</sd-button>',
        )}
        <sd-filters class="filters" label="Filters">
          <sd-filter-chip pressed>This weekend</sd-filter-chip>
          <sd-filter-chip>Next weekend</sd-filter-chip>
          <span class="sd-vdivider" aria-hidden="true"></span>
          <sd-filter-chip>Festivals</sd-filter-chip>
          <sd-filter-chip>Theatre</sd-filter-chip>
          <sd-filter-chip>Markets</sd-filter-chip>
        </sd-filters>

        <sd-section class="section" title="This weekend" subtitle="17 and 18 May">
          <div class="sd-grid-cards">
            <sd-event-card title="Port Credit Buskerfest" meta="Memorial Park · 11am to 5pm" mon="May" day="17" url="https://example.com/buskerfest">
              <sd-chip slot="chips" tone="leaf">Free</sd-chip>
              <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />9 min</sd-chip>
            </sd-event-card>
            <sd-event-card title="Kids' theatre matinée" meta="Living Arts Centre · 2pm" mon="May" day="18" url="https://example.com/matinee">
              <sd-chip slot="chips" tone="indoor"><sd-icon name="ticket" [size]="13" [stroke]="2" />Tickets</sd-chip>
              <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />5 min</sd-chip>
            </sd-event-card>
            <sd-event-card title="Lakeshore farmers' market" meta="Port Credit · 8am to 1pm · awaiting review" mon="May" day="17" muted>
              <sd-chip slot="chips" tone="sun">Pending</sd-chip>
            </sd-event-card>
          </div>
        </sd-section>
      `,
    ),
  }),
  globals: { viewport: { value: 'desktop' } },
  parameters: {
    docs: {
      description: {
        story:
          'Local events with a date tile. "Suggest an event" is the one primary action on this segment; a pending submission you suggested shows `muted` until an admin approves it.',
      },
    },
  },
};
