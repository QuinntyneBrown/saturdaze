import type { StoryObj } from '@storybook/angular';

import type { PhotoTile } from 'components';

import { SAMPLE_PHOTO } from '../Media/media-sample';

export const Default: StoryObj<PhotoTile> = {
  args: {
    media: SAMPLE_PHOTO,
    primary: true,
    badges: [
      { tone: 'primary', icon: 'star', label: 'Primary' },
      { tone: 'accent', label: 'Curated' },
      { tone: 'accent', icon: 'check', label: 'Reviewed' },
    ],
    alt: SAMPLE_PHOTO.alt,
    credit: SAMPLE_PHOTO.credit,
    licence: 'CC BY 4.0',
    size: '1200 × 675',
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-photo-tile style="max-width: 340px" [media]="media" [primary]="primary" [badges]="badges"
        [alt]="alt" [credit]="credit" [licence]="licence" [size]="size">
        <sd-button slot="actions" variant="quiet" size="sm"><sd-icon name="edit" />Edit</sd-button>
        <sd-button slot="actions" variant="ghost" size="sm"><sd-icon name="trash" />Remove</sd-button>
      </sd-photo-tile>
    `,
  }),
};
