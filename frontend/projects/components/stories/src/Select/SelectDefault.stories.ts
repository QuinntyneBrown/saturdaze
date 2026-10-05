import { FormControl } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { Select } from 'components';

export const Default: StoryObj<Select> = {
  args: {
    label: 'Roughly how long',
    hint: '',
    required: false,
    options: [
      { value: '15', label: '15 min' },
      { value: '30', label: '30 min' },
      { value: '45', label: '45 min' },
      { value: '60', label: '60 min' },
      { value: '90', label: '90 min' },
    ],
  },
  render: (args) => ({
    props: { ...args, minutes: new FormControl('45') },
    template: `
      <div style="max-width: 360px">
        <sd-select [label]="label" [hint]="hint" [required]="required" [options]="options" [formControl]="minutes" />
      </div>
    `,
  }),
};
