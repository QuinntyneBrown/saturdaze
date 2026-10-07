import type { StoryObj } from '@storybook/angular';

import type { PhotoDrop } from 'components';

import { SAMPLE_PHOTO } from '../Media/media-sample';

export const Preview: StoryObj<PhotoDrop> = {
  args: {
    label: 'Choose a photo',
    src: SAMPLE_PHOTO.src,
    caption: 'riverwood.jpg · 0.8 MB · 1920 × 1080',
  },
  render: (args) => ({
    props: args,
    template: `<sd-photo-drop style="max-width: 480px" [label]="label" [src]="src" [caption]="caption" />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Once the screen accepts a file it passes a preview back as `src`: the zone becomes a 4:3 preview no taller than 240px, with the file described in the caption. Choosing again replaces it.',
      },
    },
  },
};
