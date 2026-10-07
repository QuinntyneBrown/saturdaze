import type { StoryObj } from '@storybook/angular';

import type { PlaceRow } from 'components';

import { SAMPLE_PHOTO } from '../Media/media-sample';

// No `args`: the `title` input is backed by the `rowTitle` field, and an arg by
// that name would be assigned over the input signal (as in the List Item stories).
export const Default: StoryObj<PlaceRow> = {
  render: () => ({
    props: {
      photo: SAMPLE_PHOTO,
      flags: [{ tone: 'accent', icon: 'check', label: 'Healthy' }],
    },
    template: `
      <sd-list card style="max-width: 640px">
        <sd-place-row title="Terre Bleu Lavender Farm" subtitle="Activity · 2 photos" href="#"
          [photo]="photo" tone="leaf" icon="tree" [flags]="flags" />
      </sd-list>
    `,
  }),
};
