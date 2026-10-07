import type { StoryObj } from '@storybook/angular';

import type { PhotoPick } from 'components';

import { SAMPLE_PHOTO } from '../Media/media-sample';

export const Default: StoryObj<PhotoPick> = {
  render: () => ({
    props: { photo: SAMPLE_PHOTO, next: 'meadow' },
    template: `
      <sd-photo-pick style="max-width: 520px" label="Next primary" showLabel>
        <sd-photo-pick-option name="next" value="meadow" [checked]="next === 'meadow'" [media]="photo"
          label="Curated · Wildflower meadow" caption="Curated · Wildflower meadow" (picked)="next = $event" />
        <sd-photo-pick-option name="next" value="shore" [checked]="next === 'shore'" [media]="photo"
          label="Curated · Creek bed" caption="Curated · Creek bed" (picked)="next = $event" />
        <sd-photo-pick-option name="next" value="none" [checked]="next === 'none'" label="No photo" plain
          (picked)="next = $event">
          <sd-icon name="close" />
          No photo
        </sd-photo-pick-option>
      </sd-photo-pick>
    `,
  }),
};
