import type { StoryObj } from '@storybook/angular';

import type { ActivityCard } from 'components';

export const WithMap: StoryObj<ActivityCard> = {
  render: () => ({
    template: `
      <div class="sd-grid-cards sd-grid-cards--2" style="max-width: 760px">
        <sd-activity-card
          title="Royal Botanical Gardens"
          meta="Burlington"
          why="Tulip festival in bloom. Paved paths, so the wagon works."
          mapUrl="https://maps.example.com/royal-botanical-gardens"
        >
          <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />35 min</sd-chip>
        </sd-activity-card>
        <sd-activity-card
          title="Lakeside Park splash pad"
          meta="Port Credit"
          why="Five minutes away and shaded by noon. Bring towels; there's no change room."
        >
          <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />5 min</sd-chip>
        </sd-activity-card>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: { story: 'With `mapUrl` the footer adds a quiet "Map" button that opens in a new tab; without it the card ends at the chips.' },
    },
  },
};
