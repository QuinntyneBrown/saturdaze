import type { StoryObj } from '@storybook/angular';

import type { Cover } from 'components';

import { SAMPLE_PHOTO } from '../Media/media-sample';

export const Default: StoryObj<Cover & { title: string }> = {
  args: {
    media: { ...SAMPLE_PHOTO, credit: 'From Terre Bleu' },
    eyebrow: '16 – 17 May',
    title: 'This weekend',
    subtitle: 'Sunny Saturday for the lavender, a cloudy Sunday for the Rec Room.',
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-cover [media]="media" [eyebrow]="eyebrow" [title]="title" [subtitle]="subtitle">
        <sd-button slot="edit" variant="quiet" size="sm"><sd-icon name="edit" />Change photo</sd-button>
      </sd-cover>
    `,
  }),
};
