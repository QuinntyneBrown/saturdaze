import type { StoryObj } from '@storybook/angular';

import type { SlotPreview } from 'components';

import { SAMPLE_PHOTO } from '../Media/media-sample';

export const Default: StoryObj<SlotPreview> = {
  args: {
    media: SAMPLE_PHOTO,
    name: 'Port Credit Memorial Park',
    meta: 'Port Credit',
    tone: 'leaf',
    icon: 'tree',
  },
  render: (args) => ({
    props: args,
    template: `<sd-slot-preview [media]="media" [name]="name" [meta]="meta" [tone]="tone" [icon]="icon" />`,
  }),
};
