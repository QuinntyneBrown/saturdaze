import type { StoryObj } from '@storybook/angular';

import type { PhotoPickOption } from 'components';

import { SAMPLE_PHOTO } from '../Media/media-sample';

export const Default: StoryObj<PhotoPickOption> = {
  args: {
    name: 'cover',
    value: 'harbour',
    checked: true,
    label: 'Port Credit Harbour',
    caption: 'Port Credit Harbour',
    src: SAMPLE_PHOTO.src,
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-photo-pick style="max-width: 520px" label="Choose a cover photo">
        <sd-photo-pick-option [name]="name" [value]="value" [checked]="checked" [label]="label"
          [caption]="caption" [src]="src" />
      </sd-photo-pick>
    `,
  }),
};
