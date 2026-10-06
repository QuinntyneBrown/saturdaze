import { FormControl } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { SegRadio } from 'components';

export const Default: StoryObj<SegRadio> = {
  args: {
    label: 'Which day',
    options: [
      { value: 'Saturday', label: 'Saturday' },
      { value: 'Sunday', label: 'Sunday' },
      { value: 'either', label: 'Either' },
    ],
  },
  render: (args) => ({
    props: { ...args, day: new FormControl('either') },
    template: `
      <div style="max-width: 360px">
        <sd-seg-radio [label]="label" [options]="options" [formControl]="day" />
      </div>
    `,
  }),
};
