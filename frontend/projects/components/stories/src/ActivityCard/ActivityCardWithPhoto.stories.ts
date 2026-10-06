import type { StoryObj } from '@storybook/angular';

import type { ActivityCard } from 'components';

import { SAMPLE_PHOTO } from '../Media/media-sample';

export const WithPhoto: StoryObj<ActivityCard & { title: string }> = {
  args: {
    title: 'Terre Bleu Lavender Farm',
    meta: 'Milton',
    why: 'Lavender peaks 17 to 24 May, and Mae is old enough to walk the rows this year.',
    icon: 'tree',
    tone: 'leaf',
    mapUrl: 'https://maps.example.com/terre-bleu',
    media: SAMPLE_PHOTO,
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-activity-card style="max-width: 360px" [title]="title" [meta]="meta" [why]="why" [icon]="icon" [tone]="tone" [mapUrl]="mapUrl" [media]="media">
        <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />45 min</sd-chip>
        <sd-chip slot="chips">All ages</sd-chip>
      </sd-activity-card>
    `,
  }),
};
