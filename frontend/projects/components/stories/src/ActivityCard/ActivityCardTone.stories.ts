import type { StoryObj } from '@storybook/angular';

import type { ActivityCard } from 'components';

export const Tone: StoryObj<ActivityCard> = {
  render: () => ({
    template: `
      <div class="sd-grid-cards sd-grid-cards--2" style="max-width: 760px">
        <sd-activity-card
          title="Terre Bleu Lavender Farm"
          meta="Milton"
          icon="tree"
          tone="leaf"
          why="Lavender peaks 17 to 24 May, and Mae is old enough to walk the rows this year."
        >
          <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />45 min</sd-chip>
          <sd-chip slot="chips">All ages</sd-chip>
        </sd-activity-card>
        <sd-activity-card
          title="The Rec Room"
          meta="Square One"
          icon="popcorn"
          tone="indoor"
          why="Bowling, arcade and dinner under one roof. Eli asked for it twice last week."
        >
          <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />10 min</sd-chip>
          <sd-chip slot="chips">All ages</sd-chip>
        </sd-activity-card>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`tone="leaf"` for outdoor activities, `tone="indoor"` for the rainy-day backups. Pair each with a matching `icon`.',
      },
    },
  },
};
