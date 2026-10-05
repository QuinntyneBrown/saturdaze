import type { StoryObj } from '@storybook/angular';

import type { ActivityCard } from 'components';

export const Default: StoryObj<ActivityCard> = {
  args: {
    cardTitle: 'Bronte Creek Provincial Park',
    meta: 'Oakville',
    why: 'Short trail, washrooms, picnic tables. Your usual win, with a splash pad if it gets hot.',
    icon: 'tree',
    tone: 'leaf',
    mapUrl: 'https://maps.example.com/bronte-creek',
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-activity-card style="max-width: 360px" [title]="cardTitle" [meta]="meta" [why]="why" [icon]="icon" [tone]="tone" [mapUrl]="mapUrl">
        <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />25 min</sd-chip>
        <sd-chip slot="chips">Ages 5+</sd-chip>
      </sd-activity-card>
    `,
  }),
};
