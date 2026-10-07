import type { StoryObj } from '@storybook/angular';

import type { PhotoPick } from 'components';

import { SAMPLE_PHOTO } from '../Media/media-sample';

export const WithUpload: StoryObj<PhotoPick> = {
  render: () => ({
    props: { src: SAMPLE_PHOTO.src, picked: 'harbour' },
    template: `
      <sd-photo-pick style="max-width: 520px" label="Choose a cover photo">
        <sd-photo-pick-option name="cover" value="harbour" [checked]="picked === 'harbour'" [src]="src"
          label="Port Credit Harbour" caption="Port Credit Harbour" (picked)="picked = $event" />
        <sd-photo-pick-option name="cover" value="marina" [checked]="picked === 'marina'" [src]="src"
          label="La Marina" caption="La Marina" (picked)="picked = $event" />
        <sd-photo-drop tile label="Upload your own photo" [chosen]="picked === 'upload'">
          <sd-icon name="plus" />
          Your own photo
        </sd-photo-drop>
      </sd-photo-pick>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          "The weekend cover (D29): each stop's photo as a plain `src` image, and an `sd-photo-drop tile` as the last option for the family's own photo.",
      },
    },
  },
};
