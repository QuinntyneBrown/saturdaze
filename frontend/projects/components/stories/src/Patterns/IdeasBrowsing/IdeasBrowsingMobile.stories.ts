import type { StoryObj } from '@storybook/angular';

import { appShell } from '../shared/shell';
import { IDEAS_STYLES, IDEAS_TABS, ideasHeader } from './ideas';

export const Mobile: StoryObj = {
  render: () => ({
    props: { tabs: IDEAS_TABS },
    styles: IDEAS_STYLES,
    template: appShell(
      'ideas',
      `
        ${ideasHeader('Picked for Eli and Mae, under 45 minutes from Port Credit.', 'Activities')}
        <sd-filters class="filters" label="Filters">
          <sd-filter-chip pressed>All</sd-filter-chip>
          <sd-filter-chip tone="leaf">Outdoor</sd-filter-chip>
          <sd-filter-chip tone="indoor">Indoor</sd-filter-chip>
          <sd-filter-chip>Under 30 min</sd-filter-chip>
          <sd-filter-chip>Ages 5+</sd-filter-chip>
          <sd-filter-chip tone="sky">Weather-safe</sd-filter-chip>
        </sd-filters>
        <sd-section class="section" title="Right for this weekend's weather" subtitle="Sunny Saturday, 22°">
          <div class="sd-grid-cards">
            <sd-activity-card title="Terre Bleu Lavender Farm" meta="Milton" icon="tree" tone="leaf"
              why="Lavender peaks 17 to 24 May, and Mae is old enough to walk the rows this year." mapUrl="https://maps.example.com/terre-bleu">
              <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />45 min</sd-chip>
              <sd-chip slot="chips">All ages</sd-chip>
            </sd-activity-card>
            <sd-activity-card title="The Rec Room" meta="Square One" icon="popcorn" tone="indoor"
              why="Bowling, arcade and dinner under one roof. Eli asked for it twice last week." mapUrl="https://maps.example.com/rec-room">
              <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />10 min</sd-chip>
            </sd-activity-card>
          </div>
        </sd-section>
      `,
    ),
  }),
  globals: { viewport: { value: 'mobile' } },
  parameters: {
    docs: {
      description: {
        story: 'On phones the filters become a full-bleed horizontal scroller (`.scroller-x`) with faded edges, and cards stack in one column.',
      },
    },
  },
};
