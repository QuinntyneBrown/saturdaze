import type { StoryObj } from '@storybook/angular';

import type { Media } from 'components';

import { SAMPLE_PHOTO } from './media-sample';

export const Ratio: StoryObj<Media> = {
  args: { photo: SAMPLE_PHOTO },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 220px)); gap: 12px">
        <sd-media [photo]="photo" ratio="16:9" />
        <sd-media [photo]="photo" ratio="4:3" />
      </div>
    `,
  }),
};
