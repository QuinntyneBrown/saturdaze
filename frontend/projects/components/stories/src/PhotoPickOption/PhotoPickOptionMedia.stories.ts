import type { StoryObj } from '@storybook/angular';

import type { PhotoPickOption } from 'components';

import { SAMPLE_PHOTO } from '../Media/media-sample';

export const Media: StoryObj<PhotoPickOption> = {
  render: () => ({
    props: { photo: SAMPLE_PHOTO },
    template: `
      <sd-photo-pick style="max-width: 520px" label="Next primary">
        <sd-photo-pick-option name="next" value="a" [media]="photo" label="Curated · Lavender rows"
          caption="Curated · Lavender rows" checked />
        <sd-photo-pick-option name="next" value="b" [media]="null" label="Provider · blocked address"
          caption="Provider · blocked address" />
      </sd-photo-pick>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'With `media` the photo goes through `sd-media` (the caption stands in for its credit chip); a photo that cannot be shown (`null`) is the tinted fallback tile.',
      },
    },
  },
};
