import { FormControl } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { SegRadio } from 'components';

export const TwoOptions: StoryObj<SegRadio> = {
  render: () => ({
    props: {
      day: new FormControl('Saturday'),
      days: [
        { value: 'Saturday', label: 'Saturday' },
        { value: 'Sunday', label: 'Sunday' },
      ],
    },
    template: `
      <div style="max-width: 360px">
        <sd-seg-radio label="Day" [options]="days" [formControl]="day" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'A weekly commitment (swim lessons, soccer) happens on one day, so the commitment dialog offers just two. Three options add `.seg-radio--3`.',
      },
    },
  },
};
