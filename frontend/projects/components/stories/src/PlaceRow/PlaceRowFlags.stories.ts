import type { StoryObj } from '@storybook/angular';

import type { PlaceRow } from 'components';

import { SAMPLE_PHOTO } from '../Media/media-sample';

export const Flags: StoryObj<PlaceRow> = {
  render: () => ({
    props: { photo: SAMPLE_PHOTO },
    template: `
      <sd-list card style="max-width: 640px">
        <sd-place-row title="Brogue Inn" subtitle="Restaurant · 0 photos" href="#" tone="sun" icon="fork"
          [flags]="[{ tone: 'warn', label: 'No photo' }]" />
        <sd-place-row title="Snug Harbour" subtitle="Restaurant · 1 photo" href="#" [photo]="photo" tone="sun" icon="fork"
          [flags]="[{ tone: 'sun', label: 'Unreviewed' }]" />
        <sd-place-row title="Ontario Science Centre" subtitle="Activity · 1 photo" href="#" [photo]="photo" tone="leaf" icon="tree"
          [flags]="[{ tone: 'indoor', label: 'Missing alt text' }]" />
        <sd-place-row title="Cirque Mechanics — Pedal Punk" subtitle="Event · 0 photos" href="#" tone="sky" icon="ticket"
          [flags]="[{ tone: 'warn', label: 'No photo' }]" />
      </sd-list>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          "Worst first, as the Places screen sorts them. With no photo the thumbnail is the tinted fallback tile in the catalog's tone; rows keep their dividers between them and none after the last.",
      },
    },
  },
};
