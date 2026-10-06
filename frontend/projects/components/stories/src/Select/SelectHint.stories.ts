import { FormControl } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { Select } from 'components';

export const Hint: StoryObj<Select> = {
  render: () => ({
    props: {
      radius: new FormControl('25'),
      options: [
        { value: '10', label: 'Within 10 km' },
        { value: '25', label: 'Within 25 km' },
        { value: '50', label: 'Within 50 km' },
        { value: '100', label: 'Up to an hour away' },
      ],
    },
    template: `
      <div style="max-width: 360px">
        <sd-select label="How far will you drive" required [options]="options" [formControl]="radius" hint="Ideas further than this are left out." />
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: '`hint` adds a `.field__hint` line; `required` adds the "Required" marker to the label.' } },
  },
};
