import { FormControl } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { Select } from 'components';

export const Disabled: StoryObj<Select> = {
  render: () => ({
    props: {
      minutes: new FormControl({ value: '60', disabled: true }),
      options: [
        { value: '30', label: '30 min' },
        { value: '60', label: '60 min' },
        { value: '90', label: '90 min' },
      ],
    },
    template: `
      <div style="max-width: 360px">
        <sd-select label="Roughly how long" [options]="options" [formControl]="minutes" hint="Locked while the planner places the errand." />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: { story: 'There is no `disabled` input: disable the bound control and `setDisabledState` disables the native select.' },
    },
  },
};
