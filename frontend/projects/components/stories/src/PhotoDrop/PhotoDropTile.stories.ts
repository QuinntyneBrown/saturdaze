import type { StoryObj } from '@storybook/angular';

import type { PhotoDrop } from 'components';

import { SAMPLE_PHOTO } from '../Media/media-sample';

export const Tile: StoryObj<PhotoDrop> = {
  render: () => ({
    props: { src: SAMPLE_PHOTO.src },
    template: `
      <sd-photo-pick style="max-width: 520px" label="Choose a cover photo">
        <sd-photo-drop tile label="Upload your own photo">
          <sd-icon name="plus" />
          Your own photo
        </sd-photo-drop>
        <sd-photo-drop tile label="Upload your own photo" [src]="src" caption="Your photo" chosen />
      </sd-photo-pick>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`tile` makes it a 4:3 cell of an `sd-photo-pick` (the weekend cover\'s "Your own photo"); `chosen` draws the picked ring when it is the group\'s choice.',
      },
    },
  },
};
