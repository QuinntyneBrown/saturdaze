import type { StoryObj } from '@storybook/angular';

import type { Media } from 'components';

import { SAMPLE_PHOTO } from './media-sample';

export const Default: StoryObj<Media> = {
  args: { photo: SAMPLE_PHOTO },
  render: (args) => ({
    props: args,
    template: `<sd-media style="max-width: 360px" [photo]="photo" />`,
  }),
};
