import { FormControl } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { SegRadio } from 'components';

export const Disabled: StoryObj<SegRadio> = {
  render: () => ({
    props: {
      day: new FormControl({ value: 'Sunday', disabled: true }),
      days: [
        { value: 'Saturday', label: 'Saturday' },
        { value: 'Sunday', label: 'Sunday' },
        { value: 'either', label: 'Either' },
      ],
    },
    template: `
      <div style="max-width: 360px">
        <sd-seg-radio label="Which day" [options]="days" [formControl]="day" />
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Disable the bound control; every radio is disabled and clicks are ignored.' } },
  },
};
