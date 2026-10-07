import type { StoryObj } from '@storybook/angular';

import type { PlaceRow } from 'components';

import { SAMPLE_PHOTO } from '../Media/media-sample';

export const Default: StoryObj<PlaceRow> = {
  args: {
    rowTitle: 'Terre Bleu Lavender Farm',
    subtitle: 'Activity · 2 photos',
    href: '#',
    photo: SAMPLE_PHOTO,
    tone: 'leaf',
    icon: 'tree',
    flags: [{ tone: 'accent', icon: 'check', label: 'Healthy' }],
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-list card style="max-width: 640px">
        <sd-place-row [title]="rowTitle" [subtitle]="subtitle" [href]="href" [photo]="photo"
          [tone]="tone" [icon]="icon" [flags]="flags" />
      </sd-list>
    `,
  }),
};
