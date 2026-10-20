import type { StoryObj } from '@storybook/angular';

import type { PhotoSuggestions } from 'components';

import { SAMPLE_PHOTO } from '../Media/media-sample';

export const Default: StoryObj<PhotoSuggestions> = {
  render: () => ({
    props: {
      selected: 's1',
      tiles: [
        {
          id: 's1',
          src: SAMPLE_PHOTO.src,
          caption: 'Wikimedia Commons',
          label: 'Lavender rows · Wikimedia Commons',
        },
        {
          id: 's2',
          src: SAMPLE_PHOTO.src,
          caption: 'Terre Bleu',
          label: 'Farm at dusk · Terre Bleu',
        },
      ],
    },
    template: `
      <sd-photo-suggestions style="max-width: 520px" label="Suggest photos" placeholder="Lavender fields at golden hour"
        state="done" heading="From the web" [suggestions]="tiles" [selected]="selected" (picked)="selected = $event" />
    `,
  }),
};
