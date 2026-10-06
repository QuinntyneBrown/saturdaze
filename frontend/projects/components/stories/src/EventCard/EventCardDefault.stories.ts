import type { StoryObj } from '@storybook/angular';

import type { EventCard } from 'components';

export const Default: StoryObj<EventCard & { title: string }> = {
  args: {
    title: 'Terre Bleu Lavender Bloom Opening',
    meta: 'Milton · 10am to 5pm',
    date: '2026-05-17',
    mon: '',
    day: '',
    muted: false,
    url: 'https://example.com/terre-bleu-bloom',
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-event-card style="max-width: 360px" [title]="title" [meta]="meta" [date]="date" [mon]="mon" [day]="day" [muted]="muted" [url]="url">
        <sd-chip slot="chips" tone="sun">Seasonal</sd-chip>
        <sd-chip slot="chips" tone="leaf">Outdoor</sd-chip>
        <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />45 min</sd-chip>
      </sd-event-card>
    `,
  }),
};
